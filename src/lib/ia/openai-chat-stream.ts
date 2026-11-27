/** OpenAI-compatible transport. Completion errors/truncation never become cached success. */
const encoder = new TextEncoder();
export class OpenAiChatError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "OpenAiChatError";
    this.status = status;
  }
}

type ChatParams = {
  provider: "openai" | "openrouter";
  url: string;
  headers: Record<string, string>;
  model: string;
  temperature: number;
  maxTokens: number;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  signal?: AbortSignal;
  responseFormat?: Record<string, unknown>;
  requireParameters?: boolean;
};

function providerRejection(status: number, reason: string, requestId: string | null) {
  let message = `Le fournisseur IA a rejeté la requête (HTTP ${status}).`;
  if (/context_length_exceeded|maximum context length|context window/i.test(reason)) {
    message += " Le dossier dépasse la capacité de contexte du modèle.";
  } else if (/response_format|json_schema|structured outputs/i.test(reason)) {
    message += " Vérifiez la prise en charge du schéma JSON par le modèle configuré.";
  } else if (/model_not_found|invalid model|not a valid model|no endpoints found/i.test(reason)) {
    message += " Vérifiez que le modèle configuré est disponible pour les requêtes de chat.";
  }
  if (requestId && /^[\w-]{1,100}$/.test(requestId)) message += ` Référence fournisseur : ${requestId}.`;
  return new OpenAiChatError(message, status);
}

async function request(params: ChatParams, stream: boolean, signal: AbortSignal) {
  let tokenParameter = params.provider === "openai" ? "max_completion_tokens" : "max_tokens";
  let temperature: number | undefined = params.temperature;
  for (;;) {
    const res = await fetch(params.url, {
      method: "POST", headers: params.headers, signal,
      body: JSON.stringify({
        model: params.model, stream, messages: params.messages, temperature,
        [tokenParameter]: params.maxTokens,
        response_format: params.responseFormat,
        provider: params.requireParameters ? { require_parameters: true } : undefined,
      }),
    });
    if (res.ok) {
      if (!res.body) throw new OpenAiChatError("Réponse fournisseur vide", 502);
      return res;
    }
    // Provider messages can quote clinical input. Use them only to identify known errors.
    const envelope = await res.json().catch(() => null);
    const error = envelope?.error;
    const reason = [error?.code, error?.param, error?.message, error?.metadata?.raw]
      .filter((value) => typeof value === "string").join(" ");
    if (res.status === 400 && tokenParameter === "max_tokens" &&
        /\bmax_tokens\b/i.test(reason) && /use ['"`]?max_completion_tokens\b/i.test(reason)) {
      tokenParameter = "max_completion_tokens";
      continue;
    }
    if (res.status === 400 && temperature !== undefined &&
        /\btemperature\b/i.test(reason) && /unsupported|not supported|does not support|only the default/i.test(reason)) {
      temperature = undefined;
      continue;
    }
    throw providerRejection(res.status, reason, res.headers.get("x-request-id"));
  }
}

export async function createChatCompletion(params: ChatParams, retryTokenLimit = params.maxTokens): Promise<string> {
  const signal = AbortSignal.any([AbortSignal.timeout(90_000), ...(params.signal ? [params.signal] : [])]);
  let maxTokens = params.maxTokens;
  for (;;) {
    signal.throwIfAborted();
    const res = await request({ ...params, maxTokens }, false, signal);
    const data = await res.json() as { error?: unknown; choices?: {
      error?: unknown; finish_reason?: string | null; native_finish_reason?: string | null;
      message?: { content?: string; refusal?: string };
    }[] };
    const choice = data.choices?.[0];
    const reason = choice?.finish_reason ?? (params.provider === "openrouter" ? choice?.native_finish_reason : undefined);
    if (data.error || choice?.error || reason === "error") throw new OpenAiChatError("Le fournisseur IA a interrompu la génération sur une erreur.", 502);
    if (choice?.message?.refusal || reason === "content_filter") throw new OpenAiChatError("Le fournisseur IA a refusé de générer cette réponse.", 502);
    if (reason === "length") {
      if (maxTokens < retryTokenLimit) {
        maxTokens = retryTokenLimit;
        continue;
      }
      throw new OpenAiChatError(`La génération a atteint sa limite de longueur (plafond demandé : ${maxTokens} jetons).`, 502);
    }
    if (reason === "tool_calls" || reason === "function_call") throw new OpenAiChatError("Le modèle a demandé un outil au lieu de terminer sa réponse.", 502);
    if (reason !== "stop") throw new OpenAiChatError("Le fournisseur IA n’a pas confirmé la fin de la génération.", 502);
    const text = choice?.message?.content?.trim();
    if (!text) throw new OpenAiChatError("Réponse modèle vide", 502);
    return text;
  }
}

/** Incremental SSE: CRLF/LF/CR, split UTF-8, multiline data, explicit completion. */
async function* iterateSseTextDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let dataLines: string[] = [];
  let completed = false;
  let hasText = false;
  function event(): string | null {
    if (!dataLines.length) return null;
    const data = dataLines.join("\n");
    dataLines = [];
    if (data === "[DONE]") { completed = true; return null; }
    let json: { error?: unknown; choices?: { delta?: { content?: string; refusal?: string }; finish_reason?: string | null }[] };
    try { json = JSON.parse(data); } catch { throw new OpenAiChatError("Événement fournisseur invalide", 502); }
    if (json.error) throw new OpenAiChatError("Erreur pendant la génération", 502);
    const choice = json.choices?.[0];
    if (choice?.delta?.refusal) throw new OpenAiChatError("Génération refusée", 502);
    if (choice?.finish_reason && choice.finish_reason !== "stop") throw new OpenAiChatError("Génération incomplète", 502);
    if (choice?.finish_reason === "stop") completed = true;
    return typeof choice?.delta?.content === "string" ? choice.delta.content : null;
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      while (true) {
        const index = buffer.search(/[\r\n]/);
        if (index < 0 || (!done && buffer[index] === "\r" && index === buffer.length - 1)) break;
        const line = buffer.slice(0, index);
        const separatorLength = buffer[index] === "\r" && buffer[index + 1] === "\n" ? 2 : 1;
        buffer = buffer.slice(index + separatorLength);
        if (!line) {
          const text = event();
          if (text) { hasText = true; yield text; }
        } else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
      }
      if (done) break;
      // [DONE] is terminal; finish_reason=stop may be followed by usage and [DONE].
      if (completed && hasText && !dataLines.length && !buffer) break;
      if (buffer.length > 1_000_000) throw new OpenAiChatError("Événement fournisseur trop volumineux", 502);
    }
    if (!completed || !hasText) throw new OpenAiChatError("Flux modèle vide ou interrompu", 502);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function createChatCompletionsTextStream(params: ChatParams): Promise<ReadableStream<Uint8Array>> {
  const abort = new AbortController();
  const signal = AbortSignal.any([abort.signal, AbortSignal.timeout(90_000), ...(params.signal ? [params.signal] : [])]);
  const res = await request(params, true, signal);
  const iterator = iterateSseTextDeltas(res.body!);
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (cancelled) return;
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(next.value));
      } catch (error) { if (!cancelled) controller.error(error); }
    },
    async cancel() { cancelled = true; abort.abort(); await iterator.return(undefined); },
  });
}
