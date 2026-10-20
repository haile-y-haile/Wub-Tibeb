import { clerkClient } from "@clerk/express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

// Explicit operator action only. Never promotes the first registered visitor.
const email=process.argv.slice(2).find(v=>v!=="--");
if(!email || !email.includes("@")) throw new Error("Usage: pnpm --filter @workspace/api-server admin:grant -- <verified owner email>");
try {
  const users=await clerkClient.users.getUserList({emailAddress:[email],limit:2});
  if(users.data.length!==1) throw new Error("Exactly one existing Clerk account must match");
  const user=users.data[0];
  if(!user.emailAddresses.some(e=>e.emailAddress.toLowerCase()===email.toLowerCase()&&e.verification?.status==="verified")) throw new Error("Account email must be verified");
  const result=await pool.query("UPDATE kemis_profiles SET role='admin' WHERE id=$1 RETURNING id",[user.id]);
  if(!result.rowCount) throw new Error("Sign into the app and complete a profile first");
  logger.info("Moderator access granted to the verified account in the current environment.");
} finally { await pool.end(); }
