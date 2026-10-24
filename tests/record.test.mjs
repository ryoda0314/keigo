import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dueKeys,
  emptyState,
  grown,
  kindFor,
  mergeStates,
  metBefore,
  pickNext,
  putThread,
  recordMet,
  recordResult,
  recordVisit,
  removeThread,
  RETURN_AFTER,
  stageOf,
} from "../src/lib/record.ts";

const HOUR = 3_600_000;

function thread(id, turns = []) {
  return { id, kind: "scene", ref: "dinner", person: "halmeoni", title: "下宿の夕飯", startedAt: 1, updatedAt: 1, turns };
}

function corrected(words, support) {
  return {
    id: "t1",
    role: "me",
    at: 10,
    input: "할머니 밥 먹었어요?",
    support,
    result: { corrected: "할머니, 진지 드셨어요?", natural: false, note: "", gaps: [], words },
  };
}

test("a rain bathed in counts as an activity, and its raised words are met", () => {
  const s = recordVisit(emptyState(), "rain", "eat", 1000);
  assert.equal(s.n, 1);
  assert.equal(s.visits.length, 1);
  assert.ok(s.words["드시다"]?.events.some((e) => e.kind === "met"));
  assert.ok(s.words["잡수시다"]);
  // Everyday words are not followed: only raised ones.
  assert.equal(s.words["먹다"], undefined);
});

test("meeting a word twice in the same place within an hour counts once", () => {
  let s = recordMet(emptyState(), ["드시다"], { kind: "rain", id: "eat" }, 0);
  s = recordMet(s, ["드시다"], { kind: "rain", id: "eat" }, HOUR / 2);
  assert.equal(s.words["드시다"].events.length, 1);
  s = recordMet(s, ["드시다"], { kind: "rain", id: "eat" }, HOUR * 2);
  assert.equal(s.words["드시다"].events.length, 2);
});

test("how a word of a corrected sentence counts depends on what the learner had in front of them", () => {
  const w = { word: "드시다", start: 7, end: 9, origin: "mine" };
  assert.equal(kindFor({ ...w, origin: "ai" }, undefined), "ai");
  assert.equal(kindFor(w, { samples: "borrowed" }), "borrowed");
  assert.equal(kindFor(w, { samples: "opened" }), "remade");
  assert.equal(kindFor(w, undefined), "own");
});

test("a word goes from met to supported to the learner's own, and the own use after support is できたこと", () => {
  const t = thread("a");
  let s = recordVisit(emptyState(), "rain", "eat", 1);
  assert.equal(stageOf(s, "드시다"), 1);
  s = recordResult(s, t, corrected([{ word: "드시다", start: 8, end: 10, origin: "ai" }]), null, 2);
  assert.equal(stageOf(s, "드시다"), 2);
  assert.equal(grown(s).length, 0);
  s = recordResult(s, t, corrected([{ word: "드시다", start: 8, end: 10, origin: "mine" }]), null, 3);
  assert.equal(stageOf(s, "드시다"), 3);
  assert.deepEqual(
    grown(s).map((g) => [g.key, g.before, g.text]),
    [["드시다", "ai", "드셨"]],
  );
});

test("a word comes back a few activities later, until the learner uses it on their own", () => {
  let s = recordMet(emptyState(), ["주무시다"], { kind: "rain", id: "sleep" }, 0);
  assert.deepEqual(dueKeys(s, 1), []);
  for (let i = 0; i < RETURN_AFTER; i++) s = recordVisit(s, "scene", "meeting", 10 + i, []);
  assert.deepEqual(dueKeys(s, 100), ["주무시다"]);
  // The rain holding it comes first.
  assert.equal(pickNext(s, "rain", 100), "sleep");
});

test("rains not bathed in come first, in order, and the one just shown is never next", () => {
  let s = emptyState();
  assert.equal(pickNext(s, "rain"), "eat");
  s = recordVisit(s, "rain", "eat", 1);
  assert.equal(pickNext(s, "rain", 2, "eat"), "sleep");
});

test("violet means met before: not for what is met now", () => {
  const s = recordVisit(emptyState(), "rain", "eat", 1000);
  assert.equal(metBefore(s, "드시다", 2000), true);
  assert.equal(metBefore(s, "드시다", 1000), false);
});

test("two devices' records are merged, losing nothing either had, and a deleted thread stays deleted", () => {
  const a = putThread(recordVisit(emptyState(), "rain", "eat", 1), thread("x"));
  const b = putThread(recordVisit(emptyState(), "rain", "sleep", 2), thread("y"));
  const merged = mergeStates(a, b);
  assert.ok(merged.words["드시다"] && merged.words["주무시다"]);
  assert.deepEqual(merged.threads.map((t) => t.id).sort(), ["x", "y"]);
  const gone = mergeStates(removeThread(merged, "x", 5), b);
  assert.deepEqual(
    gone.threads.map((t) => t.id),
    ["y"],
  );
});
