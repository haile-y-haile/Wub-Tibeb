import type { PrivateBucket, SqlExecutor } from "./types";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export function validateImageBytes(type: string, bytes: Uint8Array): boolean {
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  }
  if (type === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export async function readLimitedBody(request: Request): Promise<Uint8Array> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_PHOTO_BYTES) {
    throw new UploadError("Photo must be 2 MB or smaller", 413);
  }
  if (!request.body) throw new UploadError("Photo is empty", 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_PHOTO_BYTES) {
        await reader.cancel();
        throw new UploadError("Photo must be 2 MB or smaller", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!length) throw new UploadError("Photo is empty", 400);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function savePrivatePhoto({
  store,
  bucket,
  userId,
  contentType,
  bytes,
  uuid,
}: {
  store: SqlExecutor;
  bucket: PrivateBucket;
  userId: string;
  contentType: string;
  bytes: Uint8Array;
  uuid: string;
}): Promise<string> {
  if (!allowedTypes.has(contentType)) {
    throw new UploadError("Upload a JPEG, PNG or WebP photo", 415);
  }
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new UploadError("Photo must be 2 MB or smaller", 413);
  }
  if (!validateImageBytes(contentType, bytes)) {
    throw new UploadError("Photo contents do not match the declared image type", 400);
  }

  const path = `/api/storage/objects/uploads/${uuid}`;
  const key = `uploads/${uuid}`;
  await bucket.put(key, bytes, { httpMetadata: { contentType } });
  try {
    await store.query(
      "INSERT INTO kemis_uploads(path,owner_id,content_type,size) VALUES($1,$2,$3,$4)",
      [path, userId, contentType, bytes.length],
    );
  } catch (error) {
    try {
      await bucket.delete(key);
    } catch {
      // Preserve the database error; the orphan key can be identified by
      // comparing R2 keys against kemis_uploads during staging cleanup.
    }
    throw error;
  }
  return path;
}
