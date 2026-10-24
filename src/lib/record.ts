// The learner's record, kept on the device (store.ts) and, when they are signed in with their ことのあめ account, in
// ke_records too (sync.ts, merged, never overwritten). Pure: tested in tests/record.test.mjs.
//
// The centre of the record is the raised word, as ことのは's is the expression: what the learner met, opened, had the
// AI put in, borrowed from a sample, used with support, and later used on their own are kept apart, because only the
// last is evidence of using it (CONCEPT.md, 原則 8).
import { RAINS, SCENES, wordsIn, type PersonId } from "../content/index.ts";
import { sameness } from "./text.ts";

/** Where something happened: a rain, a scene, a conversation, or the 枝 map. */
export type Where = { kind: "rain" | "scene" | "thread" | "eda"; id: string };

/**
 * met: heard or read it (in a rain, a scene, a reply). looked: opened its branch. ai: the AI put it into the learner's
 * sentence. borrowed: sent a sample as it was. remade: used it with samples open. own: produced it themselves.
 */
export type EventKind = "met" | "looked" | "ai" | "borrowed" | "remade" | "own";
export type WordEvent = { id: string; at: number; kind: EventKind; where: Where; n: number; text?: string };
export type WordLog = { key: string; events: WordEvent[] };

/** A raised word lit in a sentence. */
export type Lit = { word: string; start: number; end: number };
/** What the learner wrote in Japanese, and the Korean used for it this time. */
export type Gap = { ja: string; ko: string };
/** A raised word of a corrected sentence: the learner's own, or put in by the AI. */
export type WordUse = Lit & { origin: "mine" | "ai" };
export type Correction = { corrected: string; natural: boolean; note: string; gaps: Gap[]; words: WordUse[]; sig?: string };

/** What the learner had in front of them: samples opened, or sent as they were. */
export type Support = { samples?: "opened" | "borrowed" };

export type MeTurn = {
  id: string;
  role: "me";
  at: number;
  input: string;
  spoken?: boolean;
  support?: Support;
  /** The reading chosen when the AI asked what was meant. */
  intent?: string;
  result?: Correction;
  ask?: { question: string; options: string[] };
};
export type ThemTurn = {
  id: string;
  role: "them";
  at: number;
  who: PersonId;
  text: string;
  ja: string;
  /** The server's signature over the text, so /api/say reads it; prepared lines have `line` (their clip) instead. */
  sig?: string;
  /** The same text as signed sentences, voiced one after another. */
  parts?: { text: string; sig: string }[];
  line?: string;
  words: Lit[];
};
export type Turn = MeTurn | ThemTurn;

export type ThreadKind = "scene" | "free";
export type Thread = {
  id: string;
  kind: ThreadKind;
  /** The scene (scene), or the person written to (free). */
  ref: string;
  person: PersonId;
  title: string;
  startedAt: number;
  updatedAt: number;
  turns: Turn[];
};

/** A rain bathed in or a scene shown. */
export type Visit = { at: number; kind: "rain" | "scene"; id: string };

export type State = {
  v: 1;
  threads: Thread[];
  words: Record<string, WordLog>;
  visits: Visit[];
  /** Counts what the learner has done (rains, scenes, sentences sent): "a few activities ago". */
  n: number;
  /** What each screen is in the middle of, to come back to. */
  current: { rain?: string; scene?: string; sceneThread?: string; at: number };
  /** Threads the learner deleted, so another device's copy does not bring them back. */
  removed: Record<string, number>;
};

export const THREADS_KEPT = 60;
export const EVENTS_KEPT = 60;
export const VISITS_KEPT = 500;
/** A word comes back after this long, or after this many other activities, whichever first. */
export const RETURN_HOURS = 20;
export const RETURN_AFTER = 3;

export function emptyState(): State {
  return { v: 1, threads: [], words: {}, visits: [], n: 0, current: { at: 0 }, removed: {} };
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** The Japan day of a moment, as 2026-10-24. */
export function dayOf(at: number): string {
  return new Date(at).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

function clone(state: State): State {
  return { ...state, threads: [...state.threads], words: { ...state.words }, visits: [...state.visits], current: { ...state.current }, removed: { ...state.removed } };
}

function withEvent(state: State, key: string, event: Omit<WordEvent, "id" | "n">): State {
  const next = clone(state);
  const log = next.words[key] ?? { key, events: [] };
  next.words[key] = { ...log, events: [...log.events, { ...event, id: newId(), n: state.n }].slice(-EVENTS_KEPT) };
  return next;
}

/** Heard or read these words somewhere (once per place within an hour). */
export function recordMet(state: State, keys: string[], where: Where, at = Date.now()): State {
  let next = state;
  for (const key of new Set(keys)) {
    const already = next.words[key]?.events.some((e) => e.kind === "met" && e.where.kind === where.kind && e.where.id === where.id && at - e.at < 3_600_000);
    if (!already) next = withEvent(next, key, { at, kind: "met", where });
  }
  return next;
}

/** Opened a word's branch. */
export function recordLooked(state: State, key: string, where: Where, at = Date.now()): State {
  return withEvent(state, key, { at, kind: "looked", where });
}

/**
 * A rain bathed in (all of it fell) or a scene shown: one activity, and its words were met (`keys`: only those shown,
 * as a scene's samples stay hidden until opened).
 */
export function recordVisit(state: State, kind: "rain" | "scene", id: string, at = Date.now(), keys = wordsIn({ kind, id })): State {
  const next = recordMet(clone(state), keys, { kind, id }, at);
  next.visits = [...next.visits, { at, kind, id }].slice(-VISITS_KEPT);
  next.n = state.n + 1;
  return next;
}

/** How a raised word of a corrected sentence counts, given what the learner had in front of them. */
export function kindFor(use: WordUse, support: Support | undefined): EventKind {
  if (use.origin === "ai") return "ai";
  if (support?.samples === "borrowed") return "borrowed";
  if (support?.samples === "opened") return "remade";
  return "own";
}

/** A sentence came back corrected: each raised word in it is recorded, and so are those of the reply. */
export function recordResult(state: State, thread: Thread, turn: MeTurn, reply: ThemTurn | null, at = Date.now()): State {
  const where: Where = { kind: "thread", id: thread.id };
  let next = clone(state);
  next.n = state.n + 1;
  const r = turn.result;
  for (const w of r?.words ?? []) next = withEvent(next, w.word, { at, kind: kindFor(w, turn.support), where, text: r!.corrected.slice(w.start, w.end) });
  if (reply?.words.length) next = recordMet(next, reply.words.map((s) => s.word), where, at);
  return next;
}

export function threadById(state: State, id: string): Thread | undefined {
  return state.threads.find((t) => t.id === id);
}

/** Adds or replaces a thread, newest first. */
export function putThread(state: State, thread: Thread): State {
  const next = clone(state);
  next.threads = [thread, ...state.threads.filter((t) => t.id !== thread.id)];
  return next;
}

export function removeThread(state: State, id: string, at = Date.now()): State {
  const next = clone(state);
  next.threads = state.threads.filter((t) => t.id !== id);
  next.removed[id] = at;
  if (next.current.sceneThread === id) delete next.current.sceneThread;
  return next;
}

export function setCurrent(state: State, part: Partial<Omit<State["current"], "at">>, at = Date.now()): State {
  const next = clone(state);
  next.current = { ...state.current, ...part, at };
  return next;
}

/** Adds the learner's turn or the person's, or replaces one with the same id. */
export function withTurn(thread: Thread, turn: Turn, at = Date.now()): Thread {
  const i = thread.turns.findIndex((t) => t.id === turn.id);
  const turns = i === -1 ? [...thread.turns, turn] : thread.turns.map((t, k) => (k === i ? turn : t));
  return { ...thread, turns, updatedAt: at };
}

/** Kinds that mean the learner took notice of a word (and so it is worth meeting again). */
const NOTICED: EventKind[] = ["looked", "ai", "borrowed", "remade", "own"];

/** The learner has met the word before `at`: lit in the again violet when it turns up. */
export function metBefore(state: State, key: string, at = Infinity): boolean {
  return Boolean(state.words[key]?.events.some((e) => e.at < at));
}

/** The learner has taken notice of it (before `at`, when given). */
export function noticed(state: State, key: string, at = Infinity): boolean {
  return Boolean(state.words[key]?.events.some((e) => NOTICED.includes(e.kind) && e.at < at));
}

/**
 * How far a word has come, as on its branch: 0 not met, 1 met (heard or read), 2 used with support (opened, put in by
 * the AI, a sample), 3 used on the learner's own. Never a score: the learner's own history.
 */
export function stageOf(state: State, key: string): 0 | 1 | 2 | 3 {
  const ev = state.words[key]?.events ?? [];
  if (ev.some((e) => e.kind === "own")) return 3;
  if (ev.some((e) => e.kind !== "met")) return 2;
  return ev.length ? 1 : 0;
}

/** When the learner was last shown this rain or scene (Infinity when never). */
export function shownAt(state: State, kind: "rain" | "scene", id: string): number {
  return lastVisit(state, kind, id) || Infinity;
}

/**
 * Words due to come back, longest waiting first: met, not yet used on the learner's own since it was last supplied,
 * and last met a while ago (RETURN_HOURS) or a few activities ago (RETURN_AFTER).
 */
export function dueKeys(state: State, now = Date.now()): string[] {
  const due: { key: string; last: number }[] = [];
  for (const log of Object.values(state.words)) {
    const ev = log.events;
    if (!ev.length) continue;
    const lastSupported = Math.max(0, ...ev.filter((e) => e.kind !== "own").map((e) => e.at));
    const lastOwn = Math.max(0, ...ev.filter((e) => e.kind === "own").map((e) => e.at));
    if (lastOwn > lastSupported) continue;
    const last = ev[ev.length - 1];
    if (now - last.at >= RETURN_HOURS * 3_600_000 || state.n - last.n >= RETURN_AFTER) due.push({ key: log.key, last: last.at });
  }
  return due.sort((a, b) => a.last - b.last).map((d) => d.key);
}

function lastVisit(state: State, kind: "rain" | "scene", id: string): number {
  for (let i = state.visits.length - 1; i >= 0; i--) if (state.visits[i].kind === kind && state.visits[i].id === id) return state.visits[i].at;
  return 0;
}

/**
 * The next rain or scene: one holding words due to come back first, then ones not met yet (in their order), then the one
 * met longest ago; never the one just shown.
 */
export function pickNext(state: State, kind: "rain" | "scene", now = Date.now(), not?: string): string {
  const ids = (kind === "rain" ? RAINS : SCENES).map((x) => x.id).filter((id) => id !== not);
  const due = new Set(dueKeys(state, now));
  const scored = ids.map((id, order) => ({ id, order, due: wordsIn({ kind, id }).filter((k) => due.has(k)).length, last: lastVisit(state, kind, id) }));
  scored.sort((a, b) => b.due - a.due || (a.last === 0 ? 0 : 1) - (b.last === 0 ? 0 : 1) || a.last - b.last || a.order - b.order);
  return scored[0]?.id ?? ids[0];
}

/** One thing the learner did on their own with a word that had come with support before. */
export type Grown = { key: string; at: number; where: Where; text?: string; before: EventKind };

/** できたこと: each use of a word on the learner's own after it first came with support, newest first. Not a score. */
export function grown(state: State): Grown[] {
  const out: Grown[] = [];
  for (const log of Object.values(state.words)) {
    let before: EventKind | null = null;
    for (const e of log.events) {
      if (e.kind === "ai" || e.kind === "borrowed" || e.kind === "remade" || e.kind === "looked") before = e.kind;
      else if (e.kind === "own" && before) out.push({ key: log.key, at: e.at, where: e.where, text: e.text, before });
    }
  }
  return out.sort((a, b) => b.at - a.at);
}

/** True when the learner sent a sample (nearly) as it was, rather than a sentence of their own. */
export function sentAsSample(input: string, samples: string[]): boolean {
  return samples.some((s) => sameness(input, s) >= 0.8);
}

/** The conversation so far, for the AI: what the learner meant (corrected) and what the person said. */
export function historyOf(thread: Thread, limit = 12): { role: "me" | "them"; text: string }[] {
  return thread.turns
    .slice(-limit)
    .map((t) => (t.role === "me" ? { role: "me" as const, text: t.result?.corrected ?? t.input } : { role: "them" as const, text: t.text }));
}

/** Keeps the record bounded: the newest threads, recent visits. */
export function bounded(state: State): State {
  const next = clone(state);
  next.threads = [...state.threads].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, THREADS_KEPT);
  next.visits = state.visits.slice(-VISITS_KEPT);
  const old = Date.now() - 180 * 86_400_000;
  next.removed = Object.fromEntries(Object.entries(state.removed).filter(([, at]) => at > old));
  return next;
}

function mergeThread(a: Thread, b: Thread): Thread {
  const turns = new Map<string, Turn>();
  for (const t of [...a.turns, ...b.turns]) {
    const had = turns.get(t.id);
    // The fuller copy of the same turn wins: one that has its correction.
    const score = (x: Turn) => (x.role === "me" ? (x.result ? 2 : 0) + (x.ask ? 1 : 0) : 1);
    if (!had || score(t) > score(had)) turns.set(t.id, t);
  }
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  return { ...newer, turns: [...turns.values()].sort((x, y) => x.at - y.at), updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}

/** Two copies of the record (this device's and the account's) made one, losing nothing either had. */
export function mergeStates(a: State, b: State): State {
  const removed = { ...a.removed };
  for (const [id, at] of Object.entries(b.removed)) removed[id] = Math.max(removed[id] ?? 0, at);

  const threads = new Map<string, Thread>();
  for (const t of [...a.threads, ...b.threads]) {
    if (removed[t.id]) continue;
    const had = threads.get(t.id);
    threads.set(t.id, had ? mergeThread(had, t) : t);
  }

  const words: Record<string, WordLog> = {};
  for (const log of [...Object.values(a.words), ...Object.values(b.words)]) {
    const had = words[log.key];
    if (!had) {
      words[log.key] = log;
      continue;
    }
    const events = new Map(had.events.map((e) => [e.id, e]));
    for (const e of log.events) events.set(e.id, e);
    words[log.key] = { ...had, events: [...events.values()].sort((x, y) => x.at - y.at).slice(-EVENTS_KEPT) };
  }

  const visits = new Map<string, Visit>();
  for (const v of [...a.visits, ...b.visits]) visits.set(`${v.at}:${v.kind}:${v.id}`, v);

  return bounded({
    v: 1,
    threads: [...threads.values()],
    words,
    visits: [...visits.values()].sort((x, y) => x.at - y.at),
    n: Math.max(a.n, b.n),
    current: a.current.at >= b.current.at ? a.current : b.current,
    removed,
  });
}
