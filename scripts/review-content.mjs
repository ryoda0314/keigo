// A second opinion on the prepared Korean, as ことのあめ's review-library does for its drafts: every line of every rain and
// scene goes to another model with who says it to whom and about whom, and only problems come back (unnatural Korean,
// honorifics wrong for the people, a raised word marked where it is not, a Japanese translation that misleads). They are
// written to scripts/work/content-review.json for a person to decide; nothing is changed here.
//
//   node --env-file=.env.local scripts/review-content.mjs [rain or scene ids]
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { roleOf, PEOPLE, RAINS, rainLines, sampleLines, SCENES } from "../src/content/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "scripts/work/content-review.json");
const only = process.argv.slice(2);
const require = createRequire(import.meta.url);
const { default: OpenAI } = require("openai");
const openai = new OpenAI();
const MODEL = process.env.REVIEW_MODEL || "gpt-5.5";

const who = (id) => (id === "me" ? "the student (a Japanese exchange student in Seoul)" : id === "guest" ? "a cafe customer" : `${PEOPLE[id]?.persona.split(",")[0] ?? id}`);
const describe = (l) =>
  [
    `${l.id} | ${who(l.by)} → ${who(l.to)}${l.about ? ` | about: ${l.about}` : ""}`,
    `  ko: ${l.ko}`,
    `  ja: ${l.ja}`,
    l.marks?.length ? `  marked: ${l.marks.map((m) => `${m.text}=${m.word}${m.base ? `(${m.base})` : ""}`).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

const SYSTEM = `You review Korean example lines for an app that teaches Japanese speakers Korean honorifics (높임말). The learner already speaks casual Korean (반말); the app teaches the raised words (드시다, 잡수시다, 주무시다, 계시다, 말씀, 진지, 연세, 성함, 댁, 생신, 드리다, 여쭙다, 뵙다, 모시다, 께서, 께, 저/제/저희 …) and the -시- that comes with them.

Each line says who says it to whom, and whom it is about when that is a third person. The people: 서준 (the student's classmate, same age), 지은 (one year above, same club, speaks 반말 to the student), 박정호 (professor in his fifties, speaks 해요체), 김순자 (boarding-house grandmother in her seventies, speaks 반말), 최민호 (cafe owner in his forties, speaks 반말 to his part-timer), 한미경 (서준's mother in her fifties, speaks 반말 to her son's friend). Elders speak down; the student raises them.

Report only real problems, each once:
- Korean that a native speaker would not say in this situation, or that sounds unnatural or stilted.
- Honorifics wrong for the people involved: the ending wrong for the listener, a person not raised who should be (or raised who should not be: things, oneself, friends, younger people), a raised word that does not fit (생신/진지/잡수시다 for someone young, etc.).
- A marked word that is not the word it is marked as (or text marked that is not there), or a "(base)" that is not the everyday word for it here.
- A Japanese translation that misreads the Korean or misleads about who does what. Natural Japanese that does not mirror the honorifics is fine (Japanese casual speech often does not raise a third person).
Do not report style preferences, punctuation or spacing, or that another wording is also possible. When nothing is wrong, return no issues.

"problem" is in Japanese. "fix_ko" and "fix_ja" are the corrected line and translation, or "" when unchanged.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["issues"],
  properties: {
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "severity", "problem", "fix_ko", "fix_ja"],
        properties: {
          id: { type: "string" },
          severity: { type: "string", enum: ["error", "nit"] },
          problem: { type: "string" },
          fix_ko: { type: "string" },
          fix_ja: { type: "string" },
        },
      },
    },
  },
};

const groups = [
  ...RAINS.map((r) => ({ id: r.id, title: r.title, lines: rainLines(r) })),
  ...SCENES.map((s) => ({ id: s.id, title: s.title, lines: [s.line, ...sampleLines(s)], brief: `${s.situation} わたしの事情: ${s.mine}` })),
].filter((g) => !only.length || only.includes(g.id));

const all = [];
for (const g of groups) {
  const user = [`${g.title}${g.brief ? ` — ${g.brief}` : ""}`, ...g.lines.map(describe)].join("\n\n");
  const res = await openai.chat.completions.create({
    model: MODEL,
    reasoning_effort: "medium",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    response_format: { type: "json_schema", json_schema: { name: "review", strict: true, schema: SCHEMA } },
  });
  const issues = JSON.parse(res.choices[0].message.content).issues;
  for (const i of issues) {
    const line = g.lines.find((l) => l.id === i.id);
    all.push({ group: g.id, ...i, ko: line?.ko ?? "", by: line ? roleOf(line.by) : "", to: line ? roleOf(line.to) : "" });
  }
  console.log(`${g.id}: ${issues.length ? issues.map((i) => `${i.id}(${i.severity})`).join(" ") : "ok"}`);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(all, null, 2)}\n`);
console.log(`${all.filter((i) => i.severity === "error").length} errors, ${all.filter((i) => i.severity === "nit").length} nits → scripts/work/content-review.json`);
