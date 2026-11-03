/** OpenAI-compatible transport. Completion errors/truncation never become cached success. */
const encoder = new TextEncoder();
export class OpenAiChatError extends Error {
  readonly status: number;
  readonly detail?: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "OpenAiChatError";
    this.status = status;
    this.detail = detail;
  }
}

type ChatParams = {
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

async function request(params: ChatParams, stream: boolean, signal: AbortSignal) {
  const res = await fetch(params.url, {
    method: "POST", headers: params.headers, signal,
    body: JSON.stringify({ model: params.model, temperature: params.temperature, max_tokens: params.maxTokens, stream, messages: params.messages, ...(params.responseFormat ? { response_format: params.responseFormat } : {}), ...(params.requireParameters ? { provider: { require_parameters: true } } : {}) }),
  });
  if (!res.ok) throw new OpenAiChatError(`Fournisseur IA (${res.status})`, res.status, (await res.text()).slice(0, 500));
  if (!res.body) throw new OpenAiChatError("Réponse fournisseur vide", 502);
  return res;
}

export async function createChatCompletion(params: ChatParams): Promise<string> {
  const signal = AbortSignal.any([AbortSignal.timeout(90_000), ...(params.signal ? [params.signal] : [])]);
  const res = await request(params, false, signal);
  const data = await res.json() as { error?: unknown; choices?: { finish_reason?: string; message?: { content?: string; refusal?: string } }[] };
  const choice = data.choices?.[0];
  if (data.error || choice?.message?.refusal) throw new OpenAiChatError("Réponse modèle refusée", 502);
  if (choice?.finish_reason !== "stop") throw new OpenAiChatError("Réponse modèle incomplète ou interrompue", 502);
  const text = choice.message?.content?.trim();
  if (!text) throw new OpenAiChatError("Réponse modèle vide", 502);
  return text;
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
