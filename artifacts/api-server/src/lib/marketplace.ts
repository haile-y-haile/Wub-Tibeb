import { randomUUID } from "node:crypto";
import { pool, type PoolClient } from "@workspace/db";

export class MarketError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type Client = PoolClient;
export const fail = (status: number, message: string): never => { throw new MarketError(status, message); };
export async function transaction<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    // Serialize garment state transitions; avoids crossed likes and overlapping reservations.
    await c.query("SELECT pg_advisory_xact_lock(72498301)");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) { await c.query("ROLLBACK"); throw e; } finally { c.release(); }
}
export async function blocked(c: Pick<Client,"query">, a: string, b: string) {
  const r = await c.query("SELECT 1 FROM kemis_blocks WHERE (blocker=$1 AND blocked=$2) OR (blocker=$2 AND blocked=$1)", [a,b]);
  return r.rowCount !== 0;
}
export async function notify(c: Pick<Client,"query">, uid: string, text: string) {
  await c.query("INSERT INTO kemis_notifications(id,user_id,text) VALUES($1,$2,$3)", [randomUUID(),uid,text]);
}
export function listing(row: any) {
  return {...row.data,id:row.id,ownerId:row.owner_id,ownerName:row.owner_name ?? "Member",
    neighborhood:row.neighborhood ?? "Addis Ababa",status:row.status,demo:row.demo,
    createdAt:new Date(row.created_at).toISOString()};
}
export async function loadListing(c: Pick<Client,"query">, id: string) {
  const r = await c.query("SELECT l.*,p.name owner_name,p.neighborhood FROM kemis_listings l JOIN kemis_profiles p ON p.id=l.owner_id WHERE l.id=$1",[id]);
  if (!r.rows[0]) fail(404,"Dress not found");
  return listing(r.rows[0]);
}
export async function loadMatch(c: Pick<Client,"query">, id: string, uid: string) {
  const r = await c.query("SELECT * FROM kemis_matches WHERE id=$1 AND ($2=user_a OR $2=user_b)",[id,uid]);
  const m = r.rows[0];
  if (!m) fail(404,"Match not found");
  if (await blocked(c,m.user_a,m.user_b)) fail(403,"This conversation is unavailable");
  return m;
}
export async function matchView(c: Pick<Client,"query">, m: any) {
  return {id:m.id,dressA:await loadListing(c,m.dress_a),dressB:await loadListing(c,m.dress_b),
    userA:m.user_a,userB:m.user_b,status:m.status,proposal:m.proposal,acceptedBy:m.accepted_by,
    completedBy:m.completed_by,createdAt:new Date(m.created_at).toISOString()};
}
export async function swipe(uid: string, input: {targetId:string;offeredId?:string;direction:"like"|"pass"}) {
  return transaction(async c => {
    const target = await loadListing(c,input.targetId);
    if (target.ownerId===uid) fail(400,"You cannot like your own dress");
    if (target.status!=="active" || await blocked(c,uid,target.ownerId)) fail(409,"Dress is unavailable");
    if (input.direction==="pass") {
      await c.query("INSERT INTO kemis_passes VALUES($1,$2) ON CONFLICT DO NOTHING",[uid,target.id]);
      return {matched:false};
    }
    if (!input.offeredId) fail(400,"Choose one of your active dresses to offer");
    const offered = await loadListing(c,input.offeredId!);
    if (offered.ownerId!==uid) fail(403,"You can only offer your own dress");
    if (offered.status!=="active") fail(409,"Your dress is unavailable");
    if (offered.demo || target.demo) fail(400,"Demonstration dresses cannot be exchanged");
    await c.query("INSERT INTO kemis_swipes(user_id,offered_id,target_id,direction) VALUES($1,$2,$3,'like') ON CONFLICT(user_id,offered_id,target_id) DO UPDATE SET direction='like'",[uid,offered.id,target.id]);
    const reciprocal = await c.query("SELECT 1 FROM kemis_swipes WHERE user_id=$1 AND offered_id=$2 AND target_id=$3 AND direction='like'",[target.ownerId,target.id,offered.id]);
    if (!reciprocal.rowCount) return {matched:false};
    const [a,b] = [offered,target].sort((x,y)=>x.id.localeCompare(y.id));
    const r = await c.query("INSERT INTO kemis_matches(id,dress_a,dress_b,user_a,user_b) VALUES($1,$2,$3,$4,$5) ON CONFLICT(dress_a,dress_b) DO UPDATE SET id=kemis_matches.id RETURNING id",[randomUUID(),a.id,b.id,a.ownerId,b.ownerId]);
    await notify(c,uid,"It's a match! You both chose the same two kemis.");
    await notify(c,target.ownerId,"It's a match! You both chose the same two kemis.");
    return {matched:true,matchId:r.rows[0].id};
  });
}
export async function exchange(uid: string,id: string,input:{action:string;proposal?:string}) {
  return transaction(async c => {
    const m = await loadMatch(c,id,uid);
    if (["completed","cancelled"].includes(m.status)) fail(409,"This exchange is closed");
    const dresses = await c.query("SELECT id,status FROM kemis_listings WHERE id=ANY($1::text[]) FOR UPDATE",[[m.dress_a,m.dress_b]]);
    if (dresses.rows.some(d=>["hidden","archived","swapped"].includes(d.status))) fail(409,"A dress is no longer available");
    if (input.action==="propose") {
      if (m.status==="accepted") fail(409,"Cancel the accepted exchange before changing plans");
      if (!input.proposal?.trim()) fail(400,"Add a meeting place and time");
      m.proposal=input.proposal!.trim(); m.accepted_by=[]; m.completed_by=[]; m.status="proposed";
    } else if(input.action==="accept") {
      if (!["proposed","accepted"].includes(m.status)) fail(409,"Propose an exchange first");
      if (!m.accepted_by.includes(uid)) m.accepted_by.push(uid);
      if(m.accepted_by.length===2) {
        const conflict = await c.query("SELECT 1 FROM kemis_matches WHERE id<>$1 AND status='accepted' AND (dress_a=ANY($2::text[]) OR dress_b=ANY($2::text[]))",[id,[m.dress_a,m.dress_b]]);
        if(conflict.rowCount) fail(409,"A dress has already been reserved for another swap");
        m.status="accepted";
        await c.query("UPDATE kemis_listings SET status='reserved' WHERE id=ANY($1::text[])",[[m.dress_a,m.dress_b]]);
      }
    } else if(input.action==="complete") {
      if(m.status!=="accepted" || m.accepted_by.length!==2) fail(409,"Both people must accept before confirming completion");
      if(!m.completed_by.includes(uid)) m.completed_by.push(uid);
      if(m.completed_by.length===2) {
        m.status="completed";
        await c.query("UPDATE kemis_listings SET status='swapped' WHERE id=ANY($1::text[])",[[m.dress_a,m.dress_b]]);
        await c.query("UPDATE kemis_matches SET status='cancelled' WHERE id<>$1 AND status IN ('matched','proposed') AND (dress_a=ANY($2::text[]) OR dress_b=ANY($2::text[]))",[id,[m.dress_a,m.dress_b]]);
      }
    } else if(input.action==="cancel") {
      if(m.completed_by.length) fail(409,"A participant has confirmed handoff. Report a problem instead of cancelling.");
      if(m.status==="accepted") await c.query("UPDATE kemis_listings SET status='active' WHERE id=ANY($1::text[]) AND status='reserved'",[[m.dress_a,m.dress_b]]);
      m.status="cancelled";
    } else fail(400,"Invalid action");
    await c.query("UPDATE kemis_matches SET status=$2,proposal=$3,accepted_by=$4,completed_by=$5 WHERE id=$1",[id,m.status,m.proposal,m.accepted_by,m.completed_by]);
    await notify(c,uid===m.user_a?m.user_b:m.user_a,`Your exchange was updated: ${input.action}.`);
    return matchView(c,m);
  });
}
export async function sendChat(uid:string,id:string,text:string) {
  return transaction(async c=>{
    const m=await loadMatch(c,id,uid);
    if(m.status==="cancelled") fail(409,"Exchange is cancelled");
    const r=await c.query("INSERT INTO kemis_messages(id,match_id,sender_id,text) VALUES($1,$2,$3,$4) RETURNING *",[randomUUID(),id,uid,text]);
    await notify(c,uid===m.user_a?m.user_b:m.user_a,"You have a new message about your kemis exchange.");
    return {id:r.rows[0].id,senderId:uid,text,createdAt:r.rows[0].created_at.toISOString()};
  });
}
