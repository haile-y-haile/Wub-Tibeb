import { Router, type IRouter } from "express";
import { beforeCursor } from "../lib/pagination";
import { pool } from "@workspace/db";
import { GetListingsResponse,GetListingResponse,CreateListingBody,UpdateListingBody,SaveProfileBody,GetProfileResponse } from "@workspace/api-zod";
import { auth,userId } from "../middlewares/auth";
import { blocked,createListingOnce,fail,listing,loadListing,transaction } from "../lib/marketplace";
import { ObjectStorageService } from "../lib/objectStorage";

const router:IRouter=Router();
const storage=new ObjectStorageService();
const idOf=(req:any)=>String(req.params.id);
router.get("/profile",auth,async(req,res)=>{
  const r=await pool.query("SELECT * FROM kemis_profiles WHERE id=$1",[userId(req)]);
  const p=r.rows[0];
  if(p.name==="Member") {res.status(404).json({error:"Complete your profile to get started"});return;}
  res.json(GetProfileResponse.parse({id:p.id,name:p.name,neighborhood:p.neighborhood,language:p.language,role:p.role,...(p.measurements?{measurements:p.measurements}:{})}));
});
router.put("/profile",auth,async(req,res)=>{
  const b=SaveProfileBody.parse(req.body);
  if(!b.name.trim()||!b.neighborhood.trim()) fail(400,"Name and general neighborhood are required");
  await pool.query("UPDATE kemis_profiles SET name=$2,neighborhood=$3,language=$4,measurements=$5 WHERE id=$1",[userId(req),b.name.trim(),b.neighborhood.trim(),b.language,b.measurements?JSON.stringify(b.measurements):null]);
  const r=await pool.query("SELECT * FROM kemis_profiles WHERE id=$1",[userId(req)]);
  res.json(GetProfileResponse.parse({...b,id:userId(req),role:r.rows[0].role}));
});
router.get("/listings",async(req,res)=>{
  const uid=userId(req),mine=req.query.mine==="true";
  if(mine&&!uid) fail(401,"Sign in to see your wardrobe");
  let values:unknown[]=[uid??""];
  let where=mine?"l.owner_id=$1 AND l.status NOT IN ('archived')":"l.status='active' AND l.owner_id<>$1 AND NOT EXISTS(SELECT 1 FROM kemis_passes pp WHERE pp.user_id=$1 AND pp.target_id=l.id)";
  where+=" AND NOT EXISTS(SELECT 1 FROM kemis_blocks b WHERE (b.blocker=$1 AND b.blocked=l.owner_id) OR (b.blocked=$1 AND b.blocker=l.owner_id))";
  for(const key of ["occasion","color","condition","fabric"]) {
    if(typeof req.query[key]==="string"&&req.query[key]) {values.push(req.query[key]);where+=` AND lower(l.data->>'${key}')=lower($${values.length})`;}
  }
  if(typeof req.query.neighborhood==="string"&&req.query.neighborhood) {values.push(req.query.neighborhood);where+=` AND lower(p.neighborhood)=lower($${values.length})`;}
  if(typeof req.query.q==="string"&&req.query.q) {values.push(`%${String(req.query.q).slice(0,100)}%`);where+=` AND (l.data->>'title' ILIKE $${values.length} OR l.data->>'description' ILIKE $${values.length})`;}
  const p=uid?(await pool.query("SELECT measurements FROM kemis_profiles WHERE id=$1",[uid])).rows[0]?.measurements:null;
  if(req.query.compatible==="true") {
    if(!p) fail(400,"Save your preferred garment measurements in your profile first");
    for(const k of ["bust","waist","hips","shoulder","length","sleeves"]) {
      values.push(p[k]);where+=` AND abs((l.data->'measurements'->>'${k}')::numeric-$${values.length}::numeric)<=${k==="length"?10:5}`;
    }
  }
  where+=beforeCursor(req.query.before,values,"kemis_listings","l");
  const r=await pool.query(`SELECT l.*,p.name owner_name,p.neighborhood FROM kemis_listings l JOIN kemis_profiles p ON p.id=l.owner_id WHERE ${where} ORDER BY l.created_at DESC,l.id DESC LIMIT 100`,values);
  let items=r.rows.map(row=>{
    const item=listing(row);
    if(p) item.compatible=Object.keys(p).every(k=>Math.abs(item.measurements[k]-p[k])<=(k==="length"?10:5));
    return item;
  });
  if(req.query.compatible==="true") {
    if(!p) fail(400,"Save your preferred garment measurements in your profile first");
    items=items.filter(x=>x.compatible);
  }
  res.json(GetListingsResponse.parse(items));
});
router.get("/listings/:id",async(req,res)=>{
  const l=await loadListing(pool,idOf(req)),uid=userId(req);
  const participant=uid?(await pool.query("SELECT 1 FROM kemis_matches WHERE (dress_a=$1 OR dress_b=$1) AND ($2=user_a OR $2=user_b) AND status IN ('accepted','completed')",[l.id,uid])).rowCount:0;
  if((l.status!=="active"&&l.ownerId!==uid&&!participant) || (uid&&await blocked(pool,uid,l.ownerId))) fail(404,"Dress not found");
  res.json(GetListingResponse.parse(l));
});
async function validatePhotos(uid:string,photos:string[]) {
  for(const path of photos) {
    if(!/^\/api\/storage\/objects\/uploads\/[a-f0-9-]{36}$/.test(path)) fail(400,"Upload dress photos using the photo picker");
    const r=await pool.query("SELECT * FROM kemis_uploads WHERE path=$1 AND owner_id=$2",[path,uid]);
    if(!r.rows[0]) fail(403,"You may only use your own uploaded photos");
    const file=await storage.getObjectEntityFile(path.replace("/api/storage",""));
    const [meta]=await file.getMetadata();
    if(Number(meta.size)>2097152 || !["image/jpeg","image/png","image/webp"].includes(meta.contentType??"")) fail(400,"Photo must be JPEG, PNG or WebP, at most 2 MB");
    // Verify magic bytes, not just the client-supplied Content-Type.
    const [header]=await file.download({start:0,end:15});
    const valid=header[0]===0xff&&header[1]===0xd8 || header.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || header.subarray(0,4).toString()==="RIFF"&&header.subarray(8,12).toString()==="WEBP";
    if(!valid) fail(400,"Invalid photo file");
  }
}
router.post("/listings",auth,async(req,res)=>{
  const b=CreateListingBody.parse(req.body),uid=userId(req)!;
  await validatePhotos(uid,b.photos);
  const profile=(await pool.query("SELECT name FROM kemis_profiles WHERE id=$1",[uid])).rows[0];
  if(profile.name==="Member") fail(400,"Please complete your profile before listing a Habesha kemis");
  const {clientRequestId,...data}=b;
  const result=await createListingOnce(uid,data,clientRequestId);
  res.status(result.created?201:200).json(GetListingResponse.parse(result.listing));
});
router.put("/listings/:id",auth,async(req,res)=>{
  const {clientRequestId:_requestId,...b}=UpdateListingBody.parse(req.body),uid=userId(req)!;
  await validatePhotos(uid,b.photos);
  await transaction(async c=>{
    const l=await loadListing(c,idOf(req));
    if(l.ownerId!==uid) fail(403,"This dress belongs to another member");
    if(l.status!=="active") fail(409,"Only an active dress can be edited");
    const r=await c.query("SELECT 1 FROM kemis_matches WHERE (dress_a=$1 OR dress_b=$1) AND status IN ('matched','proposed','accepted')",[l.id]);
    if(r.rowCount) fail(409,"Cancel open exchanges before changing this dress");
    await c.query("UPDATE kemis_listings SET data=$2 WHERE id=$1",[l.id,JSON.stringify(b)]);
    await c.query("DELETE FROM kemis_swipes WHERE offered_id=$1 OR target_id=$1",[l.id]);
  });
  res.json(GetListingResponse.parse(await loadListing(pool,idOf(req))));
});
router.delete("/listings/:id",auth,async(req,res)=>{
  await transaction(async c=>{
    const l=await loadListing(c,idOf(req));
    if(l.ownerId!==userId(req)) fail(403,"This dress belongs to another member");
    if(l.status==="reserved"||l.status==="swapped") fail(409,"An agreed or completed swap cannot be deleted");
    await c.query("UPDATE kemis_listings SET status='archived' WHERE id=$1",[l.id]);
    await c.query("UPDATE kemis_matches SET status='cancelled' WHERE (dress_a=$1 OR dress_b=$1) AND status IN ('matched','proposed')",[l.id]);
  });
  res.json({ok:true});
});
router.get("/community",async(_req,res)=>{
  const r=await pool.query("SELECT (SELECT count(*)::int FROM kemis_listings WHERE status='active' AND NOT demo) dresses,(SELECT count(*)::int FROM kemis_matches WHERE status='completed') swaps,(SELECT count(DISTINCT p.neighborhood)::int FROM kemis_profiles p JOIN kemis_listings l ON l.owner_id=p.id WHERE l.status='active' AND NOT l.demo) neighborhoods");
  res.json(r.rows[0]);
});
export default router;
