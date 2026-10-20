import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { BlockUserBody,CreateReportBody,ModerateReportBody,GetModerationResponse,GetNotificationsResponse } from "@workspace/api-zod";
import { auth,admin,userId } from "../middlewares/auth";
import { fail,loadListing,transaction,cancelOpenMatchesSafely,closeHandoffDisputes } from "../lib/marketplace";
import { beforeCursor } from "../lib/pagination";

const router:IRouter=Router();
router.post("/reports",auth,async(req,res)=>{
  const b=CreateReportBody.parse(req.body);
  await loadListing(pool,b.listingId);
  await transaction(async c=>{
    const count=await c.query("SELECT count(*)::int n FROM kemis_reports WHERE reporter=$1 AND created_at>now()-interval '1 day'",[userId(req)]);
    if(count.rows[0].n>=10) fail(429,"Report limit reached. Please try later.");
    await c.query("INSERT INTO kemis_reports(id,reporter,listing_id,reason) VALUES($1,$2,$3,$4)",[randomUUID(),userId(req),b.listingId,b.reason]);
  });
  res.status(201).json({ok:true});
});
router.post("/blocks",auth,async(req,res)=>{
  const b=BlockUserBody.parse(req.body),uid=userId(req)!;
  if(b.userId===uid) fail(400,"You cannot block yourself");
  if(!(await pool.query("SELECT 1 FROM kemis_profiles WHERE id=$1",[b.userId])).rowCount) fail(404,"Member not found");
  await transaction(async c=>{
    await c.query("INSERT INTO kemis_blocks VALUES($1,$2) ON CONFLICT DO NOTHING",[uid,b.userId]);
    const matches=await c.query("SELECT * FROM kemis_matches WHERE ((user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1)) AND status IN ('matched','proposed','accepted')",[uid,b.userId]);
    await cancelOpenMatchesSafely(c,matches.rows);
    for(const m of matches.rows.filter(m=>m.status==="accepted" && m.completed_by.length>0)) {
      const lid=uid===m.user_a?m.dress_b:m.dress_a;
      await c.query("INSERT INTO kemis_reports(id,reporter,listing_id,reason) SELECT $1,$2,$3,$4 WHERE NOT EXISTS(SELECT 1 FROM kemis_reports WHERE reporter=$2 AND listing_id=$3 AND status='open')",[randomUUID(),uid,lid,"A member blocked their exchange partner after a confirmed handoff. Moderator review is required."]);
    }
  });
  res.json({ok:true});
});
router.get("/notifications",auth,async(req,res)=>{
  const values:unknown[]=[userId(req)],cursor=beforeCursor(req.query.before,values,"kemis_notifications","n");
  const r=await pool.query("SELECT n.* FROM kemis_notifications n WHERE user_id=$1"+(req.query.unread==="true"?" AND read=false":"")+cursor+" ORDER BY n.created_at DESC,n.id DESC LIMIT 100",values);
  res.json(GetNotificationsResponse.parse(r.rows.map(n=>({id:n.id,text:n.text,read:n.read,createdAt:n.created_at.toISOString()}))));
});
router.post("/notifications",auth,async(req,res)=>{
  await pool.query("UPDATE kemis_notifications SET read=true WHERE user_id=$1",[userId(req)]);
  res.json({ok:true});
});
router.get("/moderation",auth,admin,async(req,res)=>{
  const values:unknown[]=[],cursor=beforeCursor(req.query.before,values,"kemis_reports","r");
  const r=await pool.query("SELECT r.*,EXISTS(SELECT 1 FROM kemis_matches m WHERE (m.dress_a=r.listing_id OR m.dress_b=r.listing_id) AND m.status='accepted' AND cardinality(m.completed_by)>0) handoff_hold FROM kemis_reports r WHERE true"+cursor+" ORDER BY r.created_at DESC,r.id DESC LIMIT 200",values);
  res.json(GetModerationResponse.parse(r.rows.map(r=>({id:r.id,listingId:r.listing_id,reason:r.reason,status:r.status,handoffHold:r.handoff_hold}))));
});
router.post("/moderation",auth,admin,async(req,res)=>{
  const b=ModerateReportBody.parse(req.body);
  await transaction(async c=>{
    const r=await c.query("SELECT * FROM kemis_reports WHERE id=$1",[b.reportId]);
    if(!r.rows[0]) fail(404,"Report not found");
    const lid=r.rows[0].listing_id;
    if(b.action==="hide") {
      const ms=await c.query("SELECT * FROM kemis_matches WHERE (dress_a=$1 OR dress_b=$1) AND status IN ('matched','proposed','accepted')",[lid]);
      await cancelOpenMatchesSafely(c,ms.rows);
      await c.query("UPDATE kemis_listings SET status='hidden' WHERE id=$1",[lid]);
    }
    if(b.action==="close_dispute") await closeHandoffDisputes(c,lid);
    await c.query("UPDATE kemis_reports SET status=$2 WHERE id=$1",[b.reportId,b.action==="hide"?"hidden":b.action==="close_dispute"?"resolved":"dismissed"]);
  });
  res.json({ok:true});
});
export default router;
