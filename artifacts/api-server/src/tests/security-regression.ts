import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { InvalidPhotoPayloadError, MAX_PHOTO_BYTES, persistPhotoUpload, validatePhotoPayload } from "../lib/photo-upload";

function packageVersion(name: string): string {
  const expressDirectory = dirname(require.resolve("express"));
  const entry = name === "express"
    ? require.resolve(name)
    : require.resolve(name, { paths: [expressDirectory] });
  let directory = dirname(entry);
  while (directory !== dirname(directory)) {
    const manifestPath = join(directory, "package.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { name?: string; version?: string };
      if (manifest.name === name && manifest.version) return manifest.version;
    }
    directory = dirname(directory);
  }
  throw new Error(`Could not resolve installed package version for ${name}`);
}

function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

for (const [name, minimum] of [
  ["express", "5.3.0"],
  ["body-parser", "2.4.0"],
  ["proxy-addr", "2.0.8"],
] as const) {
  const actual = packageVersion(name);
  assert.ok(compareVersions(actual, minimum) >= 0, `${name} ${actual} is below patched minimum ${minimum}`);
}

const webp = Buffer.from("RIFF0000WEBPpayload");
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from("payload")]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
assert.equal(validatePhotoPayload("image/webp", webp), null);
assert.equal(validatePhotoPayload("image/png", png), null);
assert.equal(validatePhotoPayload("image/jpeg", jpeg), null);
assert.match(validatePhotoPayload("text/plain", webp) ?? "", /Unsupported/);
assert.match(validatePhotoPayload("image/png", webp) ?? "", /match/);
assert.match(validatePhotoPayload("image/webp", Buffer.alloc(0)) ?? "", /empty/);
assert.match(validatePhotoPayload("image/webp", Buffer.alloc(MAX_PHOTO_BYTES + 1)) ?? "", /2 MB/);
assert.equal(validatePhotoPayload("image/webp", Buffer.alloc(MAX_PHOTO_BYTES, 0x00)), "Photo contents do not match the declared image type");

let saveCalls = 0;
let deleteCalls = 0;
const fakeStorage = {
  async saveUploadedPhoto() { saveCalls++; return "/api/storage/objects/uploads/test-id"; },
  async deleteUploadedPhoto() { deleteCalls++; },
};
await assert.rejects(persistPhotoUpload({
  contentType: "image/webp",
  data: Buffer.alloc(MAX_PHOTO_BYTES + 1),
  storage: fakeStorage,
  recordMetadata: async () => undefined,
}), InvalidPhotoPayloadError);
assert.equal(saveCalls, 0, "invalid or oversized images must not reach storage");

await assert.rejects(persistPhotoUpload({
  contentType: "image/webp",
  data: webp,
  storage: fakeStorage,
  recordMetadata: async () => { throw new Error("simulated metadata insert failure"); },
}), /simulated metadata insert failure/);
assert.equal(saveCalls, 1);
assert.equal(deleteCalls, 1, "stored object must be removed if its metadata row cannot be saved");

process.stdout.write("Security regression checks passed: patched Express chain and upload validation.\n");
