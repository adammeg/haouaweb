"use client";

import { useMemo } from "react";
import type { PatientSnapshot } from "@/types/domain";
import { collectT2FromSnapshot } from "@/lib/t2-echo/collect";
import { buildFetusSvgString } from "@/lib/t2-echo/fetus-svg";

export function FetusPreview({
  draft,
  doctorName,
}: {
  draft: PatientSnapshot;
  doctorName?: string;
}) {
  const dataUrl = useMemo(() => {
    const d = collectT2FromSnapshot(draft, doctorName);
    const agNum = parseFloat(d.ag) || 22;
    const svg = buildFetusSvgString(d, d.check, agNum);
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }, [draft, doctorName]);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase text-[var(--muted)]">
        Schema foetal (Salomon)
      </p>
      <img
        src={dataUrl}
        alt="Schema morphologie T2"
        className="mx-auto max-h-[320px] w-full max-w-md object-contain"
      />
    </div>
  );
}
