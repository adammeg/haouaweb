import { spokenText } from "./spoken-text";

/** Keep numeric decimals intact and do not treat a token-boundary period as a final sentence. */
export class VoiceSentenceBuffer {
  private buffer = "";
  push(delta: string): string[] {
    this.buffer += delta;
    const sentences: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = /[.!?][\s]+/.exec(this.buffer))) {
      const end = match.index + match[0].length;
      const text = this.buffer.slice(0, end).trim(); this.buffer = this.buffer.slice(end);
      if (text) sentences.push(text);
    }
    if (this.buffer.length > 240) {
      const boundary = this.buffer.lastIndexOf(" ", 220);
      if (boundary > 80) { sentences.push(this.buffer.slice(0, boundary)); this.buffer = this.buffer.slice(boundary + 1); }
    }
    return sentences;
  }
  flush(): string { const text = this.buffer.trim(); this.buffer = ""; return text; }
}

export type SpeechStreamCallbacks = { start: (text: string) => void; waiting: () => void; done: () => void; error: (message?: string) => void };
export type SpeechStream = { append: (text: string) => void; finish: () => void; cancel: () => void };
export class BrowserSpeechStream {
  private queue: string[] = [];
  private current: SpeechSynthesisUtterance | null = null;
  private sealed = false;
  private cancelled = false;
  private startTimer: ReturnType<typeof setTimeout> | undefined;
  private endTimer: ReturnType<typeof setTimeout> | undefined;
  constructor(private readonly synthesis: SpeechSynthesis, private readonly create: (text: string) => SpeechSynthesisUtterance, private readonly callbacks: SpeechStreamCallbacks) {}
  append(text: string) {
    if (this.cancelled || this.sealed || !text.trim()) return;
    this.queue.push(spokenText(text)); this.playNext();
  }
  finish() { if (!this.cancelled) { this.sealed = true; this.playNext(); } }
  cancel() {
    if (this.cancelled) return;
    this.cancelled = true; this.queue = [];
    clearTimeout(this.startTimer); clearTimeout(this.endTimer);
    if (this.current) this.current.onstart = this.current.onend = this.current.onerror = null;
    this.current = null; this.synthesis.cancel();
  }
  private playNext() {
    if (this.cancelled || this.current) return;
    const text = this.queue.shift();
    if (!text) { if (this.sealed) { this.cancelled = true; this.callbacks.done(); } else this.callbacks.waiting(); return; }
    const utterance = this.create(text); this.current = utterance;
    const failed = () => { if (this.current !== utterance || this.cancelled) return; this.cancel(); this.callbacks.error(); };
    utterance.onstart = () => { if (this.current === utterance && !this.cancelled) { clearTimeout(this.startTimer); this.callbacks.start(text); } };
    utterance.onend = () => {
      if (this.current !== utterance || this.cancelled) return;
      clearTimeout(this.startTimer); clearTimeout(this.endTimer);
      utterance.onstart = utterance.onend = utterance.onerror = null; this.current = null; this.playNext();
    };
    utterance.onerror = failed;
    this.startTimer = setTimeout(failed, 6000); this.endTimer = setTimeout(failed, 90_000);
    try { this.synthesis.speak(utterance); } catch { failed(); }
  }
}
