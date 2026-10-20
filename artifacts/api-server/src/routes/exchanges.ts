import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { GetMatchesResponse,GetMessagesResponse,SendMessageBody,SendMessageResponse,SwipeDressBody,UpdateExchangeBody,UpdateExchangeResponse } from "@workspace/api-zod";
import { auth,userId } from "../middlewares/auth";
import { exchange,loadMatch,matchView,sendChat,swipe } from "../lib/marketplace";

const router:IRouter=Router();
router.post("/swipes",auth,async(req,res)=>{
  res.json(await swipe(userId(req)!,SwipeDressBody.parse(req.body)));
});
router.get("/matches",auth,async(req,res)=>{
  const uid=userId(req)!;
  const r=await pool.query("SELECT m.* FROM kemis_matches m WHERE ($1=user_a OR $1=user_b) AND NOT EXISTS(SELECT 1 FROM kemis_blocks b WHERE (b.blocker=m.user_a AND b.blocked=m.user_b) OR (b.blocker=m.user_b AND b.blocked=m.user_a)) ORDER BY created_at DESC LIMIT 100",[uid]);
  res.json(GetMatchesResponse.parse(await Promise.all(r.rows.map(m=>matchView(pool,m)))));
});
router.get("/matches/:id/messages",auth,async(req,res)=>{
  const id=String(req.params.id);
  await loadMatch(pool,id,userId(req)!);
  const r=await pool.query("SELECT * FROM (SELECT * FROM kemis_messages WHERE match_id=$1 ORDER BY created_at DESC LIMIT 200) m ORDER BY created_at",[id]);
  res.json(GetMessagesResponse.parse(r.rows.map(m=>({id:m.id,senderId:m.sender_id,text:m.text,createdAt:m.created_at.toISOString()}))));
});
router.post("/matches/:id/messages",auth,async(req,res)=>{
  const b=SendMessageBody.parse(req.body);
  if(!b.text.trim()) {res.status(400).json({error:"Message cannot be blank"});return;}
  res.status(201).json(SendMessageResponse.parse(await sendChat(userId(req)!,String(req.params.id),b.text.trim())));
});
router.post("/matches/:id/exchange",auth,async(req,res)=>{
  res.json(UpdateExchangeResponse.parse(await exchange(userId(req)!,String(req.params.id),UpdateExchangeBody.parse(req.body))));
});
export default router;
