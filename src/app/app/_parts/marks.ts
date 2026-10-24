import { everydayOf, markSpans, SI_MARK, wordById, type Mark } from "@/content/index.ts";
import type { KoMark } from "@/components/Ko";
import { metBefore, type Lit, type State } from "@/lib/record";

/** The kind of light a word gets: a raised word, the plain -시-, or an everyday word. */
function kindOf(word: string): KoMark["kind"] {
  if (word === SI_MARK) return "si";
  return (wordById(word)?.height ?? 0) > 0 ? "raised" : "base";
}

/**
 * A prepared line's words, lit: raised words in the accent, or the again violet when the learner met them before
 * `since` (when this rain or scene was last shown), each with the everyday word above it.
 */
export function lineMarks(line: { ko: string; marks?: Mark[] }, state: State | null, since = Infinity): KoMark[] {
  return markSpans(line).map((s) => {
    const kind = kindOf(s.word);
    return {
      start: s.start,
      end: s.end,
      word: s.word,
      kind,
      again: kind === "raised" && state ? metBefore(state, s.word, since) : false,
      ruby: kind === "base" ? null : everydayOf(s, line.ko),
    };
  });
}

/** The raised words of a sentence the AI wrote (a correction, a reply), lit the same way. */
export function litMarks(text: string, lits: Lit[], state: State | null, since = Infinity): KoMark[] {
  return lits.map((l) => ({
    start: l.start,
    end: l.end,
    word: l.word,
    kind: "raised",
    again: state ? metBefore(state, l.word, since) : false,
    ruby: everydayOf({ word: l.word, start: l.start, end: l.end }, text),
  }));
}
