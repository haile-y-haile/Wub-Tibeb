import { fail } from "./marketplace";

/** Stable keyset cursors: removing passed dresses must not skip the next page. */
export function beforeCursor(before:unknown,values:unknown[],table:"kemis_listings"|"kemis_matches"|"kemis_messages"|"kemis_notifications"|"kemis_reports",alias:"l"|"m"|"n"|"r") {
  if(before===undefined) return "";
  if(typeof before!=="string"||before.length>160||!before.length) fail(400,"Invalid input");
  values.push(before);
  // table/alias are fixed server constants, never request values.
  return ` AND (${alias}.created_at,${alias}.id)<(SELECT created_at,id FROM ${table} WHERE id=$${values.length})`;
}
