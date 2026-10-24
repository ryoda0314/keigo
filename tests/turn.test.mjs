import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanTurn, hadIt, litWords, turnPrompt } from "../src/lib/turn-core.ts";
import { sentencesOf, sameness } from "../src/lib/text.ts";

const sign = (text) => `sig:${text.length}`;
const req = (input, extra = {}) => ({ kind: "scene", ref: "dinner", person: "halmeoni", history: [], input, due: [], ...extra });
const raw = (over = {}) => ({
  ask: "",
  options: [],
  corrected: "할머니, 진지 드셨어요?",
  note_ja: "할머니が食べることなので 드셨어요 に。",
  gaps: [],
  words: [],
  reply: "그래, 먹었다. 너는 먹었니?",
  reply_ja: "ああ、食べたよ。あんたは食べたかい？",
  reply_words: [],
  ...over,
});

test("the raised words of a sentence are found by their cores, the longest standing where they overlap", () => {
  const words = litWords("제가 내일 다시 말씀드릴게요.", []);
  assert.deepEqual(
    words.map((w) => w.word),
    ["저", "말씀드리다"],
  );
  const text = "제가 내일 다시 말씀드릴게요.";
  assert.equal(text.slice(words[0].start, words[0].end), "제가");
  assert.equal(text.slice(words[1].start, words[1].end), "말씀드릴");
});

test("a word the model names is kept only where its core finds it", () => {
  const words = litWords("반드시 올게요.", [{ word: "드시다", text: "드시" }]);
  assert.deepEqual(words, []);
});

test("whose word it was is decided from the learner's own words, not the model", () => {
  const mine = cleanTurn(raw(), req("할머니 진지 드셨어요?"), sign);
  assert.ok("result" in mine);
  assert.deepEqual(
    mine.result.words.map((w) => [w.word, w.origin]),
    [
      ["진지", "mine"],
      ["드시다", "mine"],
    ],
  );
  const ai = cleanTurn(raw(), req("할머니 밥 먹었어요?"), sign);
  assert.deepEqual(
    ai.result.words.map((w) => [w.word, w.origin]),
    [
      ["진지", "ai"],
      ["드시다", "ai"],
    ],
  );
});

test("a Japanese part is kept only when the learner wrote it and its Korean is in the sentence", () => {
  const r = cleanTurn(
    raw({
      gaps: [
        { ja: "ご飯", ko: "진지" },
        { ja: "寝る", ko: "주무세요" },
      ],
    }),
    req("할머니 ご飯 먹었어요?"),
    sign,
  );
  assert.deepEqual(r.result.gaps, [{ ja: "ご飯", ko: "진지" }]);
});

test("a sentence already natural is said to be so; the reply is signed sentence by sentence", () => {
  const r = cleanTurn(raw(), req("할머니 진지 드셨어요"), sign);
  assert.equal(r.result.natural, true);
  assert.equal(r.reply.parts.length, 2);
  assert.deepEqual(
    r.reply.words.map((w) => w.word),
    [],
  );
});

test("an unclear sentence asks back instead of guessing, unless the learner has already chosen", () => {
  const asked = cleanTurn(raw({ ask: "どちらの意味？", options: ["A", "B"], corrected: "", reply: "" }), req("…"), sign);
  assert.deepEqual(asked, { ask: { question: "どちらの意味？", options: ["A", "B"] } });
  assert.throws(() => cleanTurn(raw({ ask: "どちらの意味？", options: ["A", "B"], corrected: "", reply: "" }), req("…", { intent: "A" }), sign));
});

test("the prompt carries the person, how they speak, and the scene", () => {
  const { system, user } = turnPrompt(req("할머니 밥 먹었어요?"));
  assert.match(system, /김순자/);
  assert.match(system, /반말/);
  assert.match(system, /have not eaten yet/);
  assert.match(user, /할머니 밥 먹었어요\?/);
});

test("hadIt finds the learner's own raised words, not look-alikes", () => {
  assert.equal(hadIt("교수님께 여쭤봤어요", "여쭙다"), true);
  assert.equal(hadIt("함께 가요", "께"), false);
});

test("Korean replies split into sentences; short pieces join the next", () => {
  assert.deepEqual(sentencesOf("그래. 먹었다. 너는 먹었니?"), ["그래. 먹었다.", "너는 먹었니?"]);
  assert.deepEqual(sentencesOf("네, 괜찮아요. 들어와요."), ["네, 괜찮아요.", "들어와요."]);
  assert.deepEqual(sentencesOf("응. 고마워."), ["응. 고마워."]);
});

test("a sample sent as it was is told from one made the learner's own", () => {
  assert.ok(sameness("저 먹고 왔어요. 할머니는 진지 드셨어요?", "저 먹고 왔어요. 할머니는 진지 드셨어요?") > 0.95);
  assert.ok(sameness("저는 친구랑 이미 먹었어요.", "저 먹고 왔어요. 할머니는 진지 드셨어요?") < 0.8);
});
