// Pure listing-draft model and step validation (no React, no aliases).
export const DRAFT_MKEYS = ["bust", "waist", "hips", "shoulder", "length", "sleeves"] as const;
export type MKey = typeof DRAFT_MKEYS[number];
export const MRANGE: Record<MKey, [number, number]> = { bust: [20, 250], waist: [20, 250], hips: [20, 250], shoulder: [10, 100], length: [30, 250], sleeves: [0, 120] };

export type DraftFields = {
  title: string; description: string; condition: string; occasion: string;
  color: string; fabric: string; embroidery: string; timesWorn: string;
  m: Record<MKey, string>;
};
export type PendingPhoto = { id: string; blob: Blob; status: "uploading" | "failed" };
export type DraftPayload = {
  title: string; description: string; photos: string[]; condition: string; color: string; fabric: string;
  embroidery: string; occasion: string; timesWorn: number; measurements: Record<MKey, number>;
};
export type ListingDraft = {
  v: 1; kind: "new" | "edit"; listingId?: string; requestId?: string; step: number;
  fields: DraftFields; photos: string[]; pending: PendingPhoto[]; updatedAt: number;
  /** Present while a create request may have reached the server. Retries reuse this exact payload. */
  submission?: { payload: DraftPayload; state: "sending" | "unknown" };
};

export type ErrCode = "required" | "tooShort" | "tooLong" | "number" | "whole" | "range" | "photos" | "uploading";
export type FieldErr = { code: ErrCode; n?: number; min?: number; max?: number };
export type StepErrors = Partial<Record<string, FieldErr>>;

export const STEP_COUNT = 4;
export const DETAIL_ORDER = ["title", "description", "occasion", "condition", "color", "fabric", "embroidery", "timesWorn"] as const;

function text(v: string, min: number, max: number): FieldErr | undefined {
  const s = v.trim();
  if (!s) return { code: "required" };
  if (s.length < min) return { code: "tooShort", n: min };
  if (s.length > max) return { code: "tooLong", n: max };
  return undefined;
}
function numErr(v: string, min: number, max: number, whole = false): FieldErr | undefined {
  const s = v.trim().replace(",", ".");
  if (!s) return { code: "required" };
  const n = Number(s);
  if (!Number.isFinite(n)) return { code: "number" };
  if (whole && !Number.isInteger(n)) return { code: "whole" };
  if (n < min || n > max) return { code: "range", min, max };
  return undefined;
}

export function validateStep(step: number, d: Pick<ListingDraft, "fields" | "photos" | "pending">, opts: { conditions: string[]; occasions: string[] }): StepErrors {
  const e: StepErrors = {}; const f = d.fields;
  if (step === 0) {
    if (d.pending.length) e.photos = { code: "uploading" };
    else if (d.photos.length < 1) e.photos = { code: "photos" };
  }
  if (step === 1) {
    const set = (k: string, x?: FieldErr) => { if (x) e[k] = x; };
    set("title", text(f.title, 3, 100));
    set("description", text(f.description, 10, 2000));
    if (!opts.occasions.includes(f.occasion)) e.occasion = { code: "required" };
    if (!opts.conditions.includes(f.condition)) e.condition = { code: "required" };
    set("color", text(f.color, 1, 40));
    set("fabric", text(f.fabric, 1, 60));
    set("embroidery", text(f.embroidery, 1, 120));
    set("timesWorn", numErr(f.timesWorn, 0, 1000, true));
  }
  if (step === 2) for (const k of DRAFT_MKEYS) { const x = numErr(f.m[k], MRANGE[k][0], MRANGE[k][1]); if (x) e[k] = x; }
  return e;
}

export function firstInvalidStep(d: Pick<ListingDraft, "fields" | "photos" | "pending">, opts: { conditions: string[]; occasions: string[] }) {
  for (let s = 0; s < 3; s++) if (Object.keys(validateStep(s, d, opts)).length) return s;
  return -1;
}

const num = (v: string) => Number(v.trim().replace(",", "."));
export function toPayload(d: Pick<ListingDraft, "fields" | "photos">): DraftPayload {
  const f = d.fields;
  return {
    title: f.title.trim(), description: f.description.trim(), photos: [...d.photos], condition: f.condition,
    color: f.color.trim(), fabric: f.fabric.trim(), embroidery: f.embroidery.trim(), occasion: f.occasion,
    timesWorn: num(f.timesWorn),
    measurements: Object.fromEntries(DRAFT_MKEYS.map((k) => [k, num(f.m[k])])) as Record<MKey, number>,
  };
}

export function emptyFields(defaultFabric: string): DraftFields {
  return {
    title: "", description: "", condition: "Excellent", occasion: "Timket", color: "", fabric: defaultFabric, embroidery: "", timesWorn: "1",
    m: { bust: "", waist: "", hips: "", shoulder: "", length: "", sleeves: "" },
  };
}

export function fieldsFrom(l: Omit<DraftPayload, "photos">): DraftFields {
  return {
    title: l.title, description: l.description, condition: l.condition, occasion: l.occasion, color: l.color, fabric: l.fabric,
    embroidery: l.embroidery, timesWorn: String(l.timesWorn),
    m: Object.fromEntries(DRAFT_MKEYS.map((k) => [k, String(l.measurements[k])])) as Record<MKey, string>,
  };
}

/** Only delete a stored draft when it is still the one that was submitted. */
export function shouldDeleteAfterSave(stored: Pick<ListingDraft, "requestId" | "updatedAt"> | undefined, submittedRequestId: string | undefined, submittedAt: number) {
  if (!stored) return false;
  if (submittedRequestId) return stored.requestId === submittedRequestId;
  return stored.updatedAt <= submittedAt;
}
