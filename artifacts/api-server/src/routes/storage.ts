import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { RequestUploadBody,RequestUploadResponse } from "@workspace/api-zod";
import { auth,userId } from "../middlewares/auth";
import { ObjectStorageService } from "../lib/objectStorage";
import { fail } from "../lib/marketplace";
import { isTutorialAsset, parseTutorialRange } from "../lib/tutorial-media";

const router:IRouter=Router(),storage=new ObjectStorageService();
router.get("/storage/public-objects/tutorials/:filename", async (req, res) => {
  const filename = String(req.params.filename);
  if (!isTutorialAsset(filename)) { res.sendStatus(404); return; }
  const file = await storage.searchPublicObject(`tutorials/${filename}`);
  if (!file) { res.sendStatus(404); return; }
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!Number.isSafeInteger(size) || size < 1 || size > 10 * 1024 * 1024) {
    res.sendStatus(404); return;
  }
  const contentType = filename.endsWith(".mp4") ? "video/mp4"
    : filename.endsWith(".webp") ? "image/webp" : "text/vtt; charset=utf-8";
  res.set({
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  });
  const range = parseTutorialRange(req.get("range"), size);
  if (range === null) {
    res.status(416).set("Content-Range", `bytes */${size}`).end(); return;
  }
  if (range) {
    res.status(206).set({
      "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      "Content-Length": String(range.end - range.start + 1),
    });
  } else {
    res.set("Content-Length", String(size));
  }
  if (req.method === "HEAD") { res.end(); return; }
  const stream = file.createReadStream(range ? { ...range, validation: false } : {});
  res.on("close", () => stream.destroy());
  stream.on("error", () => {
    req.log.error({ filename }, "Tutorial media stream failed");
    if (!res.headersSent) res.status(502).end();
    else res.destroy();
  }).pipe(res);
});
router.post("/storage/uploads/request-url",auth,async(req,res)=>{
  const b=RequestUploadBody.parse(req.body),uid=userId(req)!;
  const count=await pool.query("SELECT count(*)::int n FROM kemis_uploads WHERE owner_id=$1 AND created_at>now()-interval '1 hour'",[uid]);
  if(count.rows[0].n>=30) fail(429,"Photo upload limit reached. Please try later.");
  const uploadURL=await storage.getObjectEntityUploadURL();
  const objectPath="/api/storage"+storage.normalizeObjectEntityPath(uploadURL);
  await pool.query("INSERT INTO kemis_uploads(path,owner_id,content_type,size) VALUES($1,$2,$3,$4)",[objectPath,uid,b.contentType,b.size]);
  res.json(RequestUploadResponse.parse({uploadURL,objectPath}));
});
router.get("/storage/objects/uploads/:id",async(req,res)=>{
  const path="/api/storage/objects/uploads/"+String(req.params.id);
  const uid=userId(req)??"";
  const r=await pool.query("SELECT u.* FROM kemis_uploads u WHERE u.path=$1 AND (u.owner_id=$2 OR EXISTS (SELECT 1 FROM kemis_listings l WHERE l.status='active' AND l.data->'photos' ? u.path AND NOT EXISTS(SELECT 1 FROM kemis_blocks b WHERE (b.blocker=$2 AND b.blocked=l.owner_id) OR (b.blocked=$2 AND b.blocker=l.owner_id))) OR EXISTS(SELECT 1 FROM kemis_listings l JOIN kemis_matches m ON (l.id=m.dress_a OR l.id=m.dress_b) WHERE l.data->'photos' ? u.path AND ($2=m.user_a OR $2=m.user_b) AND NOT EXISTS(SELECT 1 FROM kemis_blocks b WHERE (b.blocker=m.user_a AND b.blocked=m.user_b) OR (b.blocker=m.user_b AND b.blocked=m.user_a))))",[path,uid]);
  if(!r.rows[0]) fail(404,"Photo not found");
  const file=await storage.getObjectEntityFile(path.replace("/api/storage",""));
  const [meta]=await file.getMetadata();
  if(Number(meta.size)>2097152 || !["image/jpeg","image/png","image/webp"].includes(meta.contentType??"")) fail(400,"Invalid photo");
  res.setHeader("Content-Type",meta.contentType!);
  res.setHeader("Cache-Control","private, max-age=300");
  res.setHeader("X-Content-Type-Options","nosniff");
  file.createReadStream().on("error",()=>res.destroy()).pipe(res);
});
export default router;
