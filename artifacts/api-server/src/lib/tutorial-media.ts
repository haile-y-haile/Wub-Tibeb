/** Only curated tutorial assets are public; member uploads use their existing ACL route. */
export function isTutorialAsset(filename: string): boolean {
  return /^(listing|matching|exchange)-(am|en)\.(mp4|webp|vtt)$/.exec(filename)?.[0] === filename;
}

export type ByteRange = { start: number; end: number };

/** undefined means a full response; null means an unsatisfiable/unsupported range. */
export function parseTutorialRange(header: string | undefined, size: number): ByteRange | null | undefined {
  if (!header) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size < 1) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix < 1) return null;
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) return null;
  return { start, end: Math.min(end, size - 1) };
}
