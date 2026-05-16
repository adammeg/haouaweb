"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  OCR_LABELS,
  ocrToPatientPatch,
  parseOcrText,
  type OcrFieldKey,
} from "@/lib/bridge/ocr-patterns";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (patch: Record<string, string>) => void;
};

export function OcrCameraModal({ open, onClose, onApply }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("Initialisation...");
  const [preview, setPreview] = useState<Partial<Record<OcrFieldKey, number>> | null>(
    null,
  );
  const [manualText, setManualText] = useState("");
  const runningRef = useRef(false);

  const stopCamera = useCallback(() => {
    runningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const runOcr = useCallback(async (dataUrl: string) => {
    setStatus("Analyse OCR...");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const result = await worker.recognize(dataUrl);
      await worker.terminate();
      const found = parseOcrText(result.data.text);
      const count = Object.keys(found).length;
      if (count > 0) {
        setPreview(found);
        setStatus(count + " mesure(s) detectee(s)");
      } else {
        setStatus("Aucune mesure reconnue — recadrez ou collez le texte");
      }
    } catch (e) {
      setStatus("Erreur OCR : " + (e instanceof Error ? e.message : "inconnue"));
    }
  }, []);

  const captureCycle = useCallback(async () => {
    if (!runningRef.current || !videoRef.current || !canvasRef.current) return;
    const vid = videoRef.current;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    if (!ctx || !vid.videoWidth) {
      setTimeout(() => void captureCycle(), 500);
      return;
    }
    cvs.width = vid.videoWidth;
    cvs.height = vid.videoHeight;
    ctx.drawImage(vid, 0, 0);
    const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
    const px = imgData.data;
    for (let i = 0; i < px.length; i += 4) {
      const gray = 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
      px[i] = px[i + 1] = px[i + 2] = enhanced;
    }
    ctx.putImageData(imgData, 0, 0);
    await runOcr(cvs.toDataURL("image/png"));
    if (runningRef.current && !preview) {
      setTimeout(() => void captureCycle(), 2000);
    }
  }, [runOcr, preview]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setPreview(null);
      setManualText("");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera non disponible");
      return;
    }
    runningRef.current = true;
    setStatus("Demande d'acces camera...");
    void navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
        setStatus("Pointez vers l'ecran de l'echographe");
        setTimeout(() => void captureCycle(), 1500);
      })
      .catch((e) => {
        setStatus("Camera refusee : " + e.message);
      });
    return () => stopCamera();
  }, [open, stopCamera, captureCycle]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">OCR echographe</h2>
          <button
            type="button"
            className="text-sm text-[var(--muted)]"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Fermer
          </button>
        </div>
        <p className="mb-3 text-xs text-[var(--muted)]">{status}</p>
        <video
          ref={videoRef}
          className="mb-3 w-full rounded-xl bg-black"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        <label className="mb-3 block text-xs font-semibold">
          Ou coller le texte OCR :
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2 font-mono text-xs"
            rows={4}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="BIP: 55&#10;HC: 200"
          />
        </label>
        <button
          type="button"
          className="mb-3 w-full rounded-xl border py-2 text-xs font-semibold"
          onClick={() => {
            const found = parseOcrText(manualText);
            setPreview(found);
            setStatus(Object.keys(found).length + " mesure(s) depuis texte");
          }}
        >
          Analyser le texte
        </button>
        {preview && Object.keys(preview).length > 0 ? (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(Object.keys(preview) as OcrFieldKey[]).map((k) => (
              <div
                key={k}
                className="flex justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs"
              >
                <span>{OCR_LABELS[k]}</span>
                <strong>{preview[k]}</strong>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!preview || Object.keys(preview).length === 0}
            className="flex-1 rounded-xl bg-[var(--teal)] py-2.5 text-sm font-bold text-white disabled:opacity-40"
            onClick={() => {
              if (!preview) return;
              onApply(ocrToPatientPatch(preview));
              stopCamera();
              onClose();
            }}
          >
            Injecter dans le dossier
          </button>
          <button
            type="button"
            className="rounded-xl border px-4 py-2.5 text-sm"
            onClick={() => void captureCycle()}
          >
            Re-scan
          </button>
        </div>
      </div>
    </div>
  );
}
