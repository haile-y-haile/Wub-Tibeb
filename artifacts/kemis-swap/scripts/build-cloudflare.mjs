import { spawnSync } from "node:child_process";
import { loadEnv } from "vite";

const fileEnv = loadEnv("cloudflare", process.cwd(), "VITE_");
const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY ?? fileEnv.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey || publishableKey.includes("replace_me")) {
  throw new Error("Configure a real Clerk staging publishable key in .env.cloudflare.local before building.");
}

const result = spawnSync("pnpm", ["exec", "vite", "build", "--mode", "cloudflare", "--config", "vite.config.ts"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    ...fileEnv,
    VITE_CLERK_PUBLISHABLE_KEY: publishableKey,
    VITE_CLERK_PROXY_URL: process.env.VITE_CLERK_PROXY_URL ?? fileEnv.VITE_CLERK_PROXY_URL ?? "/api/__clerk",
    PORT: "25077",
    BASE_PATH: "/",
    NODE_ENV: "production",
  },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
