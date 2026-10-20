import { pgTable,text,jsonb,boolean,timestamp,integer,index,uniqueIndex,primaryKey,check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const profiles=pgTable("kemis_profiles",{
  id:text("id").primaryKey(),name:text("name").notNull().default("Member"),
  neighborhood:text("neighborhood").notNull().default("Addis Ababa"),
  language:text("language").notNull().default("en"),measurements:jsonb("measurements"),
  role:text("role").notNull().default("member"),demo:boolean("demo").notNull().default(false),
},t=>[check("kemis_profiles_language_check",sql`${t.language} IN ('en','am')`),check("kemis_profiles_role_check",sql`${t.role} IN ('member','admin')`)]);
export const listings=pgTable("kemis_listings",{
  id:text("id").primaryKey(),ownerId:text("owner_id").notNull().references(()=>profiles.id),
  data:jsonb("data").notNull(),status:text("status").notNull().default("active"),
  demo:boolean("demo").notNull().default(false),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("kemis_listings_owner").on(t.ownerId),index("kemis_listings_status").on(t.status),
  check("kemis_listings_status_check",sql`${t.status} IN ('active','reserved','swapped','archived','hidden')`)]);
export const swipes=pgTable("kemis_swipes",{
  userId:text("user_id").notNull().references(()=>profiles.id),offeredId:text("offered_id").notNull().references(()=>listings.id),
  targetId:text("target_id").notNull().references(()=>listings.id),direction:text("direction").notNull(),
},t=>[primaryKey({columns:[t.userId,t.offeredId,t.targetId]}),check("kemis_swipes_direction_check",sql`${t.direction} IN ('like','pass')`)]);
export const passes=pgTable("kemis_passes",{
  userId:text("user_id").notNull().references(()=>profiles.id),targetId:text("target_id").notNull().references(()=>listings.id),
},t=>[primaryKey({columns:[t.userId,t.targetId]})]);
export const matches=pgTable("kemis_matches",{
  id:text("id").primaryKey(),dressA:text("dress_a").notNull().references(()=>listings.id),dressB:text("dress_b").notNull().references(()=>listings.id),
  userA:text("user_a").notNull().references(()=>profiles.id),userB:text("user_b").notNull().references(()=>profiles.id),
  status:text("status").notNull().default("matched"),proposal:text("proposal").notNull().default(""),
  acceptedBy:text("accepted_by").array().notNull().default(sql`'{}'::text[]`),
  completedBy:text("completed_by").array().notNull().default(sql`'{}'::text[]`),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("kemis_matches_current_pair").on(t.dressA,t.dressB).where(sql`${t.status} <> 'cancelled'`),
  check("kemis_matches_check",sql`${t.dressA} < ${t.dressB}`),check("kemis_matches_check1",sql`${t.userA} <> ${t.userB}`),
  check("kemis_matches_status_check",sql`${t.status} IN ('matched','proposed','accepted','completed','cancelled')`)]);
export const messages=pgTable("kemis_messages",{
  id:text("id").primaryKey(),matchId:text("match_id").notNull().references(()=>matches.id),
  senderId:text("sender_id").notNull().references(()=>profiles.id),text:text("text").notNull(),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("kemis_messages_match").on(t.matchId,t.createdAt)]);
export const blocks=pgTable("kemis_blocks",{
  blocker:text("blocker").notNull().references(()=>profiles.id),blocked:text("blocked").notNull().references(()=>profiles.id),
},t=>[primaryKey({columns:[t.blocker,t.blocked]}),check("kemis_blocks_check",sql`${t.blocker} <> ${t.blocked}`)]);
export const notifications=pgTable("kemis_notifications",{
  id:text("id").primaryKey(),userId:text("user_id").notNull().references(()=>profiles.id),
  text:text("text").notNull(),read:boolean("read").notNull().default(false),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("kemis_notifications_user").on(t.userId,t.createdAt)]);
export const reports=pgTable("kemis_reports",{
  id:text("id").primaryKey(),reporter:text("reporter").notNull().references(()=>profiles.id),
  listingId:text("listing_id").notNull().references(()=>listings.id),reason:text("reason").notNull(),
  status:text("status").notNull().default("open"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const uploads=pgTable("kemis_uploads",{
  path:text("path").primaryKey(),ownerId:text("owner_id").notNull().references(()=>profiles.id),
  contentType:text("content_type").notNull(),size:integer("size").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
