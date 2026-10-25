// 映像に要るものを public/ に集め、src/audio.json（クリップのファイルと長さ）を書く。映像の時はこの長さから決まる。
//   - アプリのアイコン（../public/icons/icon-512.png）
//   - 用意した文は、アプリの声そのもの（../public/audio、../src/content/audio.json の名前で）。わたしの文は女声（@f）。
//   - 場面の相手の返事は、アプリでは AI が書く。ここでは本物の答え（src/scene.json）を、/api/say と同じくその人の声で
//     読ませる（../src/lib/tts.ts）。文か声が変わったときだけ作り直す。
//   - アプリの字（IBM Plex Sans JP・IBM Plex Sans KR・しっぽり明朝）。Google Fonts の倉庫（OFL）からまるごと取り、映像の元
//     （src/）とアプリの中身（../src/content、../src/lib/i18n）に出てくる字だけに切る（Python の fontTools）。
//   node --env-file=../.env.local scripts/assets.mjs        (npm run assets)
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PEOPLE } from "../../src/content/index.ts";
import { speak } from "../../src/lib/tts.ts";

const APP = "..";
const PREPARED = ["sleep-a.1@f", "sleep-a.2@f", "sleep-a.3@f", "eat.6", "eat-a.2@f", "eat-a.3@f", "eat-a.4@f", "eat-a.4r", "dinner", "cafe-guest"];
const SCENE = JSON.parse(readFileSync("src/scene.json", "utf8"));
// 場面の相手の返事（AI が書いたもの）と、その人の声。
const REPLIES = {
  // 할머니 の返事は、映像では初めの二文で切る（scene.json の film）。
  "halmeoni.reply": { person: "halmeoni", text: SCENE.dinner.reply.film.text },
};
// 사장님 の返事（scene.json の cafe.reply）は読ませない：映像は直った文のところで 自分 へ移る。

const FONTS = {
  "IBMPlexSansJP-Regular.ttf": "ibmplexsansjp/IBMPlexSansJP-Regular.ttf",
  "IBMPlexSansJP-Medium.ttf": "ibmplexsansjp/IBMPlexSansJP-Medium.ttf",
  "IBMPlexSansJP-SemiBold.ttf": "ibmplexsansjp/IBMPlexSansJP-SemiBold.ttf",
  "IBMPlexSansKR-Regular.ttf": "ibmplexsanskr/IBMPlexSansKR-Regular.ttf",
  "IBMPlexSansKR-Medium.ttf": "ibmplexsanskr/IBMPlexSansKR-Medium.ttf",
  "IBMPlexSansKR-SemiBold.ttf": "ibmplexsanskr/IBMPlexSansKR-SemiBold.ttf",
  "ShipporiMincho-Bold.ttf": "shipporimincho/ShipporiMincho-Bold.ttf",
};
const WHOLE = "node_modules/.cache/fonts";

mkdirSync("public/app", { recursive: true });
mkdirSync("public/voice", { recursive: true });
mkdirSync("public/fonts", { recursive: true });
mkdirSync(WHOLE, { recursive: true });
copyFileSync(`${APP}/public/icons/icon-512.png`, "public/app/icon.png");

// 映像の元とアプリの中身に出てくる字（と、印字できる ASCII すべて）。まるごとの日本語・韓国語の字は数 MB あり、
// 書き出しの各ページで読むと時間切れになることがある。
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const chars = new Set(Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)));
for (const file of [...walk("src"), ...walk(`${APP}/src/content`), ...walk(`${APP}/src/lib/i18n`)]) for (const ch of readFileSync(file, "utf8")) if (ch > "\u007f") chars.add(ch);
writeFileSync(`${WHOLE}/chars.txt`, [...chars].join(""));
for (const [file, path] of Object.entries(FONTS)) {
  if (!existsSync(`${WHOLE}/${file}`)) {
    const res = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${path}`);
    if (!res.ok) throw new Error(`${file}: ${res.status}`);
    writeFileSync(`${WHOLE}/${file}`, Buffer.from(await res.arrayBuffer()));
    console.log(`  font ${file}`);
  }
  const cut = spawnSync(
    "python",
    ["-m", "fontTools.subset", `${WHOLE}/${file}`, `--text-file=${WHOLE}/chars.txt`, `--output-file=public/fonts/${file}`, "--layout-features=*", "--no-hinting"],
    { encoding: "utf8" },
  );
  if (cut.status !== 0) throw new Error(`cutting ${file} (pip install fonttools): ${cut.stderr}`);
}
console.log(`  fonts cut to ${chars.size} characters`);

const manifest = JSON.parse(readFileSync(`${APP}/src/content/audio.json`, "utf8"));
const out = {};
for (const id of PREPARED) {
  const file = manifest[id];
  if (!file) throw new Error(`${id} has no clip in the app`);
  copyFileSync(`${APP}/public/audio/${file}`, `public/app/${id}.mp3`);
  out[id] = { src: `app/${id}.mp3` };
}

for (const [id, { person, text }] of Object.entries(REPLIES)) {
  const { voice, fallback } = PEOPLE[person];
  const name = `${id}.${createHash("sha256").update(`${voice}\n${text}`).digest("hex").slice(0, 8)}.mp3`;
  if (!existsSync(`public/voice/${name}`)) {
    const said = await speak(text, voice, { tries: 3, fallback });
    if (said.voice !== voice) console.log(`  ${id}: ${voice} refused, voiced by ${said.voice}`);
    writeFileSync(`public/voice/${name}`, said.mp3);
    console.log(`  voiced ${id}`);
  }
  out[id] = { src: `voice/${name}`, text };
}
// public/voice にはナレーション（scripts/voice.mjs の .wav）もある。消すのは返事の古い .mp3 だけ。
const kept = new Set(Object.values(out).map((x) => x.src.replace(/^voice\//, "")));
for (const f of readdirSync("public/voice")) if (f.endsWith(".mp3") && !kept.has(f)) unlinkSync(`public/voice/${f}`);

// 長さはクリップから（Remotion の ffprobe）。
for (const [id, clip] of Object.entries(out)) {
  const r = spawnSync(`npx remotion ffprobe -v error -show_entries format=duration -of csv=p=0 "public/${clip.src}"`, { encoding: "utf8", shell: true });
  const seconds = Number.parseFloat(r.stdout.trim());
  if (!Number.isFinite(seconds)) throw new Error(`no length for ${clip.src}: ${r.stderr}`);
  clip.seconds = Math.round(seconds * 1000) / 1000;
}
writeFileSync("src/audio.json", `${JSON.stringify(out, null, 2)}\n`);
console.log(Object.entries(out).map(([id, c]) => `  ${id} ${c.seconds}s`).join("\n"));
