import { MAX_VOICE_CHARACTERS, wakeRequest } from "./commands";

export type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
export type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
export interface BrowserRecognition {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  processLocally?: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void; abort(): void;
}
export interface RecognitionConstructor {
  new(): BrowserRecognition;
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<string>;
  install?: (options: { langs: string[] }) => Promise<boolean>;
}

export type CaptureState = "idle" | "starting" | "waiting" | "recording" | "reviewing";
type Callbacks = {
  state: (state: CaptureState) => void;
  interim: (text: string) => void;
  transcript: (text: string) => void;
  wake: () => void;
  error: (message: string) => void;
};

/** One recognizer owner. Invalidating its generation makes late browser callbacks harmless. */
export class VoiceRecognitionSession {
  private recognition: BrowserRecognition | null = null;
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;
  private mode: "wake" | "dictate" | null = null;
  private local = true;
  private activated = false;
  private text = "";
  private restartCount = 0;
  private deadline = 0;
  private wakeFragment = "";
  private wakeFragmentAt = 0;

  constructor(private readonly Constructor: RecognitionConstructor, private readonly callbacks: Callbacks) {}

  stop() {
    this.generation++;
    this.mode = null;
    clearTimeout(this.timer); clearTimeout(this.restartTimer);
    const recognition = this.recognition;
    this.recognition = null;
    if (recognition) {
      recognition.onresult = recognition.onend = recognition.onerror = recognition.onstart = null;
      recognition.abort();
    }
    this.callbacks.interim("");
    this.callbacks.state("idle");
  }

  async start(mode: "wake" | "dictate", local: boolean) {
    this.stop();
    this.mode = mode; this.local = local; this.activated = mode === "dictate"; this.text = ""; this.wakeFragment = ""; this.restartCount = 0;
    this.deadline = Date.now() + (mode === "dictate" ? 30_000 : 5 * 60_000);
    const generation = this.generation;
    this.callbacks.error(""); this.callbacks.state("starting");
    try {
      if (local) {
        const probe = new this.Constructor();
        if (!("processLocally" in probe)) throw new Error("La reconnaissance locale est indisponible. Choisissez le service du navigateur ou utilisez le clavier.");
        if (this.Constructor.available && await this.Constructor.available({ langs: ["fr-FR"], processLocally: true }) !== "available") {
          throw new Error("Le français local n’est pas installé. Installez le pack français ou choisissez le service du navigateur.");
        }
      }
      if (generation === this.generation) this.listen(generation);
    } catch (error) {
      if (generation !== this.generation) return;
      this.stop(); this.callbacks.error(error instanceof Error ? error.message : "Impossible de démarrer le microphone.");
    }
  }

  private armTimeout(generation: number, delay: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (generation !== this.generation) return;
      if (this.text.trim()) this.finish();
      else { this.stop(); this.callbacks.error("Aucune demande entendue. Réactivez le microphone pour réessayer."); }
    }, Math.max(0, Math.min(delay, this.deadline - Date.now())));
  }

  private finish() {
    const text = this.text.trim();
    this.stop();
    if (!text) return;
    if (text.length > MAX_VOICE_CHARACTERS) { this.callbacks.error("Demande trop longue (2000 caractères maximum). Dictez une demande plus courte."); return; }
    this.callbacks.state("reviewing"); this.callbacks.transcript(text);
  }

  private listen(generation: number) {
    if (generation !== this.generation || !this.mode) return;
    const recognition = new this.Constructor();
    this.recognition = recognition;
    recognition.lang = "fr-FR"; recognition.continuous = true; recognition.interimResults = true; recognition.maxAlternatives = 1;
    if ("processLocally" in recognition) recognition.processLocally = this.local;
    recognition.onstart = () => {
      if (generation !== this.generation || this.recognition !== recognition) return;
      this.callbacks.state(this.activated ? "recording" : "waiting");
    };
    // Wake listening is bounded too, so it cannot run indefinitely after being forgotten.
    this.armTimeout(generation, this.activated ? 30_000 : 5 * 60_000);
    recognition.onresult = (event) => {
      if (generation !== this.generation || this.recognition !== recognition) return;
      this.restartCount = 0;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const raw = result[0].transcript.trim();
        if (!result.isFinal) { if (this.activated) interim += raw; continue; }
        if (!this.activated) {
          const candidate = this.wakeFragment && Date.now() - this.wakeFragmentAt < 3000 ? `${this.wakeFragment} ${raw}` : raw;
          const request = wakeRequest(candidate) ?? wakeRequest(raw);
          this.wakeFragment = /^bonjour[\s,.!?]*$/i.test(raw) ? "bonjour" : "";
          this.wakeFragmentAt = Date.now();
          if (request === null) continue;
          this.wakeFragment = "";
          this.activated = true; this.callbacks.wake(); this.callbacks.state("recording");
          this.deadline = Date.now() + 30_000;
          this.text = request;
          this.armTimeout(generation, request ? 1400 : 10_000);
        } else {
          this.text = [this.text, wakeRequest(raw) ?? raw].filter(Boolean).join(" ");
          this.armTimeout(generation, 1400);
        }
        if (this.text.length > MAX_VOICE_CHARACTERS) { this.finish(); return; }
      }
      this.callbacks.interim([this.text, interim].filter(Boolean).join(" "));
      if (interim) this.armTimeout(generation, 5000);
    };
    recognition.onerror = ({ error }) => {
      if (generation !== this.generation || this.recognition !== recognition) return;
      if (error === "no-speech") return; // onend restarts a bounded waiting session.
      this.stop();
      const messages: Record<string, string> = {
        "not-allowed": "Microphone refusé. Autorisez-le dans les paramètres du navigateur.",
        "service-not-allowed": "Le service de reconnaissance vocale est désactivé dans ce navigateur.",
        "audio-capture": "Aucun microphone disponible. Vérifiez sa connexion.",
        "language-not-supported": "Le français local est indisponible. Installez le pack ou choisissez le service du navigateur.",
        network: "Reconnaissance indisponible. Vérifiez votre connexion puis réessayez.",
      };
      this.callbacks.error(messages[error] ?? "Reconnaissance interrompue. Réactivez le microphone pour réessayer.");
    };
    recognition.onend = () => {
      if (generation !== this.generation || this.recognition !== recognition) return;
      this.recognition = null;
      if (this.text.trim()) { this.finish(); return; }
      if (++this.restartCount > 6) { this.stop(); this.callbacks.error("L’écoute s’est arrêtée. Réactivez le microphone pour continuer."); return; }
      this.restartTimer = setTimeout(() => this.listen(generation), 350);
    };
    try { recognition.start(); }
    catch { this.stop(); this.callbacks.error("Le microphone ne peut pas démarrer. Réessayez après avoir vérifié les autorisations."); }
  }
}
