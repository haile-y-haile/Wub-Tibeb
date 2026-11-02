export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function validatePhotoPayload(contentType: string, data: Buffer): string | null {
  if (!ALLOWED_TYPES.has(contentType)) return "Unsupported photo type";
  if (data.length < 1) return "Photo is empty";
  if (data.length > MAX_PHOTO_BYTES) return "Photo exceeds the 2 MB limit";

  const valid =
    (contentType === "image/jpeg" && data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) ||
    (contentType === "image/png" && data.subarray(0, 8).equals(PNG_SIGNATURE)) ||
    (contentType === "image/webp" && data.length >= 12 &&
      data.subarray(0, 4).toString("ascii") === "RIFF" &&
      data.subarray(8, 12).toString("ascii") === "WEBP");

  return valid ? null : "Photo contents do not match the declared image type";
}

export class InvalidPhotoPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPhotoPayloadError";
  }
}

export async function persistPhotoUpload({
  contentType,
  data,
  storage,
  recordMetadata,
  onCleanupError,
}: {
  contentType: string;
  data: Buffer;
  storage: {
    saveUploadedPhoto: (data: Buffer, contentType: string) => Promise<string>;
    deleteUploadedPhoto: (path: string) => Promise<void>;
  };
  recordMetadata: (path: string, contentType: string, size: number) => Promise<void>;
  onCleanupError?: (error: unknown, path: string) => void;
}): Promise<string> {
  const invalid = validatePhotoPayload(contentType, data);
  if (invalid) throw new InvalidPhotoPayloadError(invalid);

  const path = await storage.saveUploadedPhoto(data, contentType);
  try {
    await recordMetadata(path, contentType, data.length);
  } catch (error) {
    try {
      await storage.deleteUploadedPhoto(path);
    } catch (cleanupError) {
      onCleanupError?.(cleanupError, path);
    }
    throw error;
  }
  return path;
}
