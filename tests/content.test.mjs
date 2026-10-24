import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allLines,
  BRANCHES,
  hits,
  LADDER,
  markSpans,
  PEOPLE,
  RAINS,
  RAISED,
  rainLines,
  sampleLines,
  SCENES,
  SI_MARK,
  wordById,
  WORDS,
} from "../src/content/index.ts";

const SPEAKERS = new Set([...Object.keys(PEOPLE), "me"]);
const LISTENERS = new Set([...SPEAKERS, "guest"]);

test("words are unique, and every raised word stands on everyday words that exist", () => {
  const ids = WORDS.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const w of WORDS) {
    if (w.height === 0) {
      assert.equal(w.base, undefined, w.id);
      continue;
    }
    assert.ok(w.base?.length, `${w.id} has no everyday word`);
    for (const b of w.base) assert.equal(wordById(b)?.height, 0, `${w.id}: ${b}`);
    assert.ok(w.who, `${w.id} says who it is for`);
  }
});

test("branches: an everyday word below, raised words above that name it", () => {
  const ids = BRANCHES.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const b of BRANCHES) {
    assert.equal(wordById(b.base)?.height, 0, b.id);
    for (const id of b.limbs) {
      const w = wordById(id);
      assert.ok(w && w.height > 0, `${b.id}: ${id}`);
      assert.ok(w.base?.includes(b.base), `${id} does not stand on ${b.base}`);
    }
  }
  for (const w of RAISED) assert.ok(BRANCHES.some((b) => b.limbs.includes(w.id)), `${w.id} is on no branch`);
});

test("line ids are unique", () => {
  const ids = allLines().map((l) => l.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dup, []);
});

test("every mark is a known word, placed in its line, where the word's core finds it", () => {
  for (const line of allLines()) {
    for (const mark of line.marks ?? []) {
      if (mark.word === SI_MARK) assert.ok(mark.base, `${line.id}: -시- needs the verb it raises`);
      else assert.ok(wordById(mark.word), `${line.id}: unknown word ${mark.word}`);
      assert.ok(line.ko.includes(mark.text), `${line.id}: "${mark.text}" is not in "${line.ko}"`);
    }
    const spans = markSpans(line);
    assert.equal(spans.length, (line.marks ?? []).length, `${line.id}: a mark could not be placed in "${line.ko}"`);
  }
});

test("speakers and listeners are known; a climb is said by わたし and answered by the one it is said to", () => {
  for (const line of allLines()) {
    assert.ok(SPEAKERS.has(line.by), `${line.id}: ${line.by}`);
    assert.ok(LISTENERS.has(line.to), `${line.id}: ${line.to}`);
    assert.notEqual(line.by, line.to, line.id);
    assert.ok(line.ja.trim(), `${line.id} has no Japanese`);
  }
  for (const rain of RAINS) {
    assert.ok(rain.lines.length >= 8, `${rain.id} is a short rain`);
    for (const b of rain.branches) assert.ok(BRANCHES.some((x) => x.id === b), `${rain.id}: ${b}`);
    for (const c of rain.climbs) {
      assert.ok(c.steps.length >= 2, c.id);
      for (const s of c.steps) {
        assert.equal(s.said.by, "me", s.said.id);
        if (s.reply) {
          assert.equal(s.reply.by, s.said.to, s.reply.id);
          assert.equal(s.reply.to, "me", s.reply.id);
        }
      }
      // The steps climb: each listener stands at least as high as the one before.
      const heights = c.steps.map((s) => LADDER.indexOf(s.said.to));
      assert.ok(heights.every((h, i) => h >= 0 && (i === 0 || h >= heights[i - 1])), `${c.id} does not climb`);
    }
  }
});

test("every raised word falls in a rain, and turns up in two or more places", () => {
  const places = new Map();
  const add = (word, place) => places.set(word, new Set([...(places.get(word) ?? []), place]));
  for (const rain of RAINS) for (const l of rainLines(rain)) for (const m of l.marks ?? []) add(m.word, `rain:${rain.id}:${l.id}`);
  const inRain = new Set(places.keys());
  for (const s of SCENES) for (const l of [s.line, ...sampleLines(s)]) for (const m of l.marks ?? []) add(m.word, `scene:${s.id}`);
  for (const w of RAISED) {
    assert.ok(inRain.has(w.id), `${w.id} is in no rain`);
    assert.ok((places.get(w.id)?.size ?? 0) >= 2, `${w.id} turns up only once`);
  }
});

test("scenes: a person's line to わたし, two or three samples, a brief for the person", () => {
  const ids = SCENES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of SCENES) {
    assert.ok(PEOPLE[s.line.by], s.id);
    assert.equal(s.line.to, "me", s.id);
    assert.ok(s.samples.length >= 2 && s.samples.length <= 3, s.id);
    assert.ok(s.mine && s.situation && s.brief, s.id);
    for (const x of s.samples) assert.ok(x.puts && x.ja, `${s.id}: ${x.ko}`);
  }
});

// The learner's own words decide whether they used a word (src/lib/turn-core.ts), so a core must find every form of
// its word and must not fire on words that only look alike.
const FINDS = {
  드시다: ["커피 드실래요?", "많이 드세요", "점심 드셨어요?", "드시고 가세요?"],
  잡수시다: ["진지 잡수셨어요?", "이거 잡숴 보세요"],
  주무시다: ["안녕히 주무세요", "잘 주무셨어요?"],
  계시다: ["교수님 계세요?", "집에 계셔", "안 계십니다"],
  있으시다: ["시간 있으세요?", "질문 있으십니까?"],
  말씀하시다: ["뭐라고 말씀하셨어요?", "말씀하신 책"],
  말씀드리다: ["제가 말씀드릴게요", "미리 말씀 못 드려서", "말씀을 드렸어요"],
  드리다: ["선물 드릴게요", "축하드려요", "부탁드립니다"],
  여쭙다: ["여쭤봐도 될까요?", "여쭙겠습니다"],
  뵙다: ["처음 뵙겠습니다", "내일 뵐게요", "내일 봬요"],
  찾아뵙다: ["찾아뵈어도 될까요?", "찾아뵙겠습니다"],
  모시다: ["모시고 갈게요", "모셔다 드릴게요"],
  진지: ["진지 드셨어요?"],
  연세: ["연세가 어떻게 되세요?"],
  분: ["몇 분이세요?", "두 분 다", "저분 누구세요?"],
  저: ["제가 할게요", "저는 괜찮아요", "저 먹고 왔어요"],
  제: ["제 리포트예요"],
  께: ["교수님께 드려", "할머니께 감사해요"],
  께서: ["어머니께서 말씀하셨어요"],
  편찮으시다: ["많이 편찮으세요?"],
  돌아가시다: ["작년에 돌아가셨어요"],
  주시다: ["보내 주셔서 감사합니다", "이거 주세요"],
};
const LOOKALIKES = {
  드시다: ["반드시 와", "드림 팀"],
  계시다: ["계속 해", "계산해 주세요"],
  께: ["함께 가자"],
  진지: ["진지하게 생각해", "진지한 얘기"],
  연세: ["연세대 다녀"],
  주시다: ["주말에 봐", "주소 알려 줘", "주무세요"],
  저: ["저기요", "저분 누구세요?", "저희 학교"],
  분: ["부분", "기분이 좋아", "충분해"],
  모시다: ["모자 샀어"],
  드리다: ["드시고 가세요"],
};

test("cores find every form of their word", () => {
  for (const [word, texts] of Object.entries(FINDS)) for (const t of texts) assert.ok(hits(t, word).length, `${word} not found in "${t}"`);
});

test("cores do not fire on words that only look alike", () => {
  for (const [word, texts] of Object.entries(LOOKALIKES)) for (const t of texts) assert.equal(hits(t, word).length, 0, `${word} found in "${t}"`);
});
