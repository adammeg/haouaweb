"use client";

import { useCallback, useEffect, useState } from "react";
import { ECHO_FIELD_MAP } from "@/lib/bridge/field-map";

const BRIDGE_URL = "http://localhost:3847";
const POLL_MS = 3000;

type BridgePayload = Record<string, string | number>;

type Props = {
  onInject: (patch: Record<string, string>) => void;
};

export function DicomBridgePanel({ onInject }: Props) {
  const [status, setStatus] = useState<"off" | "on" | "error">("off");
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const applyPayload = useCallback(
    (data: BridgePayload) => {
      const patch: Record<string, string> = {};
      for (const m of ECHO_FIELD_MAP) {
        const v = data[m.source];
        if (v != null && v !== "") patch[m.target as string] = String(v);
      }
      if (Object.keys(patch).length) {
        onInject(patch);
        setLastMsg(
          "Injecte : " + Object.keys(patch).join(", ") + " (" + new Date().toLocaleTimeString("fr-FR") + ")",
        );
      }
    },
    [onInject],
  );

  useEffect(() => {
    if (!polling) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(BRIDGE_URL + "/latest", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = (await res.json()) as BridgePayload;
        if (!cancelled) {
          setStatus("on");
          applyPayload(data);
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [polling, applyPayload]);

  return (
    <div className="rounded-xl border border-dashed border-[var(--teal)]/40 bg-[var(--teal-pale)]/30 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-[var(--teal)]">Bridge DICOM</strong>
          <p className="text-xs text-[var(--muted)]">
            Service local {BRIDGE_URL} (Voluson / GE)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPolling((p) => !p);
            setStatus("off");
            setLastMsg(null);
          }}
          className={
            "rounded-lg px-3 py-1.5 text-xs font-semibold " +
            (polling
              ? "bg-red-100 text-red-800"
              : "bg-[var(--teal)] text-white")
          }
        >
          {polling ? "Arreter ecoute" : "Ecouter SR"}
        </button>
      </div>
      <p className="mt-2 text-xs">
        Statut :{" "}
        {status === "on"
          ? "Connecte"
          : status === "error"
            ? "Bridge indisponible — lancez le service local"
            : "Inactif"}
      </p>
      {lastMsg ? (
        <p className="mt-1 text-xs font-medium text-[var(--teal)]">{lastMsg}</p>
      ) : null}
    </div>
  );
}
