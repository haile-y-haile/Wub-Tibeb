export const apiOrigin = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : '';

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function imageUrl(path?: string) {
  if (!path) return '';
  return absoluteUrl(path);
}

export function messageText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
