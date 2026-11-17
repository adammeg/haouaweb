import { heygenSpokenText } from "./spoken-text";
import type { SpeechStreamCallbacks } from "./speech-stream";

/** Raw little-endian signed PCM16 may split a sample across HTTP chunks. */
export class Pcm16Decoder {
  private byte: number | undefined;
  decode(chunk: Uint8Array): Float32Array {
    const bytes = new Uint8Array(chunk.length + (this.byte === undefined ? 0 : 1));
    if (this.byte !== undefined) { bytes[0] = this.byte; bytes.set(chunk, 1); } else bytes.set(chunk);
    const length = bytes.length - bytes.length % 2;
    this.byte = bytes.length % 2 ? bytes[bytes.length - 1] : undefined;
    const samples = new Float32Array(length / 2), view = new DataView(bytes.buffer);
    for (let index = 0; index < samples.length; index++) samples[index] = view.getInt16(index * 2, true) / 32768;
    return samples;
  }
  finish() { if (this.byte !== undefined) throw new Error("Flux audio incomplet."); }
}

/** Schedules PCM as it arrives; interruption stops both active and future audio immediately. */
export class OpenRouterSpeechStream {
  private queue: string[] = [];
  private sealed = false;
  private cancelled = false;
  private processing = false;
  private abort = new AbortController();
  private sources = new Set<AudioBufferSourceNode>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private playhead = 0;

  constructor(private readonly context: AudioContext, private readonly callbacks: SpeechStreamCallbacks) {}
  append(text: string) {
    if (this.cancelled || this.sealed || !text.trim()) return;
    const value = heygenSpokenText(text);
    if (value.length > 5000) { this.fail("Réponse vocale trop longue. Demandez une réponse plus courte."); return; }
    this.queue.push(value); void this.pump();
  }
  finish() { if (!this.cancelled) { this.sealed = true; void this.pump(); } }
  cancel() {
    if (this.cancelled) return;
    this.cancelled = true; this.queue = []; this.abort.abort();
    for (const timer of this.timers) clearTimeout(timer); this.timers.clear();
    for (const source of this.sources) { source.onended = null; try { source.stop(); } catch { /* Already ended. */ } source.disconnect(); }
    this.sources.clear();
  }
  private fail(message: string) { if (!this.cancelled) { this.cancel(); this.callbacks.error(message); } }
  private settled() {
    if (this.cancelled || this.processing || this.sources.size || this.queue.length) return;
    if (this.sealed) { this.cancelled = true; this.callbacks.done(); }
    else this.callbacks.waiting();
  }
  private schedule(samples: Float32Array, rate: number, text: string, first: boolean) {
    if (this.cancelled || !samples.length) return;
    const buffer = this.context.createBuffer(1, samples.length, rate); buffer.getChannelData(0).set(samples);
    const source = this.context.createBufferSource(); source.buffer = buffer; source.connect(this.context.destination);
    const start = Math.max(this.context.currentTime + .035, this.playhead); this.playhead = start + buffer.duration;
    this.sources.add(source);
    source.onended = () => { this.sources.delete(source); source.disconnect(); this.settled(); };
    source.start(start);
    if (first) {
      const timer = setTimeout(() => { this.timers.delete(timer); if (!this.cancelled && this.context.state === "running") this.callbacks.start(text); }, Math.max(0, start - this.context.currentTime) * 1000);
      this.timers.add(timer);
    }
  }
  private async pump() {
    if (this.cancelled || this.processing) return;
    if (!this.queue.length) { this.settled(); return; }
    // Coalesce sentences collected while the previous request was streaming.
    let text = this.queue.shift()!;
    while (this.queue.length && text.length + this.queue[0].length + 1 <= 5000) text += ` ${this.queue.shift()!}`;
    this.processing = true;
    let unlockTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([this.context.resume(), new Promise<never>((_, reject) => {
        unlockTimer = setTimeout(() => reject(new Error("Touchez la barre pour autoriser la lecture audio.")), 6000); this.timers.add(unlockTimer);
      })]);
      if (unlockTimer) { clearTimeout(unlockTimer); this.timers.delete(unlockTimer); }
      if (this.cancelled) return;
      if (this.context.state !== "running") throw new Error("Touchez la barre pour autoriser la lecture audio.");
      const response = await fetch("/api/voice/speech", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }), signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(30_000)]) });
      if (this.cancelled) { await response.body?.cancel(); return; }
      if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error || "La voix OpenRouter est indisponible."); }
      const rate = Number(response.headers.get("X-Hawae-Audio-Sample-Rate"));
      if (!response.body || rate !== 44_100 || !response.headers.get("content-type")?.startsWith("audio/pcm")) { await response.body?.cancel(); throw new Error("Format audio incompatible."); }
      const reader = response.body.getReader(), decoder = new Pcm16Decoder();
      let received = false, first = true, total = 0, pending = new Uint8Array();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (this.cancelled) return;
          if (value) {
            total += value.byteLength; if (total > rate * 2 * 180) throw new Error("Audio trop long.");
            const combined = new Uint8Array(pending.length + value.length); combined.set(pending); combined.set(value, pending.length); pending = combined;
          }
          // Roughly 90 ms per buffer, avoiding thousands of tiny scheduled nodes.
          if (pending.length >= 8192 || done) {
            const samples = decoder.decode(pending); pending = new Uint8Array();
            if (samples.length) { this.schedule(samples, rate, text, first); first = false; received = true; }
          }
          if (done) break;
        }
        decoder.finish(); if (!received) throw new Error("Aucun audio reçu.");
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    } catch (cause) {
      this.fail(cause instanceof Error ? cause.message : "Lecture audio interrompue.");
    } finally {
      if (unlockTimer) { clearTimeout(unlockTimer); this.timers.delete(unlockTimer); }
      this.processing = false;
      if (!this.cancelled) { if (this.queue.length) void this.pump(); else this.settled(); }
    }
  }
}
