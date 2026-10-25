// ことのえだ の画面を、映像のために描き直したもの（../src/app/globals.css と ../src/**/*.module.css）。大きさはアプリの px
// のまま。画面は CSS の拡大で大きく見せる。ひとりでには動かない：どの変化もコマで決まる（CSS のアニメーションは使わない）。
// 文と印は、アプリの中身（../src/content）とアプリの関数（markSpans・everydayOf）をそのまま使う。
import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile } from "remotion";
import { branchById, everydayOf, markSpans, nameOf, SI_MARK, wordById, type Line } from "../../src/content/index.ts";
import { C, FONT } from "./theme";

// ---- アイコン（../src/components/Icon.tsx） ----------------------------------------------------------------------

const PATHS = {
  speaker: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </>
  ),
  send: (
    <>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  up: (
    <>
      <path d="M4 19h5v-5h5V9h6" />
      <path d="M16 5l4 4-4 4" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  replay: (
    <>
      <path d="M4 12a8 8 0 1 0 2.5-5.8" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  rain: (
    <>
      <path d="M7 13.5h10a3.5 3.5 0 0 0 .2-7A5 5 0 0 0 7.7 7.6 3 3 0 0 0 7 13.5z" />
      <path d="M9 17v2.5" />
      <path d="M12 16.5v4" />
      <path d="M15 17v2.5" />
    </>
  ),
  scene: (
    <>
      <path d="M3 6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8l-3 2.5V12a2 2 0 0 1-2-2z" />
      <path d="M12 17h7" />
      <path d="M15 20h4" />
    </>
  ),
  branch: (
    <>
      <path d="M12 21V10" />
      <path d="M12 14c0-3 2.5-5 6-5.5" />
      <path d="M12 11.5C12 8.5 9.5 6.5 6 6" />
      <path d="M18 8.5c.4-2 0-3.5-1-4.5-1 1.2-1.3 2.8-1 4.3" />
      <path d="M6 6c-.6-1.8-.3-3.3.7-4.3 1 1.1 1.3 2.6 1 4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
};
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, color = "currentColor", stroke = 1.8 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
      {PATHS[name]}
    </svg>
  );
}

// ---- 小さな部品 ------------------------------------------------------------------------------------------------------

export const label: CSSProperties = { margin: 0, fontSize: 13, fontWeight: 600, color: C.muted };
export const note: CSSProperties = { margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.7 };

export const rgba = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")},${a})`;

/** 上下だけ切る（右端の輪が少しはみ出せるように）。 */
export const CLIP_Y: CSSProperties = { clipPath: "inset(0 -80px)" };

/** `p` が 0 → 1 で、高さ 0 から伸びる（下のものがなめらかに動く）。 */
export function Grow({ p, children }: { p: number; children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: `${Math.max(0, Math.min(1, p))}fr` }}>
      <div style={{ minHeight: 0, ...CLIP_Y }}>{children}</div>
    </div>
  );
}

/** 指で押したところ：輪が寄って、離れる。`t` は押してからのコマ（前なら負）。 */
export function Press({ t, x = "50%", y = "50%", size = 46 }: { t: number; x?: number | string; y?: number | string; size?: number }) {
  if (t < -8 || t > 16) return null;
  const inP = Math.min(1, (t + 8) / 8);
  const outP = t > 0 ? Math.min(1, t / 16) : 0;
  return (
    <span
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: "50%",
        background: rgba(C.ink, 0.14 * inP * (1 - outP)),
        border: `2px solid ${rgba(C.ink, 0.32 * inP * (1 - outP))}`,
        transform: `scale(${1.25 - 0.25 * inP + 0.5 * outP})`,
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}

/** ボタン（globals.css の .btn / .btn-quiet）。 */
export function Btn({ children, quiet = false, press = -99, style }: { children: ReactNode; quiet?: boolean; press?: number; style?: CSSProperties }) {
  const pressed = press >= 0 && press < 6;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: quiet ? 48 : 52,
        padding: quiet ? "0 18px" : "0 24px",
        borderRadius: 12,
        border: `1px solid ${quiet ? C.line2 : C.accent}`,
        background: quiet ? C.paper : C.accent,
        color: quiet ? C.ink : "#fff",
        fontSize: quiet ? 15 : 16,
        fontWeight: quiet ? 500 : 600,
        fontFamily: FONT.ui,
        transform: pressed ? "scale(0.97)" : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
      <Press t={press} />
    </span>
  );
}

export function Caret({ height = "1.15em" }: { height?: string }) {
  return <span style={{ display: "inline-block", width: 1.5, height, marginLeft: 1, marginRight: -2.5, verticalAlign: "-0.2em", background: C.ink }} />;
}

/** アプリの声が鳴っている間の、読み上げのボタンの輪（Speak の `playing`）。輪は 1.4 秒ごとに広がる。 */
export function playingAt(frame: number, clip: { from: number; until: number }): number {
  return frame >= clip.from && frame < clip.until ? 1 + ((frame - clip.from) % 42) / 42 : 0;
}

/** 読み上げのボタン（Speak.module.css）。`playing`：鳴っている間は 1 以上（小数の部分が輪の広がり）。 */
export function Speak({ size = 36, playing = 0 }: { size?: number; playing?: number }) {
  return (
    <span
      style={{
        position: "relative",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1px solid ${playing > 0 ? C.accent : C.line2}`,
        background: C.paper,
        color: playing > 0 ? C.accent : C.ink,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name="speaker" size={size >= 44 ? 20 : 17} />
      {playing > 0 ? (
        <span
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "50%",
            border: `1px solid ${C.accent}`,
            opacity: 0.7 * (1 - (playing % 1)),
            transform: `scale(${1 + 0.7 * (playing % 1)})`,
          }}
        />
      ) : null}
    </span>
  );
}

/** アイコンと、明朝の ことのえだ（Logo.module.css の sm）。 */
export function Logo({ size = 28, word = 17 }: { size?: number; word?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Img src={staticFile("app/icon.png")} style={{ width: size, height: size, borderRadius: "22%" }} />
      <span style={{ fontFamily: FONT.mincho, fontWeight: 700, fontSize: word, letterSpacing: "0.06em", lineHeight: 1.2 }}>ことのえだ</span>
    </span>
  );
}

// ---- 韓国語の文（../src/components/Ko.tsx と globals.css の .lit など） --------------------------------------------

/**
 * 文の中の印：上の語（アクセント、前に出会った語は紫）、ふつうの -시-、ふだんの語。`ruby`：上に添える ふだんの語。
 * `style`：その語だけの動き（上げてみる で一段上がる）。`press`：その語を押してからのコマ（指の輪が出る）。
 */
export type Mark = { start: number; end: number; word: string; kind: "raised" | "si" | "base"; again?: boolean; ruby?: string | null; style?: CSSProperties; press?: number };
/** 直したところ：足した字（下線）、消した字（取り消し線）。 */
export type Diff = { start: number; end: number; kind: "ins" | "del" };

const LIT: Record<"raised" | "again" | "si" | "base", CSSProperties> = {
  raised: { background: C.tint, color: C.accent, borderRadius: "0.15em", padding: "0 0.1em", margin: "0 -0.1em" },
  again: { background: C.againTint, color: C.again, borderRadius: "0.15em", padding: "0 0.1em", margin: "0 -0.1em" },
  si: { textDecorationLine: "underline", textDecorationColor: C.line2, textDecorationThickness: 1.5, textUnderlineOffset: "0.32em" },
  base: { textDecorationLine: "underline", textDecorationStyle: "dotted", textDecorationColor: C.faint, textDecorationThickness: 1.5, textUnderlineOffset: "0.32em" },
};
const RT_COLOR = { raised: rgba(C.accent, 0.75), again: rgba(C.again, 0.75), si: C.faint, base: C.muted };
const INS: CSSProperties = { color: C.accent, fontWeight: 600, textDecorationLine: "underline", textDecorationThickness: 2, textUnderlineOffset: "0.3em" };
const DEL: CSSProperties = { color: C.faint, textDecorationLine: "line-through", textDecorationThickness: 1.5 };

/** 印の付いた韓国語の文。範囲は `text` の中の位置（UTF-16）。印どうしは重ならない。直したところは印をまたいでよい。 */
export function Ko({ text, marks = [], diff = [], ruby = true }: { text: string; marks?: Mark[]; diff?: Diff[]; ruby?: boolean }) {
  const valid = marks.filter((m) => m.start >= 0 && m.end <= text.length && m.start < m.end).sort((a, b) => a.start - b.start);
  // 印の中の足した字は、その語の色のまま（前に出会った語は紫のまま）。下線で替わったことを示す（globals.css）。
  const pieces = (from: number, to: number, key: string, inMark = false): ReactNode[] => {
    const cuts = new Set([from, to]);
    for (const d of diff) {
      if (d.start > from && d.start < to) cuts.add(d.start);
      if (d.end > from && d.end < to) cuts.add(d.end);
    }
    const points = [...cuts].sort((a, b) => a - b);
    const out: ReactNode[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const s = points[i];
      const e = points[i + 1];
      const change = diff.find((d) => d.start <= s && d.end >= e);
      out.push(
        <span key={`${key}${s}`} style={change ? (change.kind === "ins" ? (inMark ? { ...INS, color: "inherit" } : INS) : DEL) : undefined}>
          {text.slice(s, e)}
        </span>,
      );
    }
    return out;
  };
  const out: ReactNode[] = [];
  let at = 0;
  for (const m of valid) {
    if (m.start < at) continue;
    if (m.start > at) out.push(...pieces(at, m.start, "t"));
    const look = m.kind === "raised" && m.again ? "again" : m.kind;
    const inner = pieces(m.start, m.end, `m${m.start}-`, true);
    // 動く語と押す語だけ inline-block（アプリの .rise と同じ）。ほかはまわりの字と同じように折り返す。
    const moving = m.style !== undefined || m.press !== undefined;
    out.push(
      <span key={`m${m.start}`} style={{ ...(moving ? { display: "inline-block", position: "relative" } : null), ...LIT[look], ...m.style }}>
        {ruby && m.ruby ? (
          <ruby style={{ rubyPosition: "over" }}>
            {inner}
            <rt style={{ fontFamily: FONT.ko, fontSize: "0.5em", fontWeight: 500, lineHeight: 1.1, letterSpacing: 0, color: RT_COLOR[look] }}>{m.ruby}</rt>
          </ruby>
        ) : (
          inner
        )}
        {m.press !== undefined ? <Press t={m.press} size={40} /> : null}
      </span>,
    );
    at = m.end;
  }
  if (at < text.length) out.push(...pieces(at, text.length, "t"));
  return <>{out}</>;
}

/** アプリの印の付け方（../src/app/app/_parts/marks.ts の lineMarks）。`again`：前に出会った上の語（紫）。 */
export function lineMarks(line: { ko: string; marks?: Line["marks"] }, again: string[] = []): Mark[] {
  return markSpans(line).map((s) => {
    const kind = s.word === SI_MARK ? "si" : (wordById(s.word)?.height ?? 0) > 0 ? "raised" : "base";
    return { start: s.start, end: s.end, word: s.word, kind, again: kind === "raised" && again.includes(s.word), ruby: kind === "base" ? null : everydayOf(s, line.ko) };
  });
}

/** AI が書いた文（直した文・返事）の上の語。 */
export function litMarks(text: string, words: { word: string; start: number; end: number }[], again: string[] = []): Mark[] {
  return words.map((w) => ({ ...w, kind: "raised" as const, again: again.includes(w.word), ruby: everydayOf(w, text) }));
}

/** 誰が誰に、話の中の人がいればその人のこと（line.module.css の .who）。 */
export function WhoLine({ line }: { line: Line }) {
  return (
    <p style={{ margin: 0, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 8px", fontSize: 12.5, fontWeight: 600, color: C.muted }}>
      <span>
        {nameOf(line.by)} → {nameOf(line.to)}
      </span>
      {line.about ? <span style={{ fontWeight: 500, color: C.faint }}>{line.about}のこと</span> : null}
    </p>
  );
}

/** 用意した一文（LineView）：誰が誰に、印の付いた文、読み上げ、訳。 */
export function LineView({
  line,
  marks,
  diff,
  size = 20,
  showJa = false,
  who = true,
  playing = 0,
}: {
  line: Line;
  marks?: Mark[];
  diff?: Diff[];
  size?: number;
  showJa?: boolean;
  who?: boolean;
  playing?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {who ? <WhoLine line={line} /> : null}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <p style={{ flex: 1, minWidth: 0, margin: 0, fontFamily: FONT.ko, fontSize: size, lineHeight: 2.05, wordBreak: "keep-all" }}>
          <Ko text={line.ko} marks={marks ?? lineMarks(line)} diff={diff} />
        </p>
        <Speak playing={playing} />
      </div>
      {showJa ? (
        <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{line.ja}</p>
      ) : (
        <span style={{ alignSelf: "flex-start", padding: "2px 0", color: C.muted, fontSize: 13, textDecorationLine: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "0.3em" }}>
          訳
        </span>
      )}
    </div>
  );
}

// ---- 画面の枠（page.module.css） -----------------------------------------------------------------------------------

/** 上のバー。 */
export function Bar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 60, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
      <h1 style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.4 }}>{title}</h1>
      {right}
    </header>
  );
}

/** 浴びる の段（_rain/Steps.tsx）：済んだ段はチェック、いまの段は光る。 */
export function StepsTrack({ current }: { current: 0 | 1 | 2 }) {
  const steps: [IconName, string][] = [
    ["rain", "浴びる"],
    ["up", "上げてみる"],
    ["scene", "場面で言う"],
  ];
  return (
    <ol style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", margin: 0, padding: "4px 0 16px", listStyle: "none", borderBottom: `1px solid ${C.line}` }}>
      {steps.map(([icon, name], i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        return (
          <li key={name} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {i > 0 ? (
              <span style={{ position: "absolute", top: 19, right: "50%", width: "100%", height: 2, background: state === "next" ? C.line2 : C.accent }} />
            ) : null}
            <span
              style={{
                position: "relative",
                zIndex: 1,
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${state === "next" ? C.line2 : C.accent}`,
                background: state === "done" ? C.accent : state === "now" ? C.tint : C.paper,
                color: state === "done" ? "#fff" : state === "now" ? C.accent : C.faint,
                outline: state === "now" ? `4px solid ${C.tint}` : undefined,
                outlineOffset: 2,
              }}
            >
              <Icon name={state === "done" ? "check" : icon} size={20} />
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 4, fontSize: 12, lineHeight: 1.3, whiteSpace: "nowrap", color: state === "now" ? C.accent : state === "done" ? C.ink2 : C.faint, fontWeight: state === "now" ? 600 : 400 }}>
              <span style={{ fontSize: 11 }}>{i + 1}</span>
              {name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---- 枝（_parts/Ladder.tsx、ladder.module.css） --------------------------------------------------------------------

const chip = (base: boolean, again = false): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 34,
  padding: "0 11px",
  border: `1px ${base ? "dashed" : "solid"} ${again ? C.againTint : C.line2}`,
  borderRadius: 999,
  background: again ? C.againTint : C.paper,
  fontFamily: FONT.ko,
  fontSize: 15,
  fontWeight: base ? 500 : 600,
  color: base ? C.ink2 : again ? C.again : C.accent,
});

/** 枝の上の語を、低い段から（Ladder.tsx の levels を下から）：먹다 → [[드시다], [잡수시다]]。 */
export function limbsOf(branchId: string): { base: string; limbs: string[][] } {
  const b = branchById(branchId);
  if (!b) throw new Error(`no branch ${branchId}`);
  const words = b.limbs.map((id) => wordById(id)!);
  return { base: b.base, limbs: [1, 2].map((h) => words.filter((w) => w.height === h).map((w) => w.id)).filter((row) => row.length) };
}

/** 枝を一行で、ふだんの語から上へ：먹다 › 드시다 › 잡수시다。 */
export function BranchRow({ base, limbs, style }: { base: string; limbs: string[][]; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, ...style }}>
      <span style={chip(true)}>{base}</span>
      {limbs.map((level, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: C.faint, fontSize: 15, padding: "0 2px" }}>›</span>
          {level.map((w, k) => (
            <span key={w} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {k > 0 ? <span style={{ color: C.faint, fontSize: 13 }}>／</span> : null}
              <span style={chip(false)}>{w}</span>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

/** 枝を段で：ふだんの語がいちばん下、上の語ほど一段ずつ上と右に。`grow`：下の段から順に現れる度合い。 */
export function BranchSteps({ rows, current, grow }: { rows: { word: string; height: number }[]; current: string; grow: number[] }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((r, i) => {
        const w = wordById(r.word)!;
        // rows は上から。現れるのは下から（ふだんの語が先）。
        const g = grow[rows.length - 1 - i] ?? 1;
        return (
          <li
            key={r.word}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              padding: `8px 0 8px ${r.height * 28}px`,
              borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : undefined,
              opacity: g,
              transform: `translateY(${(1 - g) * 10}px)`,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                minHeight: 36,
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                border: `1px solid ${r.word === current ? C.accent : C.line2}`,
                borderRadius: 999,
                background: r.word === current ? C.tint : C.paper,
                color: r.word === current ? C.accent : C.ink,
                fontFamily: FONT.ko,
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              {r.word}
            </span>
            <span style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 8px", fontSize: 14, color: C.ink2, lineHeight: 1.5 }}>
              <span>{w.ja}</span>
              {w.who ? <span style={{ fontSize: 12.5, color: C.muted }}>{w.who}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---- 場面で言う（scene.module.css、conversation.module.css、composer.module.css） --------------------------------

export const tag = (good = false): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  minHeight: 22,
  padding: "0 8px",
  borderRadius: 999,
  border: `1px solid ${good ? C.tint : C.line2}`,
  background: good ? C.tint : C.paper,
  fontSize: 12,
  fontWeight: 500,
  color: good ? C.accent : C.muted,
});

/** 打つ欄と、声で言う・送るのボタン。 */
export function Composer({ text, caret, send = -99 }: { text: string; caret: boolean; send?: number }) {
  const circle: CSSProperties = { position: "relative", flexShrink: 0, width: 48, height: 48, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" };
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 12px", borderTop: `1px solid ${C.line}`, background: C.paper }}>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 48,
          padding: "12px 14px",
          border: `1.5px solid ${C.ink}`,
          borderRadius: 12,
          background: C.paper,
          fontSize: 16,
          lineHeight: 1.5,
          fontFamily: FONT.ui,
        }}
      >
        {text ? (
          <span>
            {text}
            {caret ? <Caret /> : null}
          </span>
        ) : (
          <span style={{ position: "relative" }}>
            {caret ? <Caret /> : null}
            <span style={{ color: C.faint, fontSize: 14 }}>言いたいことを。韓国語が出てこないところは日本語のままで。</span>
          </span>
        )}
      </span>
      <span style={{ ...circle, border: `1px solid ${C.line2}`, background: C.paper, color: C.ink }}>
        <Icon name="mic" size={20} />
      </span>
      <span style={{ ...circle, border: `1px solid ${C.accent}`, background: C.accent, color: "#fff", opacity: text ? 1 : 0.4 }}>
        <Icon name="send" size={20} />
        <Press t={send} />
      </span>
    </div>
  );
}

/** 相手の返事（ThemView）。 */
export function ThemBubble({ who, text, ja, marks = [], playing = 0 }: { who: string; text: string; ja?: string; marks?: Mark[]; playing?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.muted }}>{who}</p>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <p style={{ flex: 1, minWidth: 0, margin: 0, fontFamily: FONT.ko, fontSize: 18, lineHeight: 2, wordBreak: "keep-all" }}>
          <Ko text={text} marks={marks} />
        </p>
        <Speak playing={playing} />
      </div>
      {ja ? <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{ja}</p> : null}
    </div>
  );
}

/** わたしの文と、その直し（MeView）：打った文（消したところに線）、直した文（足したところに下線、上の語に印）。 */
export function MeBubble({
  input,
  corrected,
  marks,
  natural,
  removed,
  added,
  more,
  shown = 1,
  children,
}: {
  input: string;
  corrected?: string;
  marks?: Mark[];
  natural?: boolean;
  removed?: Diff[];
  added?: Diff[];
  more?: string;
  /** 直した文が現れる度合い（0 のあいだは、打った文だけ）。 */
  shown?: number;
  children?: ReactNode;
}) {
  return (
    <div style={{ marginLeft: 24, padding: "12px 14px", borderRadius: 12, background: C.surface, display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ margin: 0, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, fontSize: 13, fontWeight: 600, color: C.muted }}>
        わたし
        {natural && shown > 0 ? <span style={{ ...tag(true), opacity: shown }}>そのままで自然</span> : null}
      </p>
      {natural && shown > 0 ? null : (
        <p style={{ margin: 0, fontFamily: FONT.ko, fontSize: 15, lineHeight: 1.7, color: C.muted }}>
          <Ko text={input} diff={shown > 0 ? removed : []} />
        </p>
      )}
      {corrected && shown > 0 ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, opacity: shown, transform: `translateY(${(1 - shown) * 8}px)` }}>
          <p style={{ flex: 1, minWidth: 0, margin: 0, fontFamily: FONT.ko, fontSize: 19, lineHeight: 2.05, wordBreak: "keep-all" }}>
            <Ko text={corrected} marks={marks} diff={added} />
          </p>
          <Speak />
        </div>
      ) : null}
      {more && shown > 0 ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 32, fontSize: 13, color: C.accent, opacity: shown }}>
          {more}
          <Icon name="arrow" size={14} />
        </span>
      ) : null}
      {children}
    </div>
  );
}

/** 待っているあいだの三つの点。 */
export function Dots({ frame }: { frame: number }) {
  return (
    <div style={{ marginLeft: 24, padding: 14, display: "inline-flex", gap: 6 }}>
      {[0, 1, 2].map((i) => {
        const t = ((frame + i * 4) % 36) / 36;
        const k = Math.sin(t * Math.PI);
        return <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.faint, opacity: 0.4 + 0.6 * k, transform: `translateY(${4 * k}px)` }} />;
      })}
    </div>
  );
}
