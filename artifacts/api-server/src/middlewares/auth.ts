import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";

export function userId(req: Request): string | null {
  const auth=getAuth(req);
  return (auth.sessionClaims?.userId as string | undefined) || auth.userId || null;
}
export async function auth(req: Request,res: Response,next: NextFunction):Promise<void> {
  const uid=userId(req);
  if(!uid) { res.status(401).json({error:"Sign in to continue"}); return; }
  await pool.query("INSERT INTO kemis_profiles(id) VALUES($1) ON CONFLICT DO NOTHING",[uid]);
  next();
}
export async function admin(req: Request,res: Response,next: NextFunction):Promise<void> {
  const r=await pool.query("SELECT role FROM kemis_profiles WHERE id=$1",[userId(req)]);
  if(r.rows[0]?.role!=="admin") { res.status(403).json({error:"Moderator access required"}); return; }
  next();
}
