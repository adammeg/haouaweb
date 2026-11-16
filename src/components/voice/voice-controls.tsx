"use client";

import type { VoiceSessionControls } from "./use-voice-session";

export function VoiceControls({ voice, busy, readReplies, onReadReplies, autoSend, onAutoSend }: {
  voice: VoiceSessionControls; busy: boolean; readReplies: boolean; onReadReplies: (value: boolean) => void;
  autoSend: boolean; onAutoSend: (value: boolean) => void;
}) {
  const active = voice.state === "starting" || voice.state === "waiting" || voice.state === "recording";
  const status = voice.speaking ? "Hawae parle · voix générée" : busy ? "Hawae prépare sa réponse…" : {
    idle: "Microphone désactivé", starting: "Démarrage du microphone…", waiting: "En attente de « bonjour haoua »",
    recording: "Je vous écoute…", reviewing: "Relisez votre demande, puis envoyez-la",
  }[voice.state];
  return <div className="voice-controls">
    <div className="voice-status" role="status"><span className={active ? "voice-dot active" : "voice-dot"} aria-hidden />{status}</div>
    {!voice.supported ? <p>Reconnaissance vocale indisponible. Utilisez un navigateur compatible, en HTTPS, ou le clavier.</p> : <>
      <div className="voice-actions">
        <button type="button" disabled={busy || voice.installing} onClick={() => active || voice.wakeEnabled ? voice.stop() : voice.start("wake")} aria-pressed={voice.wakeEnabled}>
          {voice.wakeEnabled ? "Désactiver l’écoute" : "Activer « bonjour haoua »"}
        </button>
        <button type="button" disabled={busy || voice.installing} onClick={() => voice.state === "recording" ? voice.stop() : voice.start("dictate")}>{voice.state === "recording" ? "Annuler la dictée" : "Dicter"}</button>
        {(active || voice.speaking) && <button type="button" onClick={voice.stop}>Arrêter</button>}
      </div>
      {voice.interim && <p className="voice-interim" aria-live="off">{voice.interim}</p>}
      <details>
        <summary>Réglages vocaux</summary>
        <label>Reconnaissance
          <select value={voice.processing} onChange={(event) => voice.setProcessing(event.target.value as "local" | "browser")}>
            <option value="local">Sur cet appareil</option><option value="browser">Service du navigateur</option>
          </select>
        </label>
        {voice.processing === "local" ? <>
          <p>{voice.localSupported ? "Reconnaissance française locale. Un pack de langue peut être nécessaire." : "Le mode local n’est pas pris en charge ici. Choisissez le service du navigateur pour utiliser la voix."}</p>
          {voice.localSupported && <button type="button" disabled={voice.installing || busy} onClick={() => void voice.installLocal()}>{voice.installing ? "Installation…" : "Installer le français local"}</button>}
        </> : <label className="voice-check"><input type="checkbox" checked={voice.browserConsent} onChange={(event) => voice.setBrowserConsent(event.target.checked)} />
          J’autorise la reconnaissance du navigateur : mon audio, y compris pendant l’attente du mot d’activation, peut être envoyé à son service distant.
        </label>}
        <label className="voice-check"><input type="checkbox" checked={readReplies} onChange={(event) => onReadReplies(event.target.checked)} />Lire les réponses avec une voix générée du navigateur</label>
        <label className="voice-check"><input type="checkbox" checked={autoSend} onChange={(event) => onAutoSend(event.target.checked)} />Mode mains libres : envoyer les demandes dictées automatiquement. Les modifications cliniques restent à valider.</label>
        <p>Français · écoute limitée à cet onglet actif · {autoSend ? "dites « bonjour haoua » avant chaque demande." : "relisez la transcription avant l’envoi."}</p>
      </details>
    </>}
    {voice.error && <p className="voice-error" role="alert">{voice.error}</p>}
  </div>;
}
