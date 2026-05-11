/**
 * Streams assistant text from an OpenAI-compatible Chat Completions endpoint (SSE)
 * into a plain UTF-8 byte stream. Works with OpenAI, OpenRouter, etc.
 */

const encoder = new TextEncoder();

export class OpenAiChatError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "OpenAiChatError";
  }
}

async function* iterateSseTextDeltas(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const block of parts) {
      const lines = block.split("\n").map((l) => l.trim());
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data) as {
            choices?: { delta?: { content?: string | null } }[];
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) yield delta;
        } catch {
          /* ignore malformed chunk */
        }
      }
    }
  }
}

export async function createChatCompletionsTextStream(params: {
  url: string;
  headers: Record<string, string>;
  model: string;
  temperature: number;
  maxTokens: number;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
}): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(params.url, {
    method: "POST",
    headers: params.headers,
    body: JSON.stringify({
      model: params.model,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      stream: true,
      messages: params.messages,
    }),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let detail = raw;
    try {
      const j = JSON.parse(raw) as {
        error?: { message?: string; type?: string } | string;
      };
      if (typeof j.error === "object" && j.error?.message) {
        detail = j.error.message;
      } else if (typeof j.error === "string") {
        detail = j.error;
      }
    } catch {
      /* keep raw */
    }
    throw new OpenAiChatError(
      `Fournisseur IA (${res.status})`,
      res.status,
      detail.slice(0, 500),
    );
  }

  if (!res.body) {
    throw new OpenAiChatError("Réponse vide du fournisseur", 502);
  }

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of iterateSseTextDeltas(res.body!)) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
