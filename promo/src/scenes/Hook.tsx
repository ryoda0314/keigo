// A. 友だちとの반말なら話せる（わたし → 친구「잘 자.」）。目上の人の前だと、言葉が出てこない（할머니 に「할머니, 잘」まで打って
// 止まる）。同じ「おやすみ」が、相手が上がると語ごと替わる：上げてみる の「おやすみ」（sleep-a）の三段を、下から一段ずつ、
// アプリの声で。いちばん上の 주무세요 に色が付き、上に ふだんの語 자다。足りないのは語尾ではなく語：枝が並ぶ。
import type { CSSProperties, ReactNode } from "react";
import { fall, leave, mixColor, prog, rise, typedAt } from "../anim";
import { clipAt, T, TYPE_STUCK } from "../timeline";
import { C, FONT } from "../theme";
import { BranchRow, Caret, limbsOf, playingAt, rgba, Speak } from "../ui";

const big: CSSProperties = { margin: 0, fontSize: 60, fontWeight: 600, lineHeight: 1.45, letterSpacing: "0.01em", fontFamily: FONT.ja, textAlign: "center" };
const ko = (text: string) => <span style={{ fontFamily: FONT.ko }}>{text}</span>;
const who: CSSProperties = { margin: 0, fontSize: 26, fontWeight: 600, color: C.muted, fontFamily: FONT.ja };
/** ふだんの語の印（globals.css の .lit-base）。 */
const based: CSSProperties = { textDecorationLine: "underline", textDecorationStyle: "dotted", textDecorationColor: C.faint, textDecorationThickness: 3, textUnderlineOffset: "0.3em" };

/** 枝の並び：左と右に四つずつ（アプリの中身の枝のまま）。 */
const BRANCH_COLUMNS = [
  ["먹다", "자다", "있다", "주다"],
  ["밥", "말", "집", "이름"],
];

export function Hook({ frame }: { frame: number }) {
  const t = T.hook;
  const out = (at: number, dur = 10, dist = 12) => (frame >= at ? leave(frame, at, dur, dist) : {});
  return (
    <>
      {/* 友だちとの반말なら：最初のコマから見えている */}
      <p style={{ ...big, position: "absolute", top: 230, left: 0, right: 0, ...out(t.stuck) }}>友だちとの{ko("반말")}なら、話せる。</p>
      <Card style={{ top: 480, ...out(t.stuck, 12, 16) }}>
        <p style={who}>わたし → 친구</p>
        <p style={{ margin: 0, fontFamily: FONT.ko, fontSize: 84, lineHeight: 1.55 }}>
          잘 <span style={based}>자</span>.
        </p>
      </Card>

      {/* でも、目上の人の前だと：할머니 に言いかけて、止まる */}
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, ...(frame >= t.ladder ? leave(frame, t.ladder, 10, 12) : fall(frame, t.stuck + 6, 16, 16)) }}>
        <p style={big}>でも、目上の人の前だと、</p>
        <p style={big}>言葉が出てこない。</p>
      </div>
      <Stuck frame={frame} />

      {/* 段：잘 자. → 선배, 잘 자요. → 할머니, 안녕히 주무세요. */}
      {/* 段がせり上がるあいだに一行目、いちばん上に色が付いたら二行目 */}
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, ...out(t.words) }}>
        <p style={{ ...big, ...fall(frame, t.ladder + 6, 16, 16) }}>同じひとことでも、</p>
        <p style={{ ...big, ...fall(frame, t.lit + 4, 16, 16) }}>相手が上がると、言葉ごと替わる。</p>
      </div>
      <Ladder frame={frame} />

      {/* 足りないのは、語尾ではなく、語 */}
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, ...fall(frame, t.words + 6, 16, 16) }}>
        <p style={big}>足りないのは、</p>
        <p style={big}>
          語尾ではなく、<span style={{ color: C.accent }}>語</span>。
        </p>
      </div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 110 }}>
        {BRANCH_COLUMNS.map((col, c) => (
          <div key={c} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {col.map((id, i) => {
              const { base, limbs } = limbsOf(id);
              return (
                <div key={id} style={{ zoom: 2, ...rise(frame, t.words + 14 + (c * 4 + i) * 3, 6, 14) }}>
                  <BranchRow base={base} limbs={limbs} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

function Card({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, display: "flex", justifyContent: "center", ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "34px 56px 30px", border: `1.5px solid ${C.line2}`, borderRadius: 26, background: C.paper }}>{children}</div>
    </div>
  );
}

function Stuck({ frame }: { frame: number }) {
  const t = T.hook;
  if (frame < t.stuck || frame > t.ladder + 14) return null;
  const text = typedAt(TYPE_STUCK, frame - t.type);
  const typing = frame >= t.type && frame < t.type + TYPE_STUCK.duration;
  // 打ち終わってからは、点滅したまま止まる。
  const caret = typing || Math.floor((frame - t.stuck) / 16) % 2 === 0;
  const style = frame >= t.ladder ? leave(frame, t.ladder, 12, 16) : fall(frame, t.stuck + 6, 18, 16);
  return (
    <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={who}>わたし → 할머니</p>
        <div style={{ width: 860, minHeight: 150, padding: "26px 40px", border: `2.5px solid ${C.ink}`, borderRadius: 22, background: C.paper, fontFamily: FONT.ko, fontSize: 72, lineHeight: 1.35 }}>
          {text}
          {caret ? <Caret /> : null}
        </div>
      </div>
    </div>
  );
}

/** 上げてみる の「おやすみ」：下の段から一つずつ、ひとつ上がるごとに右へ。 */
const RUNGS: { person: string; at: (t: typeof T.hook) => number; clip: "sleep-a.1@f" | "sleep-a.2@f" | "sleep-a.3@f"; text: ReactNode }[] = [
  { person: "친구", at: (t) => t.r1, clip: "sleep-a.1@f", text: <>잘 <span style={based}>자</span>.</> },
  { person: "선배", at: (t) => t.r2, clip: "sleep-a.2@f", text: <>선배, 잘 <span style={based}>자요</span>.</> },
  { person: "할머니", at: (t) => t.r3, clip: "sleep-a.3@f", text: null },
];

function Ladder({ frame }: { frame: number }) {
  const t = T.hook;
  if (frame < t.ladder || frame > t.words + 14) return null;
  const lit = prog(frame, t.lit, 14);
  const gone = frame >= t.words ? leave(frame, t.words, 12, 16) : {};
  return (
    <div style={{ position: "absolute", inset: 0, ...gone }}>
      {RUNGS.map((r, i) => {
        const at = r.at(t);
        const here = i === RUNGS.length - 1 ? lit : 0;
        return (
          <div key={r.person} style={{ position: "absolute", top: 790 - i * 175, left: 300 + i * 150, display: "flex", alignItems: "center", gap: 30, ...rise(frame, at, 26, 14) }}>
            <span
              style={{
                minHeight: 64,
                padding: "0 26px",
                display: "inline-flex",
                alignItems: "center",
                border: `2px solid ${mixColor(C.line2, C.accent, here)}`,
                borderRadius: 999,
                background: mixColor(C.paper, C.tint, here),
                color: mixColor(C.ink2, C.accent, here),
                fontSize: 28,
                fontWeight: 600,
                fontFamily: FONT.ja,
                whiteSpace: "nowrap",
              }}
            >
              {r.person}
            </span>
            <p style={{ margin: 0, fontFamily: FONT.ko, fontSize: 64, lineHeight: 2.05, whiteSpace: "nowrap" }}>
              {r.text ?? (
                <>
                  할머니, 안녕히{" "}
                  <span
                    style={{
                      background: rgba(C.tint, lit),
                      color: mixColor(C.ink, C.accent, lit),
                      borderRadius: "0.15em",
                      padding: "0 0.1em",
                      margin: "0 -0.1em",
                    }}
                  >
                    <ruby style={{ rubyPosition: "over" }}>
                      주무세요
                      <rt style={{ fontFamily: FONT.ko, fontSize: "0.5em", fontWeight: 500, lineHeight: 1.1, color: rgba(C.accent, 0.75 * lit) }}>자다</rt>
                    </ruby>
                  </span>
                  .
                </>
              )}
            </p>
            <span style={{ zoom: 1.6 }}>
              <Speak playing={playingAt(frame, clipAt(r.clip))} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
