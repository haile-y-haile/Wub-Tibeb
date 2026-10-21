import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { CreateListingBody, SendMessageBody } from "@workspace/api-zod";
import { createListingOnce, sendChat } from "../lib/marketplace";
import { logger } from "../lib/logger";

const tag = `test_retries_${randomUUID()}`;
const a = `${tag}_a`, b = `${tag}_b`;
const listingId = randomUUID(), messageId = randomUUID(), matchId = randomUUID();
const data = {
  title: "Retry safety test kemis", description: "Synthetic integration test, not available for exchange.",
  photos: ["/images/kemis-1.webp"], condition: "Excellent", color: "Ivory", fabric: "Cotton",
  embroidery: "Green tibeb", occasion: "Timket", timesWorn: 2,
  measurements: { bust: 92, waist: 76, hips: 100, shoulder: 38, length: 140, sleeves: 58 },
};
try {
  assert.equal(CreateListingBody.safeParse({ ...data, clientRequestId: "invalid" }).success, false);
  assert.equal(SendMessageBody.safeParse({ text: "hello", clientRequestId: "invalid" }).success, false);
  assert.equal(CreateListingBody.safeParse({ ...data, clientRequestId: listingId }).success, true);
  await pool.query("INSERT INTO kemis_profiles(id,name,neighborhood) VALUES($1,'Retry fixture A','Test'),($2,'Retry fixture B','Test')", [a,b]);

  const created = await Promise.all([
    createListingOnce(a, data, listingId), createListingOnce(a, data, listingId),
  ]);
  assert.equal(created.filter(x => x.created).length, 1);
  assert.equal(created[0].listing.id, created[1].listing.id);
  // Ensure this synthetic garment cannot be exchanged by a real member.
  await pool.query("UPDATE kemis_listings SET demo=true WHERE id=$1", [listingId]);
  assert.equal((await pool.query("SELECT count(*)::int n FROM kemis_listings WHERE id=$1", [listingId])).rows[0].n, 1);
  // JSONB object-key reordering must not make an identical retry look different.
  const reordered = Object.fromEntries(Object.entries(data).reverse());
  assert.equal((await createListingOnce(a, reordered, listingId)).listing.id, listingId);
  await assert.rejects(createListingOnce(a, { ...data, title: "Changed request" }, listingId), { status: 409 });
  await assert.rejects(createListingOnce(b, data, listingId), { status: 409 });

  const other = await createListingOnce(b, data);
  await pool.query("UPDATE kemis_listings SET demo=true WHERE id=$1", [other.listing.id]);
  const aFirst = listingId < other.listing.id;
  await pool.query("INSERT INTO kemis_matches(id,dress_a,dress_b,user_a,user_b) VALUES($1,$2,$3,$4,$5)",
    [matchId, aFirst ? listingId : other.listing.id, aFirst ? other.listing.id : listingId, aFirst ? a : b, aFirst ? b : a]);
  const sent = await Promise.all([
    sendChat(a, matchId, "Test retry message", messageId),
    sendChat(a, matchId, "Test retry message", messageId),
  ]);
  assert.equal(sent[0].id, sent[1].id);
  assert.equal(sent[0].createdAt, sent[1].createdAt);
  assert.equal((await pool.query("SELECT count(*)::int n FROM kemis_messages WHERE id=$1", [messageId])).rows[0].n, 1);
  assert.equal((await pool.query("SELECT count(*)::int n FROM kemis_notifications WHERE user_id=$1", [b])).rows[0].n, 1);
  await assert.rejects(sendChat(b, matchId, "Test retry message", messageId), { status: 409 });
  await assert.rejects(sendChat(a, matchId, "Different text", messageId), { status: 409 });
  // A previously sent message can be acknowledged after cancellation without inserting another.
  await pool.query("UPDATE kemis_matches SET status='cancelled' WHERE id=$1", [matchId]);
  assert.equal((await sendChat(a, matchId, "Test retry message", messageId)).id, messageId);
  await assert.rejects(sendChat(a, matchId, "New message", randomUUID()), { status: 409 });
  logger.info("PASS: concurrent listing/message retries are idempotent, ownership and payload conflicts are rejected, and message notifications are not duplicated");
} finally {
  // Only this run's synthetic IDs are ever removed. No Clerk identities are created.
  await pool.query("DELETE FROM kemis_notifications WHERE user_id=ANY($1::text[])", [[a,b]]);
  await pool.query("DELETE FROM kemis_messages WHERE match_id=$1", [matchId]);
  await pool.query("DELETE FROM kemis_matches WHERE id=$1", [matchId]);
  await pool.query("DELETE FROM kemis_listings WHERE owner_id=ANY($1::text[])", [[a,b]]);
  await pool.query("DELETE FROM kemis_profiles WHERE id=ANY($1::text[])", [[a,b]]);
  await pool.end();
}
