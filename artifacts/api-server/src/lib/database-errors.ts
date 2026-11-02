export const databaseUnavailableResponse = (error: unknown) => {
  if (!error || typeof error !== "object") return null;

  const code = "code" in error ? error.code : undefined;
  if (typeof code !== "string") return null;

  const unavailable =
    code === "28000" ||
    code.startsWith("08") ||
    ["57P01", "57P02", "57P03", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH"].includes(code);

  if (!unavailable) return null;

  return {
    status: 503,
    body: {
      code: "DATA_SERVICE_UNAVAILABLE",
      error: "Swap data is temporarily unavailable. Please try again shortly.",
    },
  } as const;
};
