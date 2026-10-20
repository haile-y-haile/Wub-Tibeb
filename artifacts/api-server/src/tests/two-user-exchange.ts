/**
 * Database integration test of the real exchange services.
 * Synthetic fixture identities are NOT browser accounts and never bypass API authentication.
 * Run with `pnpm --filter @workspace/api-server test:exchange`.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { swipe,exchange,sendChat,loadMatch,loadListing,MarketError,transaction,cancelOpenMatchesSafely,closeHandoffDisputes } from "../lib/marketplace";
import { logger } from "../lib/logger";
import { readFile } from "node:fs/promises";
import { ObjectStorageService } from "../lib/objectStorage";
import { beforeCursor } from "../lib/pagination";

const prefix="test-"+randomUUID(),a=prefix+"-a",b=prefix+"-b",outsider=prefix+"-outsider";
const da=prefix+"-dress-a",db=prefix+"-dress-b",dc=prefix+"-dress-c",dd=prefix+"-dress-d";
const ids=[a,b,outsider],dresses=[da,db,dc,dd];
const plan="Saturday 12:00, public café entrance in Bole.",newPlan="Sunday 13:00, public café entrance in Bole.";
const storage=new ObjectStorageService();
let uploadedPath:string|undefined;
const data={
  title:"Integration test Habesha kemis",description:"Synthetic integration test garment; removed after test.",
  photos:["/images/kemis-1.webp"],condition:"Excellent",color:"Ivory",fabric:"Cotton",embroidery:"Tibeb",
  occasion:"Timket",timesWorn:1,measurements:{bust:90,waist:76,hips:98,shoulder:40,length:145,sleeves:55},
};
async function rejectsStatus(fn:()=>Promise<unknown>,status:number) {
  await assert.rejects(fn,(e:unknown)=>e instanceof MarketError&&e.status===status);
}
try {
  for(const uid of ids) await pool.query("INSERT INTO kemis_profiles(id,name,neighborhood) VALUES($1,'Integration test','Test only')",[uid]);
  const bytes=await readFile("../kemis-swap/public/images/kemis-1.webp");
  const uploadURL=await storage.getObjectEntityUploadURL();
  const put=await fetch(uploadURL,{method:"PUT",body:bytes,headers:{"Content-Type":"image/webp"}});
  assert.ok(put.ok,"Real App Storage upload must succeed");
  uploadedPath=storage.normalizeObjectEntityPath(uploadURL);
  const file=await storage.getObjectEntityFile(uploadedPath);
  const [metadata]=await file.getMetadata();
  assert.equal(Number(metadata.size),bytes.length);
  assert.equal(metadata.contentType,"image/webp");
  data.photos=["/api/storage"+uploadedPath];
  for(const [id,owner] of [[da,a],[db,b],[dc,b],[dd,a]]) await pool.query("INSERT INTO kemis_listings(id,owner_id,data) VALUES($1,$2,$3)",[id,owner,JSON.stringify(data)]);
  await rejectsStatus(()=>swipe(outsider,{targetId:db,offeredId:da,direction:"like"}),403);
  await rejectsStatus(()=>swipe(a,{targetId:da,offeredId:da,direction:"like"}),400);
  assert.equal((await swipe(a,{targetId:db,offeredId:da,direction:"like"})).matched,false);
  // Same two profiles, wrong garment: must NOT match.
  assert.equal((await swipe(b,{targetId:da,offeredId:dc,direction:"like"})).matched,false);
  const result=await swipe(b,{targetId:da,offeredId:db,direction:"like"});
  assert.equal(result.matched,true); assert.ok(result.matchId);
  let mid=result.matchId!;
  // An idempotent repeated like does not create another match.
  assert.equal((await swipe(a,{targetId:db,offeredId:da,direction:"like"})).matchId,mid);
  assert.equal((await pool.query("SELECT count(*)::int n FROM kemis_matches WHERE dress_a=ANY($1::text[])",[dresses])).rows[0].n,1);
  assert.equal((await pool.query("SELECT count(*)::int n FROM kemis_notifications WHERE user_id=ANY($1::text[])",[ids])).rows[0].n,2,"Repeated likes must not duplicate match notifications");
  await rejectsStatus(()=>loadMatch(pool,mid,outsider),404);
  await rejectsStatus(()=>sendChat(outsider,mid,"Private?"),404);
  const first=await sendChat(a,mid,"Can we exchange in a public place?");
  const second=await sendChat(b,mid,"Yes, Saturday at noon.");
  assert.equal(first.senderId,a); assert.equal(second.senderId,b);
  assert.equal((await pool.query("SELECT count(*)::int n FROM kemis_messages WHERE match_id=$1",[mid])).rows[0].n,2);
  const cancelledId=mid;
  await exchange(a,mid,{action:"cancel"});
  assert.equal((await loadMatch(pool,cancelledId,a)).status,"cancelled");
  assert.equal((await pool.query("SELECT count(*)::int n FROM kemis_messages WHERE match_id=$1",[cancelledId])).rows[0].n,2,"Cancelled conversations must be preserved");
  assert.equal((await swipe(a,{targetId:db,offeredId:da,direction:"like"})).matched,false,"Both members must express fresh interest");
  mid=(await swipe(b,{targetId:da,offeredId:db,direction:"like"})).matchId!;
  assert.ok(mid && mid!==cancelledId,"Cancelled pair must be able to start a distinct attempt");
  await rejectsStatus(()=>exchange(a,mid,{action:"complete"}),409);
  await rejectsStatus(()=>exchange(a,mid,{action:"accept"}),409);
  await exchange(a,mid,{action:"propose",proposal:plan});
  await exchange(a,mid,{action:"accept",expectedProposal:plan});
  await exchange(b,mid,{action:"propose",proposal:newPlan});
  assert.equal((await loadMatch(pool,mid,a)).accepted_by.length,0,"Changed terms must clear consent");
  await rejectsStatus(()=>exchange(a,mid,{action:"accept",expectedProposal:plan}),409);
  let state=await exchange(a,mid,{action:"accept",expectedProposal:newPlan});
  assert.equal(state.status,"proposed"); assert.equal(state.acceptedBy.length,1);
  await exchange(a,mid,{action:"accept",expectedProposal:newPlan});
  assert.equal((await loadMatch(pool,mid,a)).accepted_by.length,1);
  await rejectsStatus(()=>exchange(a,mid,{action:"complete"}),409);
  state=await exchange(b,mid,{action:"accept",expectedProposal:newPlan});
  assert.equal(state.status,"accepted"); assert.equal(state.acceptedBy.length,2);
  assert.equal((await loadListing(pool,da)).status,"reserved");
  assert.equal((await loadListing(pool,db)).status,"reserved");
  await transaction(async c=>cancelOpenMatchesSafely(c,[await loadMatch(c,mid,a)]));
  assert.equal((await loadMatch(pool,mid,a)).status,"cancelled");
  assert.equal((await loadListing(pool,da)).status,"active","A safety cancellation BEFORE handoff releases reservations");
  assert.equal((await swipe(a,{targetId:db,offeredId:da,direction:"like"})).matched,false);
  mid=(await swipe(b,{targetId:da,offeredId:db,direction:"like"})).matchId!;
  await exchange(a,mid,{action:"propose",proposal:newPlan});
  await exchange(a,mid,{action:"accept",expectedProposal:newPlan});
  await exchange(b,mid,{action:"accept",expectedProposal:newPlan});
  await rejectsStatus(()=>swipe(b,{targetId:da,offeredId:dc,direction:"like"}),409);
  state=await exchange(a,mid,{action:"complete"});
  assert.equal(state.status,"accepted"); assert.equal(state.completedBy.length,1);
  await transaction(async c=>cancelOpenMatchesSafely(c,[await loadMatch(c,mid,a)]));
  assert.equal((await loadMatch(pool,mid,a)).status,"accepted","Safety actions AFTER handoff must preserve the hold");
  assert.equal((await loadListing(pool,da)).status,"reserved");
  await rejectsStatus(()=>exchange(b,mid,{action:"cancel"}),409);
  state=await exchange(b,mid,{action:"complete"});
  assert.equal(state.status,"completed"); assert.equal(state.completedBy.length,2);
  assert.equal((await loadListing(pool,da)).status,"swapped");
  assert.equal((await loadListing(pool,db)).status,"swapped");
  assert.equal((await loadMatch(pool,mid,a)).status,"completed"); // durable history
  await rejectsStatus(()=>exchange(a,mid,{action:"propose",proposal:"Changed"}),409);
  await swipe(a,{targetId:dc,offeredId:dd,direction:"like"});
  const disputed=(await swipe(b,{targetId:dd,offeredId:dc,direction:"like"})).matchId!;
  await exchange(a,disputed,{action:"propose",proposal:plan});
  await exchange(a,disputed,{action:"accept",expectedProposal:plan});
  await exchange(b,disputed,{action:"accept",expectedProposal:plan});
  await exchange(a,disputed,{action:"complete"});
  await transaction(c=>closeHandoffDisputes(c,dc));
  assert.equal((await loadMatch(pool,disputed,a)).status,"cancelled");
  assert.equal((await loadListing(pool,dc)).status,"archived");
  assert.equal((await loadListing(pool,dd)).status,"archived","Dispute closure must NOT relist either physical garment or fabricate bilateral completion");
  await pool.query("INSERT INTO kemis_messages(id,match_id,sender_id,text) SELECT $1||s::text,$2,$3,'Pagination fixture' FROM generate_series(1,207) s",[prefix+"-message-",mid,a]);
  const page=async(before?:string)=>{
    const values:unknown[]=[mid],cursor=beforeCursor(before,values,"kemis_messages","m");
    return (await pool.query("SELECT * FROM kemis_messages m WHERE match_id=$1"+cursor+" ORDER BY m.created_at DESC,m.id DESC LIMIT 200",values)).rows;
  };
  const newest=await page(),older=await page(newest.at(-1)!.id);
  assert.equal(newest.length,200);assert.equal(older.length,7);
  assert.equal(new Set([...newest,...older].map(m=>m.id)).size,207,"Cursor pages must preserve every message without overlap, including equal timestamps");
  assert.throws(()=>beforeCursor([],[],"kemis_messages","m"),e=>e instanceof MarketError&&e.status===400);
  await pool.query("INSERT INTO kemis_blocks(blocker,blocked) VALUES($1,$2)",[a,b]);
  await rejectsStatus(()=>loadMatch(pool,mid,a),403);
  await rejectsStatus(()=>sendChat(b,mid,"Blocked message"),403);
  logger.info("PASS: durable uploads, exact-garment reciprocity, fresh-consent rematching, preserved history, stale-proposal rejection, duplicate-notification prevention, safety holds, moderator dispute closure, bilateral completion and authorization.");
} finally {
  // Delete ONLY this run's fixtures, preserving all actual members and listings.
  await pool.query("DELETE FROM kemis_messages WHERE sender_id=ANY($1::text[])",[ids]);
  await pool.query("DELETE FROM kemis_notifications WHERE user_id=ANY($1::text[])",[ids]);
  await pool.query("DELETE FROM kemis_blocks WHERE blocker=ANY($1::text[]) OR blocked=ANY($1::text[])",[ids]);
  await pool.query("DELETE FROM kemis_swipes WHERE user_id=ANY($1::text[])",[ids]);
  await pool.query("DELETE FROM kemis_passes WHERE user_id=ANY($1::text[])",[ids]);
  await pool.query("DELETE FROM kemis_matches WHERE user_a=ANY($1::text[]) OR user_b=ANY($1::text[])",[ids]);
  await pool.query("DELETE FROM kemis_listings WHERE id=ANY($1::text[])",[dresses]);
  await pool.query("DELETE FROM kemis_profiles WHERE id=ANY($1::text[])",[ids]);
  if(uploadedPath) await (await storage.getObjectEntityFile(uploadedPath)).delete();
  await pool.end();
}
