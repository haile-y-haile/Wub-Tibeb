// Renders the six how-to clips from the isolated harness.
// Usage: start `PORT=25099 BASE_PATH=/ pnpm exec vite --config vite.config.ts`, then
//   HARNESS_URL=http://localhost:25099 node tutorial-harness/render.mjs
// Output: <repo>/generated-artifacts/how-to/{lesson}-{lang}.{mp4,webp,vtt} + manifest.json
import { chromium } from "/mnt/pid2/node_modules/playwright-core/index.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, statSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const out = path.join(root, "generated-artifacts/how-to");
const base = process.env.HARNESS_URL ?? "http://localhost:25099";
mkdirSync(out, { recursive: true });

// Load LESSONS from the TS source via the dev server's transform.
const { LESSONS } = await import(`data:text/javascript,${encodeURIComponent(await (await fetch(`${base}/src/lib/tutorials.ts`)).text())}`);

const SAMPLE = {
  en: { title: "Ivory kemis with emerald tibeb", desc: "Worn twice for Meskel. Soft shemma cotton, no stains.", color: "Ivory", embroidery: "Green and gold woven tibeb" },
  am: { title: "አረንጓዴ ጥበብ ያለው ክሬም ቀሚስ", desc: "ለመስቀል ሁለት ጊዜ ተለብሷል። ለስላሳ የሸማ ጥጥ፣ እድፍ የለውም።", color: "ክሬም", embroidery: "አረንጓዴና ወርቃማ ጥበብ" },
};
const MEAS = { bust: "92", waist: "76", hips: "100", shoulder: "38", length: "140", sleeves: "58" };

const ts = (s) => { const h = String(Math.floor(s / 3600)).padStart(2, "0"), m = String(Math.floor(s / 60) % 60).padStart(2, "0"); return `${h}:${m}:${(s % 60).toFixed(3).padStart(6, "0")}`; };

const browser = await chromium.launch({ executablePath: "/repl/tools/bin/chromium", args: ["--no-sandbox"] });
const manifest = {};
for (const lesson of LESSONS) for (const lang of ["am", "en"]) {
  const stem = `${lesson.id}-${lang}`;
  const tmp = path.join(out, "frames", stem); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
  await page.goto(`${base}/tutorial-harness/index.html?lesson=${lesson.id}&lang=${lang}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const frames = []; let k = 0;
  const shot = async (hold) => { const f = path.join(tmp, `${String(k++).padStart(4, "0")}.png`); await page.screenshot({ path: f }); frames.push([f, hold]); };
  const tap = (sel) => page.evaluate((sel) => {
    document.getElementById("tap-ring")?.remove();
    const el = document.querySelector(sel); if (!el) return;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect(); const d = document.createElement("div"); d.id = "tap-ring";
    Object.assign(d.style, { position: "fixed", left: `${r.left - 6}px`, top: `${r.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px`, border: "3px solid hsl(42 70% 52%)", borderRadius: "999px", zIndex: 45, pointerEvents: "none", boxShadow: "0 0 0 6px hsl(42 70% 52% / .25)" });
    document.body.appendChild(d);
  }, sel);
  const clearTap = () => page.evaluate(() => document.getElementById("tap-ring")?.remove());
  const center = (sel) => page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: "center" }), sel);
  const type = async (sel, text, budget) => {
    await center(sel); const n = 5; const parts = [...text];
    for (let i = 1; i <= n; i++) { await page.fill(sel, parts.slice(0, Math.ceil(parts.length * i / n)).join("")); await shot(budget / n); }
  };
  const s = SAMPLE[lang];
  for (let i = 0; i < lesson.steps.length; i++) {
    const step = lesson.steps[i];
    await page.evaluate((n) => window.__setStep(n), i); await clearTap();
    await page.waitForTimeout(250); await page.evaluate(() => document.fonts.ready);
    const start = frames.reduce((a, [, h]) => a + h, 0);
    const sc = step.scene;
    if (sc === "auth") await tap("#tap-join");
    if (sc === "wardrobe") await tap("#tap-add");
    if (sc === "match") await tap("#tap-chat");
    if (sc === "offer") await tap("#tap-offer");
    if (sc === "card") await tap("#measure-line");
    if (sc === "like") await tap("#tap-like");
    if (sc === "propose") await tap("#tap-propose");
    if (sc === "accept") await tap("#tap-accept");
    if (sc === "complete") await tap("#tap-complete");
    if (sc === "photos") await tap('[data-testid="button-add-photo"]');
    if (sc === "details") { await type('[data-testid="input-title"]', s.title, 1.2); await type('[data-testid="input-description"]', s.desc, 1.6); }
    if (sc === "select") {
      await center('[data-testid="select-occasion"]'); await page.selectOption('[data-testid="select-occasion"]', "Meskel"); await shot(1);
      await page.selectOption('[data-testid="select-condition"]', "Like new"); await shot(0.8);
      await type('[data-testid="input-color"]', s.color, 0.8);
    }
    if (sc === "embroidery") { await type('[data-testid="input-embroidery"]', s.embroidery, 1.2); await center('[data-testid="input-timesWorn"]'); await page.fill('[data-testid="input-timesWorn"]', "2"); await shot(0.6); }
    if (sc === "measure") { await center('[data-testid="input-sleeves"]'); for (const [key, v] of Object.entries(MEAS)) { await page.fill(`[data-testid="input-${key}"]`, v); await shot(0.5); } }
    if (sc === "save") await tap('[data-testid="button-save-listing"]');
    const used = frames.reduce((a, [, h]) => a + h, 0) - start;
    await shot(Math.max(0.8, step.dur - used));
  }
  await page.close();
  // concat demuxer list
  const list = frames.map(([f, h]) => `file '${f}'\nduration ${h.toFixed(3)}`).join("\n") + `\nfile '${frames.at(-1)[0]}'\n`;
  const listFile = path.join(tmp, "list.txt"); writeFileSync(listFile, list);
  const mp4 = path.join(out, `${stem}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listFile,
    "-vf", "scale=640:-2:flags=lanczos,fps=15,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-tune", "stillimage",
    "-movflags", "+faststart", "-an", mp4]);
  // poster from a mid-lesson frame
  const posterSrc = frames[Math.min(frames.length - 1, Math.floor(frames.length / 2))][0];
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", posterSrc, "-vf", "scale=480:-2", "-quality", "70", path.join(out, `${stem}.webp`)]);
  // captions
  let t = 0; const cues = lesson.steps.map((st, i) => { const a = t; t += st.dur; return `${i + 1}\n${ts(a)} --> ${ts(t)}\n${st[lang]}\n`; });
  writeFileSync(path.join(out, `${stem}.vtt`), `WEBVTT\n\n${cues.join("\n")}`);
  const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=width,height", "-of", "json", mp4]).toString());
  manifest[stem] = { duration: Number(Number(probe.format.duration).toFixed(1)), bytes: Number(probe.format.size), width: probe.streams[0].width, height: probe.streams[0].height, posterBytes: statSync(path.join(out, `${stem}.webp`)).size };
  console.log(stem, manifest[stem]);
}
await browser.close();
writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
