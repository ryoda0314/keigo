// Voices every prepared line (src/content) in its speaker's Gemini voice, through the app's own src/lib/tts.ts, so a
// person sounds the same in a rain and in a reply. わたし's lines are made in both of わたし's voices (the learner
// chooses). As ことのおと checks its clips, each take is heard back by a recognizer: one that does not say its line is
// made again, and after three takes the closest is kept and listed in scripts/work/review.json for a person to hear.
//
//   node --env-file=.env.local scripts/generate-audio.mjs [--dry-run] [--limit=40] [--no-check]
//
// A clip is named by a hash of VOICING, its voice and its text (public/audio/<voice>/<hash>.mp3), so the same sentence
// in the same voice is made once, a changed line gets a new clip, and clips no line uses are removed. The manifest
// (src/content/audio.json) lists only clips that exist; the app reads other lines in the browser's voice. Resumable:
// when Google's quota keeps refusing it stops, and the same command carries on.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { allLines, ME_VOICES, PEOPLE } from "../src/content/index.ts";
import { VOICING } from "../src/lib/speech.ts";
import { isQuota, speak } from "../src/lib/tts.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO = join(root, "public/audio");
const MANIFEST = join(root, "src/content/audio.json");
const REVIEW = join(root, "scripts/work/review.json");
const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const check = !args.includes("--no-check");
const limit = Number(args.find((a) => a.startsWith("--limit="))?.slice(8)) || Infinity;
const WORKERS = 2;
const GOOD = 0.95;

const require = createRequire(import.meta.url);
const { default: OpenAI, toFile } = require("openai");
const openai = check ? new OpenAI() : null;

// Every clip the app may play: わたし's lines twice (f, m), everyone else's once, in their own voice.
const jobs = [];
for (const line of allLines()) {
  if (line.by === "me") for (const v of ["f", "m"]) jobs.push({ key: `${line.id}@${v}`, voice: ME_VOICES[v].voice, text: line.ko });
  else jobs.push({ key: line.id, voice: PEOPLE[line.by].voice, text: line.ko });
}
const fileOf = (j) => `${j.voice.toLowerCase()}/${createHash("sha256").update(`${VOICING}\n${j.voice}\n${j.text}`).digest("hex").slice(0, 16)}.mp3`;

const wanted = new Map(jobs.map((j) => [j.key, fileOf(j)]));
const todo = new Map();
for (const j of jobs) {
  const file = wanted.get(j.key);
  if (!existsSync(join(AUDIO, file)) && !todo.has(file)) todo.set(file, j);
}

// Clips no line uses any more.
const used = new Set(wanted.values());
const stale = [];
if (existsSync(AUDIO)) {
  for (const dir of readdirSync(AUDIO, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const f of readdirSync(join(AUDIO, dir.name))) if (f.endsWith(".mp3") && !used.has(`${dir.name}/${f}`)) stale.push(`${dir.name}/${f}`);
  }
}

console.log(`${jobs.length} clips wanted, ${used.size} files, ${todo.size} to make, ${stale.length} no longer used`);
if (dry) process.exit(0);
for (const f of stale) rmSync(join(AUDIO, f));

function writeManifest() {
  const out = {};
  for (const [key, file] of wanted) if (existsSync(join(AUDIO, file))) out[key] = file;
  writeFileSync(MANIFEST, `${JSON.stringify(out, null, 0).replace(/,"/g, ',\n"')}\n`);
}

const review = existsSync(REVIEW) ? JSON.parse(readFileSync(REVIEW, "utf8")) : [];
const syllables = (s) => s.match(/[가-힣]/g) ?? [];
function sameness(a, b) {
  const x = syllables(a);
  const y = syllables(b);
  if (!x.length || !y.length) return 0;
  const t = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) t[i][j] = x[i] === y[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  return t[0][0] / Math.max(x.length, y.length);
}
async function heard(mp3) {
  const r = await openai.audio.transcriptions.create({ file: await toFile(mp3, "take.mp3", { type: "audio/mpeg" }), model: "gpt-4o-transcribe", language: "ko" });
  return r.text.trim();
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let refusals = 0;
let stopped = false;
let made = 0;

async function make(file, job) {
  let best = null;
  for (let take = 1; take <= 3 && !stopped; ) {
    let said;
    try {
      said = await speak(job.text, job.voice, { tries: 2 });
      refusals = 0;
    } catch (err) {
      if (!isQuota(err)) {
        console.log(`  ${job.key}: ${String(err?.message ?? err).slice(0, 120)}`);
        return;
      }
      if (++refusals > 10) {
        stopped = true;
        console.log("Google's quota keeps refusing: stopping here. The same command carries on later.");
        return;
      }
      await wait(20_000);
      continue;
    }
    const text = check ? await heard(said.mp3).catch(() => "") : job.text;
    const score = check ? sameness(job.text, text) : 1;
    if (!best || score > best.score) best = { mp3: said.mp3, score, text };
    if (score >= GOOD) break;
    take++;
  }
  if (!best) return;
  mkdirSync(dirname(join(AUDIO, file)), { recursive: true });
  writeFileSync(join(AUDIO, file), best.mp3);
  made++;
  const i = review.findIndex((r) => r.file === file);
  if (i !== -1) review.splice(i, 1);
  if (best.score < GOOD) review.push({ file, key: job.key, voice: job.voice, text: job.text, heard: best.text, score: Number(best.score.toFixed(2)) });
  if (made % 10 === 0) {
    writeManifest();
    console.log(`  ${made} made`);
  }
}

const queue = [...todo].slice(0, limit);
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    while (queue.length && !stopped) {
      const [file, job] = queue.shift();
      await make(file, job);
    }
  }),
);
writeManifest();
mkdirSync(dirname(REVIEW), { recursive: true });
writeFileSync(REVIEW, `${JSON.stringify(review, null, 2)}\n`);
console.log(`${made} made; ${review.length} waiting for a person in scripts/work/review.json`);
