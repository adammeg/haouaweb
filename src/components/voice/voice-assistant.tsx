"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useHawaeStore } from "@/stores/hawae-store";
import { quickChatHistory } from "@/lib/ia/quick-chat";
import { stableClinicalDataKey } from "@/lib/ia/clinical-revision";
import { preparePatientAiRequest, isCurrentAiRequest } from "@/lib/ia/patient-request-client";
import { DICTATION_LABELS, MAX_VOICE_CHARACTERS, parseVoiceCommand, WAKE_PHRASE } from "@/lib/voice/commands";
import { stageVoiceEdit, voiceEditIsCurrent, type PendingVoiceEdit } from "@/lib/voice/draft-edit";
import { VOICE_SESSION_END_EVENT } from "@/lib/voice/preferences";
import type { HawaeIaExchange } from "@/types/domain";
import { useVoiceSession } from "./use-voice-session";
import { useRdvStore } from "@/stores/rdv-store";
import { useRappelsStore } from "@/stores/rappels-store";
import { useModulesStore } from "@/stores/modules-store";
import { useAssistantDataStatus } from "@/stores/assistant-data-status";
import { RdvModal } from "@/components/agenda/rdv-modal";
import { pushWorkspaceNow } from "@/lib/storage/workspace-sync-client";
import { appointmentDate, appointmentTime, calendarReply, fieldReply, findPatients, patientName, remindersReply, waitingReply, workspaceIntent, type PatientMatch, type WorkspaceIntent } from "@/lib/voice/workspace-tools";

type CompletedTurn = { role: "user" | "assistant"; text: string; status: "complete" };

function activeVoiceIdentity() {
  const state = useHawaeStore.getState();
  return JSON.stringify([state.currentUserId, state.draft?.id, stableClinicalDataKey(state.draft)]);
}

export function VoiceAssistant({ access, accountId, workspaceDoctorId = accountId }: { access: "enabled" | "sign-in" | "restricted"; accountId: string; workspaceDoctorId?: string }) {
  return access === "enabled" ? <DoctorVoiceIsland key={accountId} accountId={accountId} workspaceDoctorId={workspaceDoctorId} /> : null;
}

function DoctorVoiceIsland({ accountId, workspaceDoctorId }: { accountId: string; workspaceDoctorId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const draft = useHawaeStore((state) => state.draft);
  const userId = useHawaeStore((state) => state.currentUserId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [usePatient, setUsePatient] = useState(true);
  const [pendingEdit, setPendingEdit] = useState<PendingVoiceEdit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [notice, setNotice] = useState("");
  const [selection, setSelection] = useState<{ intent: Extract<WorkspaceIntent, { type: "patients" | "appointment" }>; matches: PatientMatch[] } | null>(null);
  const [appointment, setAppointment] = useState<{ date: string; heure: string; patient: string } | null>(null);
  const pendingSummary = useRef<{ userId: string; patientId: string; until: number } | null>(null);
  const lastWorkspace = useRef<WorkspaceIntent | null>(null);
  const savedAppointment = useRef<string | null>(null);
  const settingsId = useId();
  const history = useRef<CompletedTurn[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const askRef = useRef<(text: string) => void>(() => {});
  const wakeContext = useRef("");
  const wakeIdentity = useRef("");
  const clinicalKey = stableClinicalDataKey(draft);
  const contextKey = `${accountId}:${pathname}:${userId}:${draft?.id}:${clinicalKey}:${usePatient}`;
  const contextRef = useRef(contextKey); contextRef.current = contextKey;
  const voice = useVoiceSession({
    accountId, enabled: true, contextKey, blocked: !!pendingEdit || !!selection || !!appointment || settingsOpen, thinking: loading,
    onInterrupt: () => cancelRequest(),
    onWake: () => { wakeContext.current = contextRef.current; wakeIdentity.current = activeVoiceIdentity(); setError(""); setNotice(""); },
    onTranscript: (text) => { if (wakeContext.current === contextRef.current && wakeIdentity.current === activeVoiceIdentity()) askRef.current(text); },
  });
  const pauseVoice = voice.pause;

  const cancelRequest = useCallback(() => {
    requestId.current++;
    abortRef.current?.abort(); abortRef.current = null;
    setLoading(false);
  }, []);

  useEffect(() => {
    cancelRequest(); setPendingEdit(null); setError(""); setLastReply(""); setNotice(""); history.current = [];
    setSelection(null); setAppointment(null);
    lastWorkspace.current = null;
  }, [contextKey, cancelRequest]);
  useEffect(() => {
    const task = pendingSummary.current;
    if (!task) return;
    if (task.until < Date.now() || task.userId !== userId || task.patientId !== draft?.id) { pendingSummary.current = null; return; }
    if (pathname === "/dossier") { pendingSummary.current = null; askRef.current("résume le dossier"); }
  }, [contextKey, draft?.id, pathname, userId]);
  useEffect(() => {
    const hide = () => { if (document.visibilityState !== "visible") { cancelRequest(); setPendingEdit(null); setSelection(null); setAppointment(null); pendingSummary.current = null; } };
    const endSession = () => { cancelRequest(); setPendingEdit(null); setSelection(null); setAppointment(null); setLastReply(""); pendingSummary.current = null; lastWorkspace.current = null; history.current = []; };
    document.addEventListener("visibilitychange", hide); window.addEventListener(VOICE_SESSION_END_EVENT, endSession);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener(VOICE_SESSION_END_EVENT, endSession); };
  }, [cancelRequest]);
  useEffect(() => () => { requestId.current++; abortRef.current?.abort(); }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cancelRequest(); pauseVoice(); setSettingsOpen(false); setPendingEdit(null);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [cancelRequest, pauseVoice]);

  function acknowledge(message: string) { setNotice(message); setLastReply(message); voice.speak(message); }

  function dataReady(source: "patients" | "clinical") {
    const status = useAssistantDataStatus.getState();
    if (status.doctorId !== workspaceDoctorId || status[source] !== "ready") {
      acknowledge(status[source] === "error" ? "La synchronisation du cabinet n’est pas disponible. Je ne peux pas confirmer ces données pour le moment." : "Les données du cabinet sont en cours de chargement. Réessayez dans un instant.");
      return false;
    }
    return true;
  }

  function choosePatient(match: PatientMatch, intent: Extract<WorkspaceIntent, { type: "patients" | "appointment" }>) {
    const state = useHawaeStore.getState();
    if (!dataReady("patients") || !state.patientsByUser[match.userId]?.[match.patient.id]) { setSelection(null); return; }
    const selectedPatient = state.patientsByUser[match.userId][match.patient.id];
    setSelection(null);
    if (intent.type === "appointment") {
      if (!dataReady("clinical")) return;
      const date = appointmentDate(intent.dateText), heure = appointmentTime(intent.timeText);
      if (!date || !heure) { acknowledge("Précisez une date et une heure valides. Par exemple : prends un rendez-vous pour la patiente actuelle demain à 14 heures."); return; }
      setAppointment({ date, heure, patient: patientName(selectedPatient) }); return;
    }
    if (!state.users.some((user) => user.id === match.userId)) { acknowledge("Le profil qui contient ce dossier n’est plus disponible."); return; }
    state.saveDraft(); state.setCurrentUser(match.userId); useHawaeStore.getState().openPatient(match.patient.id);
    if (intent.action === "summary") {
      if (userId === match.userId && draft?.id === match.patient.id && pathname === "/dossier") { askRef.current("résume le dossier"); return; }
      pendingSummary.current = { userId: match.userId, patientId: match.patient.id, until: Date.now() + 10_000 };
    }
    router.push("/dossier");
  }

  function handleWorkspace(intent: WorkspaceIntent) {
    lastWorkspace.current = intent;
    const state = useHawaeStore.getState();
    if (intent.type === "capabilities") {
      acknowledge("J’ai accès aux données de votre cabinet : dossiers patientes, rendez-vous, salle d’attente et rappels chargés. Je peux rechercher et ouvrir un dossier, lire les informations enregistrées, analyser le dossier ouvert et préparer un rendez-vous à valider."); return;
    }
    if (intent.type === "field") { if (dataReady("patients")) acknowledge(fieldReply(state.draft, intent.field)); return; }
    if (intent.type === "save") {
      if (!dataReady("patients")) return;
      if (!state.draft?.id) { acknowledge("Aucun dossier ouvert à sauvegarder."); return; }
      state.saveDraft(); setLoading(true);
      const captured = contextRef.current;
      const run = ++requestId.current;
      const current = () => captured === contextRef.current && run === requestId.current;
      void pushWorkspaceNow().then(() => { if (current()) acknowledge("Le dossier a été sauvegardé sur le serveur."); })
        .catch(() => { if (current()) acknowledge("Le dossier est conservé localement, mais la sauvegarde serveur a échoué."); })
        .finally(() => { if (current()) setLoading(false); }); return;
    }
    if (intent.type === "calendar" || intent.type === "waiting" || intent.type === "reminders") {
      if (!dataReady("clinical")) return;
      if (intent.type === "calendar") {
        if (intent.query === "@active" && !state.draft) { acknowledge("Ouvrez le dossier de la patiente dont vous cherchez les rendez-vous."); return; }
        acknowledge(calendarReply(useRdvStore.getState().list, { ...intent, query: intent.query === "@active" ? patientName(state.draft!) : intent.query }));
      }
      else if (intent.type === "reminders") acknowledge(remindersReply(useRappelsStore.getState().list));
      else {
        if (!dataReady("patients")) return;
        const uid = state.currentUserId ?? "";
        acknowledge(waitingReply(useModulesStore.getState().workspaceByUser[uid]?.waitingQueue ?? [], state.patientsByUser[uid] ?? {}));
      }
      return;
    }
    if (!dataReady("patients")) return;
    const current = /^(?:(?:la|ma|cette) )?patiente(?: actuelle|ouverte)?$/.test(intent.query);
    const matches = current && state.draft && state.currentUserId ? [{ userId: state.currentUserId, patient: state.draft }] : findPatients(state.patientsByUser, intent.query);
    if (!matches.length) { acknowledge("Aucune patiente correspondante dans les dossiers chargés. Donnez son nom complet."); return; }
    if (intent.type === "patients" && intent.action === "search") {
      acknowledge(`${matches.length} dossier${matches.length > 1 ? "s" : ""} trouvé${matches.length > 1 ? "s" : ""} : ${matches.slice(0, 5).map((match) => patientName(match.patient)).join(", ")}. Pour ouvrir un dossier, dites ouvre le dossier de suivi du nom complet.`); return;
    }
    if (intent.type === "appointment" && (!appointmentDate(intent.dateText) || !appointmentTime(intent.timeText))) { acknowledge("Précisez la patiente, la date et l’heure. Par exemple : prends un rendez-vous pour la patiente actuelle demain à 14 heures."); return; }
    if (matches.length > 1) { setSelection({ intent, matches: matches.slice(0, 10) }); return; }
    choosePatient(matches[0], intent);
  }

  async function answer(question: string, forcePatient = false) {
    const snapshot = useHawaeStore.getState();
    const patientMode = forcePatient || (usePatient && !!snapshot.draft?.id);
    if (patientMode && !dataReady("patients")) return;
    if (patientMode && !snapshot.draft?.id) { acknowledge("Ouvrez un dossier pour demander son résumé."); return; }
    voice.pause(); setError(""); setNotice(""); setLastReply("");
    const capturedContext = contextRef.current;
    const capturedUser = snapshot.currentUserId;
    const patientId = snapshot.draft?.id;
    const key = stableClinicalDataKey(snapshot.draft);
    const ac = new AbortController(); abortRef.current = ac;
    const run = ++requestId.current;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; ac.abort(); }, 45_000);
    setLoading(true);
    const sameContext = () => {
      const state = useHawaeStore.getState();
      return run === requestId.current && contextRef.current === capturedContext && state.currentUserId === capturedUser && state.draft?.id === patientId && stableClinicalDataKey(state.draft) === key;
    };
    const current = () => !ac.signal.aborted && sameContext();
    try {
      const prepared = patientMode ? await preparePatientAiRequest(patientId!, ac.signal) : null;
      if (!current()) return;
      const response = await fetch("/api/ia", { method: "POST", signal: ac.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepared
          ? { mode: "question", question, patientId: prepared.patientId, expectedRevision: prepared.expectedRevision, conversation: true, voice: true, stream: false }
          : { mode: "chat", question, history: quickChatHistory(history.current), voice: true, stream: false }),
      });
      const data = await response.json() as { reply?: string; error?: string; meta?: Partial<HawaeIaExchange> };
      if (!response.ok) throw new Error(data.error || "Assist est momentanément indisponible.");
      if (!data.reply?.trim()) throw new Error("Aucune réponse reçue. Réessayez votre demande.");
      if (!current()) return;
      if (prepared) {
        if (!isCurrentAiRequest(prepared.patientId, prepared.key) || data.meta?.revision !== prepared.expectedRevision) throw new Error("Le dossier a changé. Reformulez votre demande.");
        const state = useHawaeStore.getState();
        const entry: HawaeIaExchange = { ...data.meta, id: crypto.randomUUID(), at: new Date().toISOString(), mode: "question", question, reply: data.reply, contextKeyAtGeneration: prepared.key };
        state.patchDraft({ hawaeIaHistory: [...(state.draft?.hawaeIaHistory ?? []), entry].slice(-60) }); state.saveDraft();
      } else history.current = [...history.current, { role: "user", text: question, status: "complete" }, { role: "assistant", text: data.reply, status: "complete" }].slice(-8) as CompletedTurn[];
      setLastReply(data.reply); voice.speak(data.reply);
    } catch (cause) {
      if (current() || (timedOut && sameContext())) {
        const message = timedOut ? "La réponse prend trop de temps. Réessayez ou posez une question plus courte." : cause instanceof Error ? cause.message : "Assist est indisponible.";
        setError(message); voice.speak(message);
      }
    } finally {
      clearTimeout(timeout);
      if (run === requestId.current) { abortRef.current = null; setLoading(false); }
    }
  }

  function handleRequest(raw: string) {
    const text = raw.trim();
    if (!text || text.length > MAX_VOICE_CHARACTERS || abortRef.current || pendingEdit || selection || appointment || settingsOpen) return;
    voice.pause(); setError(""); setNotice("");
    const command = parseVoiceCommand(text);
    const workspace = command.type === "unsupported" ? workspaceIntent(text, lastWorkspace.current) : null;
    if (workspace) {
      try { handleWorkspace(workspace); }
      catch { acknowledge("Les données chargées ne peuvent pas être lues. Vérifiez la synchronisation du cabinet et réessayez."); }
      return;
    }
    const state = useHawaeStore.getState();
    switch (command.type) {
      case "stop": cancelRequest(); voice.startTalk(); return;
      case "pause": voice.updatePreferences({ active: false }); return;
      case "end": voice.endConversation(); return;
      case "repeat":
        if (lastReply) voice.speak(lastReply); else acknowledge("Je n’ai pas encore de réponse à répéter."); return;
      case "navigate": router.push(command.href); voice.resume(); return;
      case "tab":
        if (!state.draft?.id) { acknowledge("Ouvrez un dossier pour afficher cet onglet."); return; }
        router.push(`/dossier?voiceTab=${command.tab}`); voice.resume(); return;
      case "summary": void answer("Résume le dossier actuel et signale les informations manquantes.", true); return;
      case "dictate":
        if (!dataReady("patients")) return;
        if (!state.draft?.id || !state.currentUserId) { acknowledge("Ouvrez un dossier avant de dicter une modification."); return; }
        setPendingEdit(stageVoiceEdit(state.draft, state.currentUserId, command.field, command.value)); return;
      default: void answer(text);
    }
  }
  const speak = voice.speak;
  useEffect(() => {
    if (appointment || !savedAppointment.current) return;
    const id = savedAppointment.current; savedAppointment.current = null;
    if (useAssistantDataStatus.getState().doctorId !== workspaceDoctorId) return;
    const created = useRdvStore.getState().list.find((row) => row.id === id);
    if (created) speak(`Rendez-vous ajouté à l’agenda pour ${created.patient}, le ${created.date}, à ${created.heure}. La synchronisation du cabinet est en cours.`);
  }, [appointment, speak, workspaceDoctorId]);
  askRef.current = handleRequest;

  function applyEdit() {
    const state = useHawaeStore.getState();
    if (!pendingEdit || !voiceEditIsCurrent(pendingEdit, state.draft, state.currentUserId)) {
      setPendingEdit(null); setError("Le dossier a changé. Dictez à nouveau la modification."); return;
    }
    state.patchDraft({ [pendingEdit.field]: pendingEdit.proposed }); setPendingEdit(null);
  }

  const listening = voice.state === "recording";
  const waiting = voice.state === "waiting";
  const needsSetup = !voice.supported || (voice.preferences.processing === "local" && (!voice.localSupported || !voice.localAvailable)) || (voice.preferences.processing === "browser" && !voice.preferences.browserConsent);
  const problem = error || voice.error;
  const status = !voice.ready ? "Assist se prépare" : !voice.preferences.active ? "Assist en pause" : pendingEdit ? "Modification à valider" : settingsOpen ? "Réglages d’Assist" : voice.speaking ? "Assist vous répond" : voice.preparingSpeech ? "Préparation de la voix…" : loading ? "Assist réfléchit" : listening ? voice.conversation && !voice.interim ? "À vous · je vous écoute" : "Assist vous écoute" : waiting ? `Dites « ${WAKE_PHRASE} »` : voice.state === "starting" ? "Connexion au microphone" : needsSetup ? "Configurer Assist" : problem ? "Assist · réessayer" : "Parler à Assist";

  function toggleActive() {
    if (needsSetup) setSettingsOpen(true);
    else if (!voice.preferences.active) voice.retry();
    else voice.startTalk();
  }

  return <aside className="assist-island-wrap print:hidden" aria-label="Assistant vocal Assist">
    <div className={`assist-island ${listening || voice.speaking ? "is-active" : ""} ${loading ? "is-thinking" : ""}`}>
      <button type="button" className="assist-island-main" onClick={toggleActive} aria-label={voice.speaking || voice.preparingSpeech || loading ? "Interrompre et parler à Assist" : needsSetup ? "Configurer Assist" : "Parler à Assist"}>
        <span className={`assist-wave ${waiting || listening || voice.speaking || loading ? "is-moving" : ""}`} aria-hidden><i /><i /><i /><i /><i /></span>
        <span className="assist-island-label"><strong role="status">{status}</strong><small>{voice.speaking ? voice.interruptAvailable ? "« Bonjour assist » pour interrompre" : "Touchez la barre pour interrompre" : listening ? voice.interim || "Je vous écoute…" : usePatient && draft?.id ? "Dossier actif · cabinet" : "Cabinet · dossiers et agenda"}</small></span>
      </button>
      {lastReply && !loading && <button type="button" className="assist-island-icon" onClick={() => voice.speak(lastReply)} aria-label="Réécouter la réponse" title="Réécouter">▷</button>}
      {voice.preferences.active && <button type="button" className="assist-island-icon assist-pause" onClick={() => { cancelRequest(); voice.updatePreferences({ active: false }); }} aria-label="Mettre Assist en pause" title="Mettre en pause">Ⅱ</button>}
      <button type="button" className="assist-island-icon" aria-label="Réglages d’Assist" aria-expanded={settingsOpen} aria-controls={settingsOpen ? settingsId : undefined} onClick={() => setSettingsOpen(!settingsOpen)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M4 7h16M4 17h16M8 4v6M16 14v6" strokeLinecap="round" /></svg></button>
    </div>
    {problem && !settingsOpen && <div className="assist-island-message" role="alert"><span>{problem}</span><button type="button" onClick={() => setSettingsOpen(true)}>Réglages</button></div>}
    {notice && !problem && !voice.speaking && <p className="assist-island-message" role="status">{notice}</p>}
    {selection && <section className="assist-island-card" aria-label="Choisir une patiente"><header><strong>Plusieurs dossiers correspondent</strong><button type="button" onClick={() => setSelection(null)} aria-label="Annuler le choix">×</button></header><p>Choisissez le bon dossier.</p>{selection.matches.map((match) => <button type="button" key={`${match.userId}:${match.patient.id}`} onClick={() => choosePatient(match, selection.intent)}>{patientName(match.patient)}{match.patient.ddn ? ` · ${match.patient.ddn}` : ""} · {useHawaeStore.getState().users.find((user) => user.id === match.userId)?.name ?? "profil cabinet"}</button>)}</section>}
    {appointment && createPortal(<RdvModal mode="create" open prefillDate={appointment.date} prefillHeure={appointment.heure} prefillPatient={appointment.patient} onClose={() => setAppointment(null)} onSaved={(id) => { savedAppointment.current = id; setAppointment(null); setNotice("Rendez-vous ajouté à l’agenda. La synchronisation du cabinet est en cours."); }} />, document.body)}
    {settingsOpen && <section id={settingsId} className="assist-island-card" aria-label="Réglages vocaux">
      <header><strong>Assist · Réglages vocaux</strong><button type="button" onClick={() => setSettingsOpen(false)} aria-label="Fermer les réglages">×</button></header>
      <p>Dites <b>« bonjour assist »</b> ou <b>« bonjour assiste »</b>, puis votre demande. Après la réponse, vous avez 20 secondes pour poursuivre sans répéter le mot d’activation.</p>
      <p>Pour interrompre une réponse, dites de nouveau « bonjour assist », ou touchez la barre. « C’est tout » termine l’échange ; « mets-toi en pause » désactive l’écoute.</p>
      <label className="assist-check"><input type="checkbox" checked={voice.preferences.active} onChange={(event) => voice.updatePreferences({ active: event.target.checked })} />Activation automatique</label>
      <label className="assist-check"><input type="checkbox" checked={usePatient} onChange={(event) => setUsePatient(event.target.checked)} />Utiliser le dossier ouvert pour les questions</label>
      <label className="assist-select">Reconnaissance<select value={voice.preferences.processing} onChange={(event) => voice.updatePreferences({ processing: event.target.value as "local" | "browser" })}><option value="local">Sur cet appareil</option><option value="browser">Service du navigateur</option></select></label>
      {!voice.supported && <p>Reconnaissance indisponible : utilisez un navigateur compatible, en HTTPS ou sur localhost.</p>}
      {voice.preferences.processing === "local" ? <>
        <p>{voice.localSupported ? "Le français local nécessite un pack de langue disponible." : "Ce navigateur ne propose pas la reconnaissance locale. Choisissez son service vocal pour continuer."}</p>
        {voice.canInstall && <button type="button" disabled={voice.installing} onClick={() => void voice.installLocal()}>{voice.installing ? "Installation…" : "Installer le français local"}</button>}
      </> : <label className="assist-check"><input type="checkbox" checked={voice.preferences.browserConsent} onChange={(event) => voice.updatePreferences({ browserConsent: event.target.checked })} />J’autorise le service du navigateur. Mon audio peut lui être envoyé, y compris pendant l’attente du mot d’activation.</label>}
      <p>Une autorisation du microphone peut être demandée au premier démarrage. La voix des réponses est générée par le navigateur.</p>
      {problem && <p role="alert">{problem}</p>}
      <button type="button" className="assist-primary" onClick={() => { voice.retry(); setSettingsOpen(false); }}>Activer Assist</button>
    </section>}
    {pendingEdit && <section className="assist-island-card" aria-label="Modification clinique à valider">
      <header><strong>{DICTATION_LABELS[pendingEdit.field]} · ajout proposé</strong></header>
      <p>Valeur actuelle : {pendingEdit.previous || "Vide"}</p><p className="assist-edit-value">Après ajout : {pendingEdit.proposed}</p>
      <div className="assist-edit-actions"><button type="button" className="assist-primary" onClick={applyEdit}>Appliquer au dossier</button><button type="button" onClick={() => setPendingEdit(null)}>Annuler</button></div>
    </section>}
  </aside>;
}
