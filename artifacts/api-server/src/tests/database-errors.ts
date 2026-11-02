import assert from "node:assert/strict";
import { databaseUnavailableResponse } from "../lib/database-errors";

const endpointDisabled = Object.assign(new Error("The endpoint has been disabled."), {
  code: "28000",
});
const connectionRefused = Object.assign(new Error("Connection refused"), {
  code: "ECONNREFUSED",
});
const postgresConnectionFailure = Object.assign(new Error("Connection failure"), {
  code: "08006",
});
const missingRelation = Object.assign(new Error("relation does not exist"), {
  code: "42P01",
});

assert.deepEqual(databaseUnavailableResponse(endpointDisabled), {
  status: 503,
  body: {
    code: "DATA_SERVICE_UNAVAILABLE",
    error: "Swap data is temporarily unavailable. Please try again shortly.",
  },
});
assert.equal(databaseUnavailableResponse(connectionRefused)?.status, 503);
assert.equal(databaseUnavailableResponse(postgresConnectionFailure)?.status, 503);
assert.equal(databaseUnavailableResponse(missingRelation), null);
assert.equal(databaseUnavailableResponse(new Error("unexpected bug")), null);
assert.equal(databaseUnavailableResponse(null), null);

console.log("Database outage classification regression tests passed.");
