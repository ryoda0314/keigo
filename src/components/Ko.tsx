import type { ReactNode } from "react";

/**
 * A word lit in a Korean sentence. raised: a raised word (in the accent, or the again violet when met before);
 * si: the plain -시- of a verb; base: an everyday word, set against the raised ones. `ruby` is the everyday word shown
 * above it (먹다 over 드셨); `rise` makes it come up a step (上げてみる).
 */
export type KoMark = { start: number; end: number; word: string; kind: "raised" | "si" | "base"; again?: boolean; ruby?: string | null; rise?: boolean };
/** A correction's change: words added (underlined) or removed (struck through). */
export type KoDiff = { start: number; end: number; kind: "ins" | "del" };

const MARK_CLASS = { raised: "lit", si: "lit-si", base: "lit-base" } as const;

/**
 * A Korean sentence with its words lit and, above each raised word, the everyday word it stands for. Ranges are UTF-16
 * offsets into `text`; marks do not overlap each other, changes may cross them. With `onWord`, a raised word can be
 * pressed to open its branch.
 */
export function Ko({
  text,
  marks = [],
  diff = [],
  ruby = true,
  onWord,
}: {
  text: string;
  marks?: KoMark[];
  diff?: KoDiff[];
  ruby?: boolean;
  onWord?: (word: string) => void;
}) {
  const valid = marks.filter((m) => m.start >= 0 && m.end <= text.length && m.start < m.end).sort((a, b) => a.start - b.start);
  const changes = diff.filter((d) => d.start >= 0 && d.end <= text.length && d.start < d.end);

  // A stretch of text cut where a change starts or ends, each piece with the change it is in.
  const pieces = (from: number, to: number, key: string): ReactNode[] => {
    const cuts = new Set([from, to]);
    for (const d of changes) {
      if (d.start > from && d.start < to) cuts.add(d.start);
      if (d.end > from && d.end < to) cuts.add(d.end);
    }
    const points = [...cuts].sort((a, b) => a - b);
    const out: ReactNode[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const s = points[i];
      const e = points[i + 1];
      const change = changes.find((d) => d.start <= s && d.end >= e);
      const piece = text.slice(s, e);
      if (!change) out.push(<span key={`${key}${s}`}>{piece}</span>);
      else if (change.kind === "del") out.push(<del key={`${key}${s}`} className="hl-del">{piece}</del>);
      else out.push(<ins key={`${key}${s}`} className="hl-ins">{piece}</ins>);
    }
    return out;
  };

  const out: ReactNode[] = [];
  let at = 0;
  for (const m of valid) {
    if (m.start < at) continue;
    if (m.start > at) out.push(...pieces(at, m.start, "t"));
    const inner = pieces(m.start, m.end, `m${m.start}-`);
    const classes = [m.kind === "raised" && m.again ? "lit-again" : MARK_CLASS[m.kind], m.rise ? "rise" : ""].filter(Boolean).join(" ");
    const body =
      ruby && m.ruby ? (
        <ruby>
          {inner}
          <rt>{m.ruby}</rt>
        </ruby>
      ) : (
        inner
      );
    if (m.kind === "raised" && onWord) {
      // A span, not a <button>: a lit word that runs onto the next line has to wrap like the words around it.
      out.push(
        <span
          key={`m${m.start}`}
          role="button"
          tabIndex={0}
          className={`${classes} lit-button`}
          onClick={() => onWord(m.word)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onWord(m.word);
            }
          }}
        >
          {body}
        </span>,
      );
    } else {
      out.push(
        <span key={`m${m.start}`} className={classes}>
          {body}
        </span>,
      );
    }
    at = m.end;
  }
  if (at < text.length) out.push(...pieces(at, text.length, "t"));
  return <>{out}</>;
}
