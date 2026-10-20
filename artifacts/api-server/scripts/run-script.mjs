import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const scripts={exchange:"src/tests/two-user-exchange.ts",admin:"src/scripts/grant-admin.ts",cleanup:"src/scripts/cleanup-test-run.ts"};
const name=process.argv[2];
if(!scripts[name]) throw new Error("Choose exchange, admin or cleanup");
mkdirSync("generated-artifacts",{recursive:true});
const outfile=`generated-artifacts/${name}.mjs`;
await build({entryPoints:[scripts[name]],outfile,bundle:true,platform:"node",format:"esm",
  external:["pg-native","pino","pino-pretty","@clerk/express","@google-cloud/*"],
  banner:{js:"import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"}});
const result=spawnSync(process.execPath,[outfile,...process.argv.slice(3)],{stdio:"inherit",env:process.env});
process.exit(result.status??1);
