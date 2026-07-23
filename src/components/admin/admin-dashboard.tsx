"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PlatformMetrics } from "@/lib/admin/platform-metrics";
import type { ProtocolItem } from "@/lib/protocols/catalog";
import type { ManagedProtocol } from "@/lib/db/admin-protocols-repository";

type ClinicRow = { id: string; name: string; slug: string; createdAt: string };
type DoctorRow = { id: string; email: string; name: string; role?: "doctor"|"secretary"|"clinic_admin"|"app_admin"; clinicId?: string|null; active?: boolean; createdAt: string };
type DoctorPatientMetric = { doctorId: string; total: number; period: number };
type Tab = "overview" | "doctors" | "patients" | "clinics" | "protocols" | "scores" | "ai";

const SCORE_NAMES = ["Bishop","Manning","Apgar","MFMU AVAC","Flamm & Geiger","HPP","rASRM","Ménopause","FIGO Col","FIGO Endomètre","FIGO Ovaire","Cancer du sein","RCIU / Hadlock","IOTA","ROMA","ADNEX","LUS","CTG","RPM / HRP / GEU"];

function PatientCountsView({ doctors, counts, clinics, periodDays, onPeriodChange }: {
  doctors: DoctorRow[]; counts: Map<string, DoctorPatientMetric>; clinics: Map<string, string>;
  periodDays: string; onPeriodChange: (value: string) => void;
}) {
  const rows = doctors.filter((doctor) => doctor.role === "doctor" || doctor.role === "clinic_admin" || !doctor.role);
  const label = periodDays === "all" ? "Toute la période" : `${periodDays} derniers jours`;
  const total = rows.reduce((sum, doctor) => sum + (counts.get(doctor.id)?.total ?? 0), 0);
  const period = rows.reduce((sum, doctor) => sum + (counts.get(doctor.id)?.period ?? 0), 0);
  return <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="font-display text-lg font-bold">Patientes par médecin</h2><p className="mt-1 text-xs text-[var(--muted)]">Dossiers globaux et nouvelles patientes sur la période sélectionnée. Les anciens dossiers utilisent leur première date disponible.</p></div>
      <label className="text-xs font-semibold">Période <select value={periodDays} onChange={(event)=>onPeriodChange(event.target.value)} className="ml-2 rounded-xl border px-3 py-2 text-sm">
        <option value="7">7 derniers jours</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option><option value="365">12 derniers mois</option><option value="all">Toute la période</option>
      </select></label>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-[var(--teal-pale)] p-4"><b className="text-2xl text-[var(--teal)]">{total}</b><small className="block">Patientes globales</small></div>
      <div className="rounded-xl bg-[var(--blush-pale)] p-4"><b className="text-2xl text-[var(--pink-deep)]">{period}</b><small className="block">{label}</small></div>
      <div className="rounded-xl bg-[var(--gold-surface)] p-4"><b className="text-2xl text-[var(--gold-dark)]">{rows.length}</b><small className="block">Médecins suivis</small></div>
    </div>
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs">
      <thead className="border-b text-[var(--muted)]"><tr><th className="p-3">Médecin</th><th>Structure</th><th className="text-center">Total global</th><th className="text-center">{label}</th><th className="text-center">Part période</th></tr></thead>
      <tbody>{rows.map((doctor)=>{const metric=counts.get(doctor.id)??{total:0,period:0};const share=metric.total?Math.round(metric.period/metric.total*100):0;return <tr key={doctor.id} className="border-b border-[var(--border)]"><td className="p-3"><b>{doctor.name}</b><small className="block text-[var(--muted)]">{doctor.email}</small></td><td>{doctor.clinicId?clinics.get(doctor.clinicId)??doctor.clinicId:"Indépendant"}</td><td className="text-center text-base font-bold text-[var(--teal)]">{metric.total}</td><td className="text-center text-base font-bold text-[var(--pink-deep)]">{metric.period}</td><td className="text-center"><span className="rounded-full bg-[var(--cream)] px-2 py-1 font-bold">{share}%</span></td></tr>;})}</tbody>
    </table></div>
  </section>;
}

export function AdminDashboard({ adminName }: { adminName: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics|null>(null);
  const [builtInProtocols, setBuiltInProtocols] = useState<ProtocolItem[]>([]);
  const [managedProtocols, setManagedProtocols] = useState<ManagedProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);
  const [message, setMessage] = useState<string|null>(null);
  const [busyId, setBusyId] = useState<string|null>(null);
  const [clinicName, setClinicName] = useState("");
  const [search, setSearch] = useState("");
  const [protocolForm, setProtocolForm] = useState({ title:"", category:"obst" as ProtocolItem["category"], summary:"", steps:"", references:"" });
  const [trainingStats, setTrainingStats] = useState<{totalSamples:number;totalDoctors:number;lastIngestedAt:string|null}|null>(null);
  const [patientMetrics, setPatientMetrics] = useState<DoctorPatientMetric[]>([]);
  const [periodDays, setPeriodDays] = useState("30");

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [overviewRes, protocolRes, trainingRes] = await Promise.all([fetch(`/api/admin/overview?days=${periodDays}`), fetch("/api/admin/protocols"), fetch("/api/admin/training/stats")]);
      const overview = await overviewRes.json(); if (!overviewRes.ok) throw new Error(overview.error || "overview_failed");
      setClinics(overview.clinics ?? []); setDoctors(overview.doctors ?? []); setMetrics(overview.metrics ?? null); setPatientMetrics(overview.patientMetrics ?? []);
      if (protocolRes.ok) { const data = await protocolRes.json(); setBuiltInProtocols(data.builtIn ?? []); setManagedProtocols(data.managed ?? []); }
      if (trainingRes.ok) { const data = await trainingRes.json(); setTrainingStats(data.stats ?? null); }
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur de chargement"); }
    finally { setLoading(false); }
  }, [periodDays]);
  useEffect(() => { void load(); }, [load]);

  const clinicMap = useMemo(() => new Map(clinics.map((c) => [c.id,c.name])), [clinics]);
  const patientMetricMap = useMemo(() => new Map(patientMetrics.map((row) => [row.doctorId, row])), [patientMetrics]);
  const filteredDoctors = doctors.filter((d) => `${d.name} ${d.email} ${clinicMap.get(d.clinicId ?? "") ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const notify = (text:string) => { setMessage(text); window.setTimeout(() => setMessage(null), 3500); };

  async function mutate(url:string, init:RequestInit, success:string) {
    setErr(null); const res = await fetch(url, init); const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText); notify(success); await load(); return data;
  }
  async function setActive(id:string, active:boolean) { setBusyId(id); try { await mutate("/api/admin/overview",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({doctorId:id,active})},active?"Compte réactivé":"Compte désactivé"); } catch(e){setErr(e instanceof Error?e.message:"Erreur");} finally{setBusyId(null);} }
  async function createClinic() { if(!clinicName.trim())return; try { await mutate("/api/admin/overview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"clinic",name:clinicName})},"Clinique créée"); setClinicName(""); } catch(e){setErr(e instanceof Error?e.message:"Erreur");} }
  async function remove(type:"doctor"|"clinic",id:string,label:string) { if(!window.confirm(`Supprimer définitivement ${label} ? Cette action est irréversible.`))return; setBusyId(id); try { await mutate("/api/admin/overview",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,id,confirm:id})},`${label} supprimé`); } catch(e){setErr(e instanceof Error?e.message:"Erreur");} finally{setBusyId(null);} }
  async function createProtocol() { const steps=protocolForm.steps.split("\n").map(x=>x.trim()).filter(Boolean); try { await mutate("/api/admin/protocols",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...protocolForm,steps})},"Protocole publié"); setProtocolForm({title:"",category:"obst",summary:"",steps:"",references:""}); } catch(e){setErr(e instanceof Error?e.message:"Erreur");} }
  async function toggleProtocol(p:ManagedProtocol) { try { await mutate("/api/admin/protocols",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id,active:!p.active})},p.active?"Protocole masqué":"Protocole publié"); } catch(e){setErr(e instanceof Error?e.message:"Erreur");} }
  async function deleteProtocol(p:ManagedProtocol) { if(!window.confirm(`Supprimer « ${p.title} » ?`))return; try { await mutate("/api/admin/protocols",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id,confirm:p.id})},"Protocole supprimé"); } catch(e){setErr(e instanceof Error?e.message:"Erreur");} }

  const cards = metrics ? [["Médecins",metrics.doctors.total,"Comptes plateforme"],["Patientes",metrics.patients,"Dossiers enregistrés"],["Consultations",metrics.consultations,"Archives cliniques"],["Cliniques",metrics.clinics,"Structures"],["Documents",metrics.documents,"Scans et documents générés"],["Partogrammes",metrics.partograms,"Sessions sauvegardées"],["PMA / FIV",metrics.ivfRecords,"Profils persistés"],["IA",metrics.trainingSamples,"Échantillons consentis"]] : [];

  return <div className="space-y-6">
    <header className="rounded-2xl bg-[linear-gradient(135deg,var(--teal-deep),var(--teal))] p-6 text-white shadow-[var(--shadow-m)] sm:flex sm:items-center sm:justify-between">
      <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--gold-light)]">HawaeMD Control Center</p><h1 className="mt-2 font-display text-2xl font-bold">Administration plateforme</h1><p className="mt-1 text-sm text-white/60">Connecté en tant que {adminName}</p></div>
      <div className="mt-4 flex gap-2 sm:mt-0"><button onClick={()=>void load()} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold">Actualiser</button><Link href="/" className="rounded-xl bg-[var(--gold)] px-4 py-2 text-xs font-bold text-[var(--teal-deep)]">Accueil</Link></div>
    </header>

    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--border)] bg-white p-2" aria-label="Sections administration">{([['overview','Vue globale'],['doctors','Médecins'],['patients','Patientes / médecin'],['clinics','Cliniques'],['protocols','Protocoles'],['scores','Scores'],['ai','IA & données']] as [Tab,string][]).map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold ${tab===id?'bg-[var(--teal)] text-white':'text-[var(--ink-mid)] hover:bg-[var(--teal-pale)]'}`}>{label}</button>)}</nav>
    {tab==="patients"?<PatientCountsView doctors={doctors} counts={patientMetricMap} clinics={clinicMap} periodDays={periodDays} onPeriodChange={setPeriodDays}/>:null}
    {err?<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>:null}{message?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>:null}

    {tab==="overview"?<><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label,value,sub])=><article key={String(label)} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"><div className="text-3xl font-bold text-[var(--teal)]">{String(value)}</div><h2 className="mt-1 text-sm font-bold">{String(label)}</h2><p className="text-[10px] text-[var(--muted)]">{String(sub)}</p></article>)}</div><section className="grid gap-4 lg:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">État des comptes</h2><div className="mt-4 space-y-3 text-sm"><p className="flex justify-between">Actifs <b className="text-emerald-600">{metrics?.doctors.active??0}</b></p><p className="flex justify-between">Désactivés <b className="text-red-600">{metrics?.doctors.disabled??0}</b></p><p className="flex justify-between">Indépendants <b>{metrics?.doctors.independent??0}</b></p></div></div><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">Catalogue clinique</h2><div className="mt-4 space-y-3 text-sm"><p className="flex justify-between">Protocoles intégrés <b>{builtInProtocols.length}</b></p><p className="flex justify-between">Protocoles administrés <b>{managedProtocols.length}</b></p><p className="flex justify-between">Scores protégés <b>{SCORE_NAMES.length}</b></p></div></div><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">Stockage fonctionnel</h2><div className="mt-4 space-y-3 text-sm"><p className="flex justify-between">Profils modules <b>{metrics?.storageProfiles??0}</b></p><p className="flex justify-between">Documents <b>{metrics?.documents??0}</b></p><p className="flex justify-between">Cycles PMA <b>{metrics?.ivfRecords??0}</b></p></div></div></section></>:null}

    {tab==="doctors"?<section className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold">Comptes médecins</h2><p className="text-xs text-[var(--muted)]">Activation, rattachement et suppression complète.</p></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" className="rounded-xl border px-3 py-2 text-sm"/></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b text-[var(--muted)]"><tr><th className="p-3">Médecin</th><th>Rôle</th><th>Structure</th><th>Création</th><th>État</th><th className="text-right">Actions</th></tr></thead><tbody>{filteredDoctors.map(d=><tr key={d.id} className="border-b border-[var(--border)]"><td className="p-3"><b>{d.name}</b><small className="block text-[var(--muted)]">{d.email}</small></td><td>{d.role??'doctor'}</td><td>{d.clinicId?clinicMap.get(d.clinicId)??d.clinicId:'Indépendant'}</td><td>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td><td><span className={`rounded-full px-2 py-1 font-bold ${d.active===false?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-700'}`}>{d.active===false?'Désactivé':'Actif'}</span></td><td><div className="flex justify-end gap-2"><button disabled={busyId===d.id||d.role==='app_admin'} onClick={()=>void setActive(d.id,d.active===false)} className="rounded-lg border px-2 py-1 font-bold disabled:opacity-40">{d.active===false?'Réactiver':'Désactiver'}</button><button disabled={busyId===d.id||d.role==='app_admin'} onClick={()=>void remove('doctor',d.id,d.name)} className="rounded-lg border border-red-200 px-2 py-1 font-bold text-red-700 disabled:opacity-40">Supprimer</button></div></td></tr>)}</tbody></table></div></section>:null}

    {tab==="clinics"?<section className="grid gap-5 lg:grid-cols-[340px_1fr]"><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">Créer une clinique</h2><p className="mt-1 text-xs text-[var(--muted)]">La structure pourra ensuite créer ses comptes praticiens.</p><input value={clinicName} onChange={e=>setClinicName(e.target.value)} placeholder="Nom de la clinique" className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"/><button onClick={()=>void createClinic()} className="mt-3 w-full rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-bold text-white">Ajouter la clinique</button></div><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">Structures ({clinics.length})</h2><ul className="mt-4 space-y-2">{clinics.map(c=>{const count=doctors.filter(d=>d.clinicId===c.id).length;return <li key={c.id} className="flex items-center justify-between rounded-xl border p-3"><div><b className="text-sm">{c.name}</b><small className="block text-[var(--muted)]">{c.slug} · {count} compte(s)</small></div><button disabled={count>0||busyId===c.id} onClick={()=>void remove('clinic',c.id,c.name)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-700 disabled:opacity-30" title={count>0?'Retirez les médecins avant de supprimer':''}>Supprimer</button></li>})}</ul></div></section>:null}

    {tab==="protocols"?<section className="grid gap-5 lg:grid-cols-[380px_1fr]"><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">Nouveau protocole</h2><div className="mt-4 space-y-3"><input value={protocolForm.title} onChange={e=>setProtocolForm({...protocolForm,title:e.target.value})} placeholder="Titre" className="w-full rounded-xl border px-3 py-2 text-sm"/><select value={protocolForm.category} onChange={e=>setProtocolForm({...protocolForm,category:e.target.value as ProtocolItem['category']})} className="w-full rounded-xl border px-3 py-2 text-sm"><option value="obst">Obstétrique</option><option value="gyn">Gynécologie</option><option value="pma">PMA</option><option value="urgence">Urgence</option></select><textarea value={protocolForm.summary} onChange={e=>setProtocolForm({...protocolForm,summary:e.target.value})} placeholder="Résumé" className="min-h-20 w-full rounded-xl border px-3 py-2 text-sm"/><textarea value={protocolForm.steps} onChange={e=>setProtocolForm({...protocolForm,steps:e.target.value})} placeholder={'Étapes — une par ligne'} className="min-h-36 w-full rounded-xl border px-3 py-2 text-sm"/><input value={protocolForm.references} onChange={e=>setProtocolForm({...protocolForm,references:e.target.value})} placeholder="Références" className="w-full rounded-xl border px-3 py-2 text-sm"/><button onClick={()=>void createProtocol()} className="w-full rounded-xl bg-[var(--teal)] px-4 py-2 text-sm font-bold text-white">Publier</button></div></div><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">Catalogue ({builtInProtocols.length+managedProtocols.length})</h2><p className="text-xs text-[var(--muted)]">Les protocoles intégrés sont protégés. Les protocoles administrés peuvent être masqués ou supprimés.</p><div className="mt-4 space-y-2">{builtInProtocols.map(p=><div key={p.id} className="rounded-xl border p-3"><div className="flex justify-between"><b className="text-sm">{p.title}</b><span className="text-[9px] font-bold text-[var(--teal)]">INTÉGRÉ</span></div><p className="mt-1 text-xs text-[var(--muted)]">{p.summary}</p></div>)}{managedProtocols.map(p=><div key={p.id} className={`rounded-xl border p-3 ${!p.active?'opacity-55':''}`}><div className="flex justify-between gap-3"><div><b className="text-sm">{p.title}</b><p className="mt-1 text-xs text-[var(--muted)]">{p.summary}</p></div><div className="flex shrink-0 gap-2"><button onClick={()=>void toggleProtocol(p)} className="rounded-lg border px-2 py-1 text-[10px] font-bold">{p.active?'Masquer':'Publier'}</button><button onClick={()=>void deleteProtocol(p)} className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-bold text-red-700">Supprimer</button></div></div></div>)}</div></div></section>:null}

    {tab==="scores"?<section className="rounded-2xl border bg-white p-5"><h2 className="font-display text-lg font-bold">Catalogue des scores cliniques</h2><p className="mt-1 max-w-3xl text-xs text-[var(--muted)]">Les scores validés sont protégés contre la suppression administrative car leurs formules et seuils nécessitent une validation clinique et des tests de non-régression. L’administration peut surveiller le catalogue; l’ajout d’un score suit le processus de validation clinique.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SCORE_NAMES.map((name,i)=><div key={name} className="flex items-center justify-between rounded-xl border p-3"><div><b className="text-sm">{name}</b><small className="block text-[var(--muted)]">Module clinique #{String(i+1).padStart(2,'0')}</small></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">ACTIF · PROTÉGÉ</span></div>)}</div></section>:null}

    {tab==="ai"?<section className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">Dataset IA</h2><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[var(--teal-pale)] p-4"><b className="text-2xl text-[var(--teal)]">{trainingStats?.totalSamples??0}</b><small className="block">Échantillons consentis</small></div><div className="rounded-xl bg-[var(--gold-surface)] p-4"><b className="text-2xl text-[var(--gold-dark)]">{trainingStats?.totalDoctors??0}</b><small className="block">Contributeurs</small></div></div><p className="mt-4 text-xs text-[var(--muted)]">Dernière ingestion : {trainingStats?.lastIngestedAt?new Date(trainingStats.lastIngestedAt).toLocaleString('fr-FR'):'Aucune'}</p><a href="/api/admin/training/export?format=ndjson&limit=10000" className="mt-4 inline-flex rounded-xl bg-[var(--teal)] px-4 py-2 text-xs font-bold text-white">Exporter NDJSON</a></div><div className="rounded-2xl border bg-white p-5"><h2 className="font-display font-bold">Gouvernance</h2><ul className="mt-4 space-y-3 text-sm"><li className="flex justify-between">Consentement versionné <b className="text-emerald-600">Actif</b></li><li className="flex justify-between">Suppression au retrait <b className="text-emerald-600">Active</b></li><li className="flex justify-between">Contexte IA pseudonymisé <b className="text-emerald-600">Actif</b></li><li className="flex justify-between">Validation structurée <b className="text-emerald-600">Active</b></li></ul></div></section>:null}
    {loading?<p className="text-center text-sm text-[var(--muted)]">Actualisation des données…</p>:null}
  </div>;
}
