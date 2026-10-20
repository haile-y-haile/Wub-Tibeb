import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { ObjectStorageService, objectStorageClient } from "../lib/objectStorage";
import { logger } from "../lib/logger";

// Run from this package using pnpm --filter @workspace/api-server tutorials:upload.
// Uses the existing sidecar-authenticated storage client; never prints credentials or bucket paths.
const source = resolve(process.argv[2] ?? "../../generated-artifacts/how-to");
const storage = new ObjectStorageService();
const publicPath = storage.getPublicObjectSearchPaths()[0].replace(/^\/+|\/+$/g, "");
const separator = publicPath.indexOf("/");
if (separator < 1) throw new Error("Public storage path is not configured");
const bucket = objectStorageClient.bucket(publicPath.slice(0, separator));
const prefix = publicPath.slice(separator + 1);
const uploads: { filename: string; size: number; contentType: string }[] = [];
for (const lesson of ["listing", "matching", "exchange"]) {
  for (const language of ["am", "en"]) {
    for (const [extension, contentType] of [["mp4", "video/mp4"], ["webp", "image/webp"], ["vtt", "text/vtt; charset=utf-8"]]) {
      const filename = `${lesson}-${language}.${extension}`;
      const info = await stat(resolve(source, filename));
      if (!info.size || info.size > 10 * 1024 * 1024) throw new Error(`Invalid tutorial size: ${filename}`);
      uploads.push({ filename, size: info.size, contentType });
    }
  }
}
// Validate every input before uploading anything.
for (const asset of uploads) {
  await bucket.upload(resolve(source, asset.filename), {
    destination: `${prefix}/tutorials/${asset.filename}`,
    resumable: false,
    metadata: { contentType: asset.contentType, cacheControl: "public, max-age=3600" },
  });
  logger.info({ filename: asset.filename, bytes: asset.size }, "Tutorial asset uploaded");
}
