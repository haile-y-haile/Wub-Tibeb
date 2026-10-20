import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { BlockUserBody,CreateReportBody,ModerateReportBody,GetModerationResponse,GetNotificationsResponse } from "@workspace/api-zod";
import { auth,admin,userId } from "../middlewares/auth";
import { fail,loadListing,transaction } from "../lib/marketplace";

const router:IRouter=Router();
router.post("/reports",auth,async(req,res)=>{
  const b=CreateReportBody.parse(req.body);
  await loadListing(pool,b.listingId);
  await pool.query("INSERT INTO kemis_reports(id,reporter,listing_id,reason) VALUES($1,$2,$3,$4)",[randomUUID(),userId(req),b.listingId,b.reason]);
  res.status(201).json({ok:true});
});
router.post("/blocks",auth,async(req,res)=>{
  const b=BlockUserBody.parse(req.body),uid=userId(req)!;
  if(b.userId===uid) fail(400,"You cannot block yourself");
  if(!(await pool.query("SELECT 1 FROM kemis_profiles WHERE id=$1",[b.userId])).rowCount) fail(404,"Member not found");
  await transaction(async c=>{
    await c.query("INSERT INTO kemis_blocks VALUES($1,$2) ON CONFLICT DO NOTHING",[uid,b.userId]);
    const matches=await c.query("SELECT * FROM kemis_matches WHERE ((user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1)) AND status IN ('matched','proposed','accepted')",[uid,b.userId]);
    for(const m of matches.rows) {
      if(m.status==="accepted") await c.query("UPDATE kemis_listings SET status='active' WHERE id=ANY($1::text[]) AND status='reserved'",[[m.dress_a,m.dress_b]]);
      await c.query("UPDATE kemis_matches SET status='cancelled' WHERE id=$1",[m.id]);
    }
  });
  res.json({ok:true});
});
router.get("/notifications",auth,async(req,res)=>{
  const r=await pool.query("SELECT * FROM kemis_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",[userId(req)]);
  res.json(GetNotificationsResponse.parse(r.rows.map(n=>({id:n.id,text:n.text,read:n.read,createdAt:n.created_at.toISOString()}))));
});
router.post("/notifications",auth,async(req,res)=>{
  await pool.query("UPDATE kemis_notifications SET read=true WHERE user_id=$1",[userId(req)]);
  res.json({ok:true});
});
router.get("/moderation",auth,admin,async(_req,res)=>{
  const r=await pool.query("SELECT id,listing_id,reason,status FROM kemis_reports ORDER BY created_at DESC LIMIT 200");
  res.json(GetModerationResponse.parse(r.rows.map(r=>({id:r.id,listingId:r.listing_id,reason:r.reason,status:r.status}))));
});
router.post("/moderation",auth,admin,async(req,res)=>{
  const b=ModerateReportBody.parse(req.body);
  await transaction(async c=>{
    const r=await c.query("SELECT * FROM kemis_reports WHERE id=$1",[b.reportId]);
    if(!r.rows[0]) fail(404,"Report not found");
    const lid=r.rows[0].listing_id;
    if(b.action==="hide") {
      const ms=await c.query("SELECT * FROM kemis_matches WHERE (dress_a=$1 OR dress_b=$1) AND status IN ('matched','proposed','accepted')",[lid]);
      for(const m of ms.rows) {
        if(m.status==="accepted") await c.query("UPDATE kemis_listings SET status='active' WHERE id=ANY($1::text[]) AND status='reserved'",[[m.dress_a,m.dress_b]]);
        await c.query("UPDATE kemis_matches SET status='cancelled' WHERE id=$1",[m.id]);
      }
      await c.query("UPDATE kemis_listings SET status='hidden' WHERE id=$1",[lid]);
    }
    await c.query("UPDATE kemis_reports SET status=$2 WHERE id=$1",[b.reportId,b.action==="hide"?"hidden":"dismissed"]);
  });
  res.json({ok:true});
});
export default router;
