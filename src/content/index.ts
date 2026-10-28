import { BRANCHES, GROUPS, SI_CORE, SI_MARK, WORDS } from "./branches.ts";
import { fallbackOf, LADDER, ME_STYLE, ME_VOICES, roleOf, paceOf, PEOPLE, PLACES, styleOf, VOICES, voiceOf } from "./cast.ts";
import { RAINS } from "./rains.ts";
import { SCENES } from "./scenes.ts";
import type { Branch, Line, Mark, Rain, Scene, Word } from "./types.ts";

export { BRANCHES, fallbackOf, GROUPS, LADDER, ME_STYLE, ME_VOICES, roleOf, paceOf, PEOPLE, PLACES, RAINS, SCENES, SI_CORE, SI_MARK, styleOf, VOICES, voiceOf, WORDS };
export type * from "./types.ts";
export type { MeVoice } from "./cast.ts";

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));
const WORD = byId(WORDS);
const BRANCH = byId(BRANCHES);
const RAIN = byId(RAINS);
const SCENE = byId(SCENES);

export const wordById = (id: string): Word | undefined => WORD.get(id);
export const branchById = (id: string): Branch | undefined => BRANCH.get(id);
export const rainById = (id: string): Rain | undefined => RAIN.get(id);
export const sceneById = (id: string): Scene | undefined => SCENE.get(id);

/** The raised words (height 1 and 2): what the record follows and what comes back. */
export const RAISED: Word[] = WORDS.filter((w) => w.height > 0);
export const isRaised = (id: string): boolean => (WORD.get(id)?.height ?? 0) > 0;

/** The branches a word sits on, as their everyday word or above it. */
export function branchesOf(wordId: string): Branch[] {
  return BRANCHES.filter((b) => b.base === wordId || b.limbs.includes(wordId));
}

/** A word lit in a sentence. `base` is the everyday word to show above it, when it differs from the word's own. */
export type Span = { word: string; start: number; end: number; base?: string };

const global = (core: RegExp) => new RegExp(core.source, core.flags.includes("g") ? core.flags : `${core.flags}g`);

export function coreOf(word: string): RegExp | null {
  return word === SI_MARK ? SI_CORE : (WORD.get(word)?.core ?? null);
}

/** Where a word's `core` fires in a text, as ranges. */
export function hits(text: string, word: string): { start: number; end: number }[] {
  const core = coreOf(word);
  if (!core) return [];
  return [...text.matchAll(global(core))].map((m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length }));
}

/**
 * Where a line's marks are: each at the first place its text occurs that the word's `core` also finds and no earlier
 * mark holds (교수님께 after 어머니께서: the 께 of 께서 is not 께). A mark that cannot be placed is left out (the content
 * test fails on it).
 */
export function markSpans(line: { ko: string; marks?: Mark[] }): Span[] {
  const out: Span[] = [];
  for (const mark of line.marks ?? []) {
    const found = hits(line.ko, mark.word);
    let from = 0;
    for (;;) {
      const start = line.ko.indexOf(mark.text, from);
      if (start === -1) break;
      const end = start + mark.text.length;
      const free = !out.some((s) => s.start < end && s.end > start);
      if (free && found.some((h) => h.start < end && h.end > start)) {
        out.push(mark.base ? { word: mark.word, start, end, base: mark.base } : { word: mark.word, start, end });
        break;
      }
      from = start + 1;
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

// わたし stepping down: the everyday form of the text itself (제가 → 내가, 저는 → 나는).
const SELF: Record<string, (text: string) => string> = {
  저: (t) => t.replace(/^제가/, "내가").replace(/^저/, "나"),
  제: () => "내",
  저희: () => "우리",
};

// 드시다 stands for 먹다 or 마시다. A word the AI lit has no mark to say which: with a drink just before it (따뜻한 커피
// 드신대요) it is 마시다.
const DRINK = /(?:커피|차|물|술|약주|주스|우유|음료|음료수|맥주|와인|소주|막걸리|라떼|아메리카노|녹차|홍차)\s?(?:를|을|는|은|도|만|좀|한\s?잔|두\s?잔)?\s*$/;

/** The everyday word shown above a lit word: its mark's own, or the word's first everyday word. */
export function everydayOf(span: Span, text: string): string | null {
  if (span.base) return span.base;
  const self = SELF[span.word];
  if (self) return self(text.slice(span.start, span.end));
  if (span.word === "드시다" && DRINK.test(text.slice(0, span.start))) return "마시다";
  return WORD.get(span.word)?.base?.[0] ?? null;
}

/** The raised words a line holds, each once. */
export function raisedIn(line: { marks?: Mark[] }): string[] {
  return [...new Set((line.marks ?? []).map((m) => m.word).filter(isRaised))];
}

/** A scene's samples as lines, so each has its own audio (said by わたし to the person). */
export function sampleLines(scene: Scene): Line[] {
  return scene.samples.map((s, i) => ({ id: `${scene.id}.s${i + 1}`, by: "me", to: scene.line.by, ko: s.ko, ja: s.ja, marks: s.marks }));
}

/** Every line of a rain, its climbs included. */
export function rainLines(rain: Rain): Line[] {
  return [...rain.lines, ...rain.climbs.flatMap((c) => c.steps.flatMap((s) => (s.reply ? [s.said, s.reply] : [s.said])))];
}

/** Every line that has a voice: the audio script makes a clip for each, and the app plays them by id. */
export function allLines(): Line[] {
  return [...RAINS.flatMap(rainLines), ...SCENES.flatMap((s) => [s.line, ...sampleLines(s)])];
}

export type Place = { kind: "rain" | "scene"; id: string; title: string };

/** The raised words of a rain (its climbs too) or of a scene (its samples too). */
export function wordsIn(place: { kind: "rain" | "scene"; id: string }): string[] {
  const lines =
    place.kind === "rain"
      ? (() => {
          const r = rainById(place.id);
          return r ? rainLines(r) : [];
        })()
      : (() => {
          const s = sceneById(place.id);
          return s ? [s.line, ...sampleLines(s)] : [];
        })();
  return [...new Set(lines.flatMap(raisedIn))];
}

/**
 * The scene a rain leads into (浴びる → 上げてみる → 場面で言う is one set): the one holding most of its raised words, the
 * first of them on a tie. Every rain has one (the content test).
 */
export function sceneOf(rainId: string): string | null {
  const words = wordsIn({ kind: "rain", id: rainId });
  const best = SCENES.map((s) => ({ id: s.id, n: wordsIn({ kind: "scene", id: s.id }).filter((w) => words.includes(w)).length })).sort((a, b) => b.n - a.n)[0];
  return best && best.n > 0 ? best.id : null;
}

/** Lines a word turns up in, rains first, then scenes: to hear it again from its branch. */
export function linesWith(wordId: string, limit = 8): (Line & { place: Place })[] {
  const out: (Line & { place: Place })[] = [];
  const has = (l: Line) => Boolean(l.marks?.some((m) => m.word === wordId));
  for (const r of RAINS) for (const l of rainLines(r)) if (has(l)) out.push({ ...l, place: { kind: "rain", id: r.id, title: r.title } });
  for (const s of SCENES) for (const l of [s.line, ...sampleLines(s)]) if (has(l)) out.push({ ...l, place: { kind: "scene", id: s.id, title: s.title } });
  // One line per text: a climb's step and a rain's line are often the same sentence.
  const seen = new Set<string>();
  return out.filter((l) => !seen.has(l.ko) && seen.add(l.ko)).slice(0, limit);
}

/** The rain a word belongs to (the one holding its branch), to go and bathe in it. */
export function rainOf(wordId: string): Rain | undefined {
  const branches = branchesOf(wordId).map((b) => b.id);
  return RAINS.find((r) => r.branches.some((b) => branches.includes(b))) ?? RAINS.find((r) => wordsIn({ kind: "rain", id: r.id }).includes(wordId));
}
