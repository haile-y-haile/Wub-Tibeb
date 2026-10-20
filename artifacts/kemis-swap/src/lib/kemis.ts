import { ListingInputCondition, ListingInputOccasion } from "@workspace/api-client-react";

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
export const OCCASIONS = Object.values(ListingInputOccasion);
export const CONDITIONS = Object.values(ListingInputCondition);
export const MEASURE_KEYS = ["bust", "waist", "hips", "shoulder", "length", "sleeves"] as const;

export function photoSrc(p?: string) {
  if (!p) return "";
  if (/^https?:/.test(p) || p.startsWith("/api/")) return p;
  if (p.startsWith("/")) return `${basePath}${p}`;
  return p;
}

export async function compressImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  let q = 0.75;
  for (;;) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", q));
    if (!blob) throw new Error("Could not compress image");
    if (blob.size <= 2 * 1024 * 1024 || q <= 0.4) {
      if (blob.size > 2 * 1024 * 1024) throw new Error("Image too large");
      return blob;
    }
    q -= 0.1;
  }
}

export function errMsg(err: unknown, fallback: string) {
  const e = err as { data?: { error?: string; message?: string }; message?: string } | null;
  return e?.data?.error || e?.data?.message || fallback;
}
