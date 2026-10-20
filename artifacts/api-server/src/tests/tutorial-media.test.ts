import { test } from "node:test";
import assert from "node:assert/strict";
import { isTutorialAsset, parseTutorialRange } from "../lib/tutorial-media";

test("only curated lesson/language/asset combinations are public", () => {
  for (const lesson of ["listing", "matching", "exchange"]) {
    for (const language of ["am", "en"]) {
      for (const extension of ["mp4", "webp", "vtt"]) {
        assert.equal(isTutorialAsset(`${lesson}-${language}.${extension}`), true);
      }
    }
  }
  for (const filename of ["../secret", "listing-am.mp4/anything", "listing-am.mp4\n", "listing-fr.mp4", "member-photo.webp", "listing-am.svg"]) {
    assert.equal(isTutorialAsset(filename), false);
  }
});

test("full, bounded, open-ended and suffix ranges", () => {
  assert.equal(parseTutorialRange(undefined, 100), undefined);
  assert.deepEqual(parseTutorialRange("bytes=0-9", 100), { start: 0, end: 9 });
  assert.deepEqual(parseTutorialRange("bytes=90-", 100), { start: 90, end: 99 });
  assert.deepEqual(parseTutorialRange("bytes=90-200", 100), { start: 90, end: 99 });
  assert.deepEqual(parseTutorialRange("bytes=-10", 100), { start: 90, end: 99 });
  assert.deepEqual(parseTutorialRange("bytes=-200", 100), { start: 0, end: 99 });
});

test("invalid, multi-part and unsatisfiable ranges return 416", () => {
  for (const header of ["bytes=100-", "bytes=10-2", "bytes=-0", "bytes=-", "bytes=0-1,3-4", "items=0-2", "bytes=9007199254740992-", "bytes=0-9007199254740992"]) {
    assert.equal(parseTutorialRange(header, 100), null, header);
  }
  assert.equal(parseTutorialRange("bytes=0-", 0), null);
});
