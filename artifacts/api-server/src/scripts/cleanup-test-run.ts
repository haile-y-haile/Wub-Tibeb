import { clerkClient } from "@clerk/express";
import { pool } from "@workspace/db";
import { transaction } from "../lib/marketplace";
import { ObjectStorageService,ObjectNotFoundError } from "../lib/objectStorage";
import { logger } from "../lib/logger";

// Operator-only teardown for the two explicitly identified browser-test accounts.
// Defaults to a dry run. Never accepts a real member's email or arbitrary prefix.
const args=process.argv.slice(2).filter(v=>v!=="--"&&v!=="--apply");
const [nonce,...ids]=args,apply=process.argv.includes("--apply");
if(!/^[a-z0-9_-]{6,32}$/i.test(nonce??"")||ids.length!==2||new Set(ids).size!==2||ids.some(id=>!/^user_[a-z0-9]+$/i.test(id)))
  throw new Error("Usage: test:cleanup <test nonce> <test Clerk ID A> <test Clerk ID B> [--apply]");

try {
  const profiles=await pool.query("SELECT id,name,role FROM kemis_profiles WHERE id=ANY($1::text[])",[ids]);
  if(profiles.rows.some(p=>!p.name.startsWith(`WT E2E ${nonce}`)||p.role==="admin"))
    throw new Error("Refusing to remove a non-fixture profile or moderator");
  const users=await Promise.all(ids.map(async id=>{
    try{return await clerkClient.users.getUser(id);}
    catch(e){if((e as {status?:number}).status===404)return null;throw e;}
  }));
  const emailPrefix=`wt-e2e-${nonce}-`.toLowerCase();
  if(users.some(u=>u&&(!u.emailAddresses.length||u.emailAddresses.some(e=>!e.emailAddress.toLowerCase().startsWith(emailPrefix)||!e.emailAddress.toLowerCase().endsWith("@example.com")))))
    throw new Error("Refusing to remove an account without the exact synthetic email marker");
  const uploads=(await pool.query("SELECT path FROM kemis_uploads WHERE owner_id=ANY($1::text[])",[ids])).rows.map(r=>String(r.path));
  if(uploads.some(path=>!/^\/api\/storage\/objects\/uploads\/[a-f0-9-]{36}$/.test(path)))
    throw new Error("Unexpected storage path; manual review required");
  await transaction(async c=>{
    const external=await c.query("SELECT 1 FROM kemis_matches WHERE (user_a=ANY($1::text[]) OR user_b=ANY($1::text[])) AND NOT(user_a=ANY($1::text[]) AND user_b=ANY($1::text[])) LIMIT 1",[ids]);
    if(external.rowCount)throw new Error("Fixture interacted with another member; manual review required");
    const shared=await c.query("SELECT 1 FROM kemis_listings WHERE NOT(owner_id=ANY($1::text[])) AND (data->'photos') ?| $2::text[] LIMIT 1",[ids,uploads]);
    if(shared.rowCount)throw new Error("Fixture photo is referenced outside this run; refusing deletion");
    if(!apply)return;
    await c.query("DELETE FROM kemis_messages WHERE match_id IN(SELECT id FROM kemis_matches WHERE user_a=ANY($1::text[]) OR user_b=ANY($1::text[]))",[ids]);
    await c.query("DELETE FROM kemis_notifications WHERE user_id=ANY($1::text[])",[ids]);
    await c.query("DELETE FROM kemis_reports WHERE reporter=ANY($1::text[]) OR listing_id IN(SELECT id FROM kemis_listings WHERE owner_id=ANY($1::text[]))",[ids]);
    await c.query("DELETE FROM kemis_blocks WHERE blocker=ANY($1::text[]) OR blocked=ANY($1::text[])",[ids]);
    await c.query("DELETE FROM kemis_passes WHERE user_id=ANY($1::text[]) OR target_id IN(SELECT id FROM kemis_listings WHERE owner_id=ANY($1::text[]))",[ids]);
    await c.query("DELETE FROM kemis_swipes WHERE user_id=ANY($1::text[]) OR offered_id IN(SELECT id FROM kemis_listings WHERE owner_id=ANY($1::text[])) OR target_id IN(SELECT id FROM kemis_listings WHERE owner_id=ANY($1::text[]))",[ids]);
    await c.query("DELETE FROM kemis_matches WHERE user_a=ANY($1::text[]) OR user_b=ANY($1::text[])",[ids]);
    await c.query("DELETE FROM kemis_listings WHERE owner_id=ANY($1::text[])",[ids]);
    await c.query("DELETE FROM kemis_uploads WHERE owner_id=ANY($1::text[])",[ids]);
    await c.query("DELETE FROM kemis_profiles WHERE id=ANY($1::text[])",[ids]);
  });
  if(apply) {
    const storage=new ObjectStorageService();
    for(const path of uploads) {
      try{await (await storage.getObjectEntityFile(path.replace("/api/storage",""))).delete({ignoreNotFound:true});}
      catch(e){if(!(e instanceof ObjectNotFoundError))throw e;}
    }
    for(const user of users)if(user)await clerkClient.users.deleteUser(user.id);
  }
  logger.info({mode:apply?"removed":"dry-run",profiles:profiles.rowCount,accounts:users.filter(Boolean).length,photos:uploads.length},"Synthetic two-user run cleanup; no unrelated members selected.");
} finally {await pool.end();}
