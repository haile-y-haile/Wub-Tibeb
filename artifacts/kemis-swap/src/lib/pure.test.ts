import { test } from "node:test";
import assert from "node:assert/strict";
import { compareFit, hasFullMeasures } from "./fit.ts";
import { deriveExchange } from "./exchange-state.ts";
import { validateStep, toPayload, emptyFields, firstInvalidStep, shouldDeleteAfterSave } from "./listing-draft.ts";

const P = { bust: 90, waist: 74, hips: 100, shoulder: 38, length: 140, sleeves: 58 };

test("fit uses signed garment-minus-preference and server tolerance", () => {
  const r = compareFit({ ...P, waist: 70, length: 149, sleeves: 64 }, P);
  const w = r.rows.find((x) => x.key === "waist")!;
  assert.equal(w.diff, -4); assert.equal(w.within, true);
  assert.equal(r.rows.find((x) => x.key === "length")!.within, true);
  assert.equal(r.rows.find((x) => x.key === "sleeves")!.within, false);
  assert.equal(r.outside, 1);
  assert.equal(compareFit({ ...P, length: 151 }, P).allWithin, false);
  assert.equal(compareFit({ ...P, bust: 95 }, P).allWithin, true);
  assert.equal(hasFullMeasures(undefined), false);
});

const base = { status: "matched", proposal: "", acceptedBy: [] as string[], completedBy: [] as string[], me: "a", other: "b" };
test("exchange tracker never unlocks completion before bilateral acceptance", () => {
  let v = deriveExchange(base);
  assert.equal(v.next, "nx_propose"); assert.equal(v.canComplete, false); assert.equal(v.canAccept, false);
  v = deriveExchange({ ...base, status: "proposed", proposal: "Bole, Sat 10" });
  assert.equal(v.next, "nx_accept"); assert.equal(v.canAccept, true); assert.equal(v.canComplete, false);
  v = deriveExchange({ ...base, status: "proposed", proposal: "x", acceptedBy: ["a"] });
  assert.equal(v.next, "nx_waitAccept"); assert.equal(v.canComplete, false); assert.equal(v.myTurn, false);
  v = deriveExchange({ ...base, status: "accepted", proposal: "x", acceptedBy: ["a", "b"] });
  assert.equal(v.next, "nx_meet"); assert.equal(v.canComplete, true); assert.equal(v.canCancel, true); assert.equal(v.canPropose, false);
  v = deriveExchange({ ...base, status: "accepted", proposal: "x", acceptedBy: ["a", "b"], completedBy: ["b"] });
  assert.equal(v.next, "nx_confirmOther"); assert.equal(v.canCancel, false);
  v = deriveExchange({ ...base, status: "accepted", proposal: "x", acceptedBy: ["a", "b"], completedBy: ["a"] });
  assert.equal(v.next, "nx_waitConfirm"); assert.equal(v.canComplete, false); assert.equal(v.canCancel, false);
  v = deriveExchange({ ...base, status: "completed", proposal: "x", acceptedBy: ["a", "b"], completedBy: ["a", "b"] });
  assert.equal(v.outcome, "completed"); assert.ok(v.steps.every((s) => s.state === "done"));
  v = deriveExchange({ ...base, status: "cancelled", proposal: "x", acceptedBy: ["a", "b"], completedBy: ["a"] });
  assert.equal(v.outcome, "disputeClosed"); assert.equal(v.canCancel, false);
  v = deriveExchange({ ...base, status: "cancelled" });
  assert.equal(v.outcome, "cancelled");
  v = deriveExchange({ ...base, status: "proposed", proposal: "x", demo: true });
  assert.equal(v.canAccept, false);
});

const opts = { conditions: ["Excellent"], occasions: ["Timket"] };
test("listing draft validation per step and payload", () => {
  const d = { fields: emptyFields("cotton"), photos: [] as string[], pending: [] };
  assert.equal(validateStep(0, d, opts).photos?.code, "photos");
  assert.equal(firstInvalidStep(d, opts), 0);
  const d2 = { ...d, photos: ["/objects/a"], fields: { ...d.fields, title: "ab", description: "long enough text", color: "green", embroidery: "gold", timesWorn: "1.5" } };
  const e = validateStep(1, d2, opts);
  assert.equal(e.title?.code, "tooShort"); assert.equal(e.timesWorn?.code, "whole");
  const d3 = { ...d2, fields: { ...d2.fields, title: "Cream kemis", timesWorn: "2", m: { bust: "90", waist: "74", hips: "100", shoulder: "38", length: "300", sleeves: "0" } } };
  assert.equal(validateStep(2, d3, opts).length?.code, "range");
  assert.equal(firstInvalidStep(d3, opts), 2);
  const p = toPayload({ ...d3, fields: { ...d3.fields, m: { ...d3.fields.m, length: "140,5" } } });
  assert.equal(p.measurements.length, 140.5); assert.equal(p.timesWorn, 2);
  assert.equal(shouldDeleteAfterSave({ requestId: "x", updatedAt: 1 }, "y", 5), false);
  assert.equal(shouldDeleteAfterSave({ requestId: "x", updatedAt: 1 }, "x", 5), true);
  assert.equal(shouldDeleteAfterSave({ updatedAt: 9 }, undefined, 5), false);
});
