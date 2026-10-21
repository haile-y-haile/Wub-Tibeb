// Pure fit comparison. Mirrors the server tolerance used by the
// "compatible" filter: +/-5 cm for every field except length (+/-10 cm).
export const FIT_KEYS = ["bust", "waist", "hips", "shoulder", "length", "sleeves"] as const;
export type FitKey = typeof FIT_KEYS[number];
export type FitMeasures = Record<FitKey, number>;
export const FIT_TOLERANCE: Record<FitKey, number> = { bust: 5, waist: 5, hips: 5, shoulder: 5, length: 10, sleeves: 5 };

export type FitRow = { key: FitKey; garment: number; preferred: number; diff: number; within: boolean; tolerance: number };

/** diff = garment minus preferred garment measurement (positive = garment larger). */
export function compareFit(garment: FitMeasures, preferred: FitMeasures): { rows: FitRow[]; outside: number; allWithin: boolean } {
  const rows = FIT_KEYS.map((key) => {
    const diff = Math.round((Number(garment[key]) - Number(preferred[key])) * 10) / 10;
    const tolerance = FIT_TOLERANCE[key];
    return { key, garment: Number(garment[key]), preferred: Number(preferred[key]), diff, within: Math.abs(diff) <= tolerance, tolerance };
  });
  const outside = rows.filter((r) => !r.within).length;
  return { rows, outside, allWithin: outside === 0 };
}

export function hasFullMeasures(m: Partial<FitMeasures> | null | undefined): m is FitMeasures {
  return !!m && FIT_KEYS.every((k) => typeof m[k] === "number" && Number.isFinite(m[k]));
}
