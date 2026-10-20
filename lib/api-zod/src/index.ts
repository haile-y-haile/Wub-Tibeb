export * from "./generated/api";
export * from "./generated/types";
// Orval uses this name for both path-param validation and query DTOs.
// Preserve the validator export and expose the query DTO under an unambiguous name.
export { GetMessagesParams } from "./generated/api";
export type { GetMessagesParams as GetMessagesQueryParams } from "./generated/types";
