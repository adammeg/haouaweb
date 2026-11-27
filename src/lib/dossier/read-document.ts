"use client";

/**
 * Lecture locale d'un compte rendu (aucun envoi) : couche texte des PDF avec pdf.js, sinon
 * reconnaissance de caractères (Tesseract) sur la photo ou sur les pages scannées.
 */

const MAX_PAGES = 4;

async function ocr(images: (HTMLCanvasElement | File)[]): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra");
  try {
    const parts: string[] = [];
    for (const img of images) parts.push((await worker.recognize(img)).data.text);
    return parts.join("\n");
  } finally {
    await worker.terminate();
  }
}

async function readPdf(file: File): Promise<{ text: string; scanned: boolean }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(pdf.numPages, MAX_PAGES);
  const lines: string[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Regroupe les morceaux de texte par ligne (même ordonnée), de gauche à droite.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3);
      rows.set(y, [...(rows.get(y) ?? []), { x: item.transform[4], s: item.str }]);
    }
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      lines.push(rows.get(y)!.sort((a, b) => a.x - b.x).map((r) => r.s).join(" "));
    }
  }
  const text = lines.join("\n");
  if (text.replace(/\s/g, "").length > 40) return { text, scanned: false };
  // PDF scanné : rendu des pages puis reconnaissance de caractères.
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    canvases.push(canvas);
  }
  return { text: await ocr(canvases), scanned: true };
}

export async function readDocumentText(file: File): Promise<{ text: string; scanned: boolean }> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return readPdf(file);
  if (file.type.startsWith("image/")) return { text: await ocr([file]), scanned: true };
  if (file.type.startsWith("text/")) return { text: await file.text(), scanned: false };
  throw new Error("Format non pris en charge : PDF, photo ou texte uniquement.");
}

/** Réduit une photo avant archivage (le stockage local du poste est limité). */
export async function compressImage(file: File, max = 1600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
