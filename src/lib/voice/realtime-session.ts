export type RealtimeState = "connecting" | "listening" | "thinking" | "speaking" | "closed";
export type RealtimeToolCall = { callId: string; request: string; turn: number };
type Callbacks = { state: (state: RealtimeState) => void; interrupt: () => void; transcript: (text: string) => void; tool: (call: RealtimeToolCall) => void; error: (message: string) => void; close: () => void };

/** Owns audio, tracks and events for one conversation. No application data is preloaded. */
export class RealtimeVoiceSession {
  private peer: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private stream: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private abort = new AbortController();
  private closed = false;
  private turn = 0;
  private responseId: string | null = null;
  private outputId: string | null = null;
  private cancelledResponses = new Set<string>();
  private inputSpeaking = false;
  private awaitingOutput = false;
  private pending = new Set<string>();
  private seenCalls = new Set<string>();
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private maxTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly callbacks: Callbacks) {}
  get isClosed() { return this.closed; }

  private send(event: Record<string, unknown>) {
    if (!this.closed && this.channel?.readyState === "open") this.channel.send(JSON.stringify(event));
  }
  private touch() { clearTimeout(this.idleTimer); this.idleTimer = setTimeout(() => this.close(), 90_000); }

  async connect(initialRequest: string) {
    this.callbacks.state("connecting");
    this.maxTimer = setTimeout(() => this.close(), 10 * 60_000);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (this.closed) { stream.getTracks().forEach((track) => track.stop()); return; }
      this.stream = stream;
      this.peer = new RTCPeerConnection();
      const audio = document.createElement("audio"); audio.autoplay = true; this.audio = audio;
      this.peer.ontrack = (event) => { if (!this.closed) { audio.srcObject = event.streams[0]; void audio.play().catch(() => this.callbacks.error("Touchez la barre pour autoriser la lecture audio.")); } };
      stream.getAudioTracks().forEach((track) => this.peer!.addTrack(track, stream));
      const channel = this.peer.createDataChannel("oai-events"); this.channel = channel;
      channel.onmessage = (event) => this.receive(event.data);
      channel.onclose = () => this.close();
      this.peer.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(this.peer?.connectionState ?? "")) this.close();
      };
      const opened = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connexion audio trop longue.")), 18_000);
        const aborted = () => { clearTimeout(timeout); reject(new DOMException("Aborted", "AbortError")); };
        this.abort.signal.addEventListener("abort", aborted, { once: true });
        channel.onopen = () => { clearTimeout(timeout); this.abort.signal.removeEventListener("abort", aborted); resolve(); };
      });
      // Observe rejection immediately, even while the SDP request is still pending.
      void opened.catch(() => {});
      const offer = await this.peer.createOffer(); await this.peer.setLocalDescription(offer);
      const response = await fetch("/api/voice/realtime", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/sdp" }, body: offer.sdp,
        signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(16_000)]) });
      if (!response.ok) {
        const data = await response.json().catch(() => null); throw new Error(data?.error || "Audio temps réel indisponible.");
      }
      const answer = await response.text();
      if (this.closed) return;
      await this.peer.setRemoteDescription({ type: "answer", sdp: answer }); await opened;
      if (this.closed) return;
      this.touch(); this.callbacks.state("listening");
      if (initialRequest.trim()) {
        this.send({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: initialRequest }] } });
        this.send({ type: "response.create" });
      }
    } catch (cause) {
      if (!this.closed) { this.callbacks.error(cause instanceof Error ? cause.message : "Audio temps réel indisponible."); this.close(); throw cause; }
    }
  }

  /** Called at speech onset, not at transcript finalization. Silence output immediately. */
  interrupt() {
    if (this.closed) return;
    this.turn++; this.pending.clear(); this.touch();
    if (this.audio) { this.audio.muted = true; this.audio.pause(); }
    if (this.responseId) { this.cancelledResponses.add(this.responseId); this.send({ type: "response.cancel", response_id: this.responseId }); }
    if (this.outputId) this.cancelledResponses.add(this.outputId);
    this.outputId = null;
    this.responseId = null;
    this.awaitingOutput = true;
    this.send({ type: "output_audio_buffer.clear" });
    this.callbacks.interrupt(); this.callbacks.state("listening");
  }

  completeTool(call: RealtimeToolCall, reply: string) {
    if (this.closed || call.turn !== this.turn || !this.pending.delete(call.callId)) return false;
    this.send({ type: "conversation.item.create", item: { type: "function_call_output", call_id: call.callId, output: JSON.stringify({ reply }) } });
    this.send({ type: "response.create" }); this.touch(); return true;
  }
  say(text: string) {
    if (this.closed) return;
    this.interrupt();
    this.send({ type: "response.create", response: { instructions: `Lis fidèlement ce retour de l’application, sans rien ajouter : ${JSON.stringify(text)}` } });
  }

  receive(raw: unknown) {
    if (this.closed || typeof raw !== "string" || raw.length > 128_000) return;
    let event: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      event = parsed as Record<string, unknown>;
    } catch { return; }
    switch (event.type) {
      case "input_audio_buffer.speech_started": this.inputSpeaking = true; this.interrupt(); break;
      case "input_audio_buffer.speech_stopped": this.inputSpeaking = false; this.touch(); this.callbacks.state("thinking"); break;
      case "conversation.item.input_audio_transcription.completed":
        if (typeof event.transcript === "string") this.callbacks.transcript(event.transcript); break;
      case "response.created": {
        const id = (event.response as { id?: unknown } | null)?.id;
        if (typeof id !== "string" || this.cancelledResponses.has(id)) break;
        if (this.inputSpeaking) {
          this.cancelledResponses.add(id); this.send({ type: "response.cancel", response_id: id });
          break;
        }
        this.responseId = id; this.outputId = id;
        this.awaitingOutput = false; this.touch(); this.callbacks.state("thinking"); break;
      }
      case "output_audio_buffer.started":
        if (this.inputSpeaking || this.awaitingOutput || this.cancelledResponses.has(String(event.response_id)) || (typeof event.response_id === "string" && this.outputId !== event.response_id)) break;
        this.touch(); if (this.audio) { this.audio.muted = false; void this.audio.play().catch(() => this.callbacks.error("Touchez la barre pour autoriser la lecture audio.")); }
        this.callbacks.state("speaking"); break;
      case "output_audio_buffer.stopped":
        if (this.inputSpeaking || this.cancelledResponses.has(String(event.response_id)) || (typeof event.response_id === "string" && this.outputId !== event.response_id)) break;
        this.touch(); this.callbacks.state("listening"); break;
      case "response.done":
        if ((event.response as { id?: unknown } | null)?.id === this.responseId) this.responseId = null;
        break;
      case "response.function_call_arguments.done": {
        if (this.inputSpeaking || this.cancelledResponses.has(String(event.response_id))) return;
        if (event.name !== "hawae_request" || typeof event.call_id !== "string" || typeof event.arguments !== "string" || event.arguments.length > 10_000) return;
        let args: { request?: unknown } | null; try { args = JSON.parse(event.arguments); } catch { return; }
        if (!args || typeof args.request !== "string" || !args.request.trim() || args.request.length > 2000 || this.seenCalls.has(event.call_id)) return;
        this.seenCalls.add(event.call_id);
        if (this.pending.size) {
          this.send({ type: "conversation.item.create", item: { type: "function_call_output", call_id: event.call_id, output: JSON.stringify({ error: "Une demande est déjà en cours. Attendez son résultat." }) } }); return;
        }
        this.pending.add(event.call_id); this.touch(); this.callbacks.state("thinking");
        this.callbacks.tool({ callId: event.call_id, request: args.request, turn: this.turn }); break;
      }
      case "error":
        // Cancellation may race automatic VAD cancellation; neither should resurrect audio.
        if (!String((event.error as { code?: string } | undefined)?.code).includes("cancel")) this.callbacks.error("Le service audio a signalé une erreur. Réessayez votre demande."); break;
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true; this.turn++; this.pending.clear(); this.abort.abort();
    clearTimeout(this.idleTimer); clearTimeout(this.maxTimer);
    if (this.audio) { this.audio.pause(); this.audio.srcObject = null; this.audio.remove(); this.audio = null; }
    this.stream?.getTracks().forEach((track) => track.stop()); this.stream = null;
    this.channel?.close(); this.peer?.close(); this.peer = null; this.channel = null;
    this.callbacks.state("closed"); this.callbacks.close();
  }
}
