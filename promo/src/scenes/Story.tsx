// C–F. 覚え方が、そのままアプリの流れになっていることを、アプリの画面で。左に映像の言葉。
//   浴びる：食べる・飲む の雨。文が一つずつ降ってくる（eat.1〜eat.7、アプリの並びのまま）。서준 の「우리 할머니는 아침을 꼭
//     드셔.」：반말でも、話の中のおばあさんは上げる。드셔 を押すと 드시다 の枝：먹다 › 드시다 › 잡수시다 が下から一段ずつ。
//   上げてみる：ご飯、食べた？ を 서준 → 지은 선배 → 박 교수님 → 할머니 と上げる。替わった字に下線、上の語は一段上がる。
//   場面で言う：下宿の夕飯。할머니 밥 먹었어요? 나는 友だちと食べてきた。→ 할머니, 진지 드셨어요? 저는 친구랑 먹고 왔어요.
//     雨で出会った 진지・드시다 は紫（アプリの「前に出会った語」）。할머니 の返事。直しと返事は本物（scene.json）。
//   数日後、窓ぎわのお客さん：네, 두 분 다 따뜻한 커피 드신대요. そのままで自然。自分：できたこと（前は AI が補った 드시다）。
// 学ぶ人の手持ちは、この雨と場面だけ。これまでの数（浴びた雨 3・場面で言った 2…）もその手持ちから。
import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { PEOPLE, PLACES, hits, rainById, sceneById, wordById, type PersonId, type Scene } from "../../../src/content/index.ts";
import { diffRanges } from "../../../src/lib/diff.ts";
import { f, fall, FALL, mixColor, prog, SOFT, typedAt, type Typing } from "../anim";
import SCENE from "../scene.json";
import { Scroll } from "../Scroll";
import { clipAt, RAIN_LINES, T, TYPE_CAFE, TYPE_DINNER } from "../timeline";
import { C, FONT } from "../theme";
import {
  Bar,
  BranchRow,
  BranchSteps,
  Btn,
  Composer,
  Dots,
  Grow,
  Icon,
  Ko,
  label,
  limbsOf,
  lineMarks,
  LineView,
  litMarks,
  MeBubble,
  note,
  playingAt,
  rgba,
  StepsTrack,
  ThemBubble,
  type Diff,
  type Mark,
} from "../ui";
import { Captions, type Cap } from "./Caption";

const ko = (text: string, color?: string, at?: number) => ({ text, font: "ko" as const, color, at });

/** 映像の言葉。 */
const CAPS: Cap[] = [
  { from: T.rain.cap1, door: "rain", main: [["文が、雨のように"], ["降ってくる。"]], sub: [["誰に話しているか、誰のことか。"], ["色の付いた語の上には、ふだんの語。"]], subAt: T.rain.sub1 },
  { from: T.rain.cap2, door: "rain", main: [[ko("반말"), "でも、"], ["話の中の目上の人は上げる。"]], sub: [["語尾は、話す相手で。"], ["上の語は、話の中の人で決まる。"]] },
  {
    from: T.rain.cap3,
    door: "eda",
    main: [["どの語の上の語かが、"], ["ひと目で。"]],
    sub: [[ko("먹다", C.ink, T.rain.k1), "  ›  ", ko("드시다", C.accent, T.rain.k2), "  ›  ", ko("잡수시다", C.accent, T.rain.k3)]],
    subAt: T.rain.k1 - 8,
  },
  { from: T.climb.cap, door: "climb", main: [["相手を替えると、"], ["同じひとことが段を上る。"]], sub: [["上げるのは、こちらだけ。"], ["相手は、いつもの言い方で返す。"]], subAt: T.climb.reply },
  { from: T.dinner.cap1, door: "scene", main: [["人と場面が渡される。"]], sub: [["自分なら、どう返す？"]] },
  { from: T.dinner.cap2, door: "scene", main: [["出てこないところは、"], ["日本語のままで。"]], sub: [[ko("반말"), "や日本語が混ざっていても、送れる。"]] },
  {
    from: T.dinner.cap3,
    door: "scene",
    main: [["その人に合う"], ["言い方に直る。"]],
    sub: [[{ text: "雨で出会った語", color: C.again }, "は、紫で戻ってくる。"], ["相手は、中身に返す。"]],
  },
  { from: T.cafe.cap1, door: "scene", main: [["数日後、"], ["別の場面で。"]], sub: [["今度は、自分から。"]] },
  { from: T.cafe.cap2, door: "me", main: [["AIが補った語を、"], ["自分で使えたら。"]], sub: [["「できたこと」として残る。"]], subAt: T.cafe.grown - 10 },
];

const PANEL = { left: 880, top: 40, width: 900, height: 1000 };
const K = 1.5;
const PW = PANEL.width / K;
const PH = PANEL.height / K;
const BAR = 61;

export function Story({ frame }: { frame: number }) {
  return (
    <>
      <Captions frame={frame} caps={CAPS} until={T.end.start} />
      <Panel frame={frame} />
    </>
  );
}

function Panel({ frame }: { frame: number }) {
  const cuts = [T.climb.start, T.dinner.start, T.cafe.start, T.cafe.me];
  const w = (i: number) => (i === 0 ? 1 : prog(frame, cuts[i - 1], 12, SOFT)) * (i === cuts.length ? 1 : 1 - prog(frame, cuts[i], 12, SOFT));
  const screens = [RainScreen, ClimbScreen, DinnerScreen, CafeScreen, MeScreen];
  return (
    <div style={{ position: "absolute", ...PANEL, borderRadius: 28, border: `1.5px solid ${C.line2}`, overflow: "hidden", background: C.paper, ...fall(frame, T.rain.start, 24, 18) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, transform: `scale(${K})`, transformOrigin: "0 0" }}>
        {screens.map((Screen, i) =>
          w(i) > 0 ? (
            <div key={i} style={{ position: "absolute", inset: 0, opacity: w(i), background: C.paper }}>
              <Screen frame={frame} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

/** 上のバーと、その下の中身（ページは 16px の余白）。 */
function Page({ title, right, focus, children }: { title: string; right?: ReactNode; focus?: { anchor: string; w: number; margin?: number }[]; children: ReactNode }) {
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, padding: "0 16px", background: C.paper, zIndex: 2 }}>
        <Bar title={title} right={right} />
      </div>
      <Scroll style={{ left: 0, right: 0, top: BAR, bottom: 0 }} focus={focus}>
        <div style={{ padding: "0 16px 24px" }}>{children}</div>
      </Scroll>
    </>
  );
}

const quiet = (children: ReactNode, style?: CSSProperties) => (
  <Btn quiet style={style}>
    {children}
  </Btn>
);

// ---- 浴びる -----------------------------------------------------------------------------------------------------------

const RAIN = rainById("eat")!;
const LINES = RAIN.lines.slice(0, RAIN_LINES);
/** 光らせる文：서준 → わたし「우리 할머니는 아침을 꼭 드셔.」（서준のおばあさんのこと）。 */
const FOCUS = LINES.findIndex((l) => l.id === "eat.6");

function RainScreen({ frame }: { frame: number }) {
  const r = T.rain;
  const shown = r.lines.filter((at) => frame >= at).length;
  // 光らせる文のほかは、少し退く。
  const dim = prog(frame, r.cap2, 14, SOFT);
  const press = frame - r.press;
  return (
    <>
      <Page
        title="浴びる"
        // いつも新しい文が見えるところまで（雨の頭は、文に押されて上へ）。光らせる文は真ん中寄りに。
        focus={[
          { anchor: "tail", w: 1 },
          { anchor: `line${FOCUS}`, w: prog(frame, r.cap2, 24, SOFT), margin: 150 },
        ]}
      >
        <StepsTrack current={0} />
        <section style={{ display: "flex", flexDirection: "column", gap: 8, padding: "20px 0 8px" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>{RAIN.title}</h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: C.ink2 }}>{RAIN.lead}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 0 4px" }}>
            {RAIN.branches.map((id) => (
              <BranchRow key={id} {...limbsOf(id)} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 10 }}>
            <Btn press={frame - r.play}>
              <Icon name="speaker" size={20} />
              流す
            </Btn>
          </div>
          <Grow p={1 - prog(frame, r.lines[0], 10, SOFT)}>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.7, color: C.muted }}>
              文が流れてきます。誰に話しているか、誰のことかを見ながら。色の付いた語の上には、ふだんの語。
            </p>
          </Grow>
        </section>
        <ol style={{ listStyle: "none", margin: 0, padding: "12px 0 8px" }}>
          {LINES.map((line, i) => {
            const marks = i === FOCUS ? lineMarks(line).map((m) => (m.word === "드시다" ? { ...m, press } : m)) : undefined;
            return (
              <Grow key={line.id} p={prog(frame, r.lines[i], 10, SOFT)}>
                <li
                  data-anchor={`line${i}`}
                  style={{
                    marginTop: i ? 14 : 0,
                    paddingBottom: 12,
                    borderBottom: i < shown - 1 ? `1px solid ${C.line}` : "1px solid transparent",
                    ...fall(frame, r.lines[i], 18, f(0.55)),
                    ...(frame >= r.lines[i] + f(0.55) ? { opacity: i === FOCUS ? 1 : 1 - 0.65 * dim } : null),
                  }}
                >
                  <LineView line={line} marks={marks} playing={i === FOCUS ? playingAt(frame, clipAt("eat.6")) : 0} />
                </li>
              </Grow>
            );
          })}
        </ol>
        <div data-anchor="tail" />
      </Page>
      <BranchSheet frame={frame} />
    </>
  );
}

/** 押した 드셔 から開く、드시다 の枝（BranchHost の Sheet）。枝は下から一段ずつ、その語の声と一緒に。 */
function BranchSheet({ frame }: { frame: number }) {
  const r = T.rain;
  if (frame < r.sheet) return null;
  const p = prog(frame, r.sheet, 8, SOFT);
  const word = wordById("드시다")!;
  const line = LINES[FOCUS];
  const here = trim(line.ko, hits(line.ko, word.id)[0]);
  const grow = [r.k1, r.k2, r.k3].map((at) => prog(frame, at, 12, SOFT));
  const second = prog(frame, r.k3 + 10, 12, SOFT);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `rgba(23, 32, 51, ${0.36 * p})`, zIndex: 8 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: PH * 0.88,
          border: `1px solid ${C.line}`,
          borderBottom: 0,
          borderRadius: "16px 16px 0 0",
          background: C.paper,
          overflow: "hidden",
          zIndex: 9,
          opacity: p,
          transform: `translateY(${(1 - p) * 24}px)`,
        }}
      >
        <header style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 12px 12px 20px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
            <p style={{ margin: 0, fontFamily: FONT.ko, fontSize: 24, fontWeight: 600, lineHeight: 1.3 }}>{word.id}</p>
            <p style={{ margin: "2px 0 0", fontSize: 14, color: C.muted }}>{word.ja}</p>
          </div>
          <span style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
            <Icon name="close" size={20} />
          </span>
        </header>
        <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 22 }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={label}>ここでは</h3>
            <p style={{ margin: 0, fontFamily: FONT.ko, fontSize: 19, lineHeight: 2 }}>
              <Ko text={line.ko} marks={[{ ...here, word: word.id, kind: "raised" }]} />
            </p>
          </section>
          <section>
            <BranchSteps
              rows={[
                { word: "잡수시다", height: 2 },
                { word: "드시다", height: 1 },
                { word: "먹다", height: 0 },
              ]}
              current={word.id}
              grow={grow}
            />
          </section>
          <section style={{ opacity: second, transform: `translateY(${(1 - second) * 8}px)` }}>
            <BranchSteps
              rows={[
                { word: "드시다", height: 1 },
                { word: "마시다", height: 0 },
              ]}
              current={word.id}
              grow={[1, 1]}
            />
          </section>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: C.ink2, opacity: second }}>{word.note}</p>
        </div>
      </div>
    </>
  );
}

/** 語の核が当たったところから、寄りかかっている空白を除く（BranchHost の trim）。 */
function trim(text: string, r: { start: number; end: number }) {
  let { start, end } = r;
  while (start < end && !/[가-힣]/.test(text[start])) start++;
  while (end > start && !/[가-힣]/.test(text[end - 1])) end--;
  return { start, end };
}

// ---- 上げてみる -------------------------------------------------------------------------------------------------------

const CLIMB = RAIN.climbs[0];
const SAID_CLIP = ["", "eat-a.2@f", "eat-a.3@f", "eat-a.4@f"] as const;
const UP = Easing.bezier(0, 0, 0.58, 1);

function ClimbScreen({ frame }: { frame: number }) {
  const c = T.climb;
  const ups = [c.up1, c.up2, c.up3];
  const at = ups.filter((u) => frame >= u).length;
  const since = at > 0 ? ups[at - 1] : c.start;
  const step = CLIMB.steps[at];
  const prev = at > 0 ? CLIMB.steps[at - 1].said : null;
  // 下の段から替わったところ：足した字に下線、その中の上の語は一段上がる（アプリの .rise）。
  const added: Diff[] = prev ? diffRanges(prev.ko, step.said.ko, "ko").added.map((x) => ({ ...x, kind: "ins" as const })) : [];
  const up = prog(frame, since, f(0.6), FALL);
  const marks: Mark[] = lineMarks(step.said).map((m) =>
    added.some((d) => d.start < m.end && d.end > m.start) ? { ...m, style: { opacity: up, transform: `translateY(${(1 - up) * 0.55}em)` } } : m,
  );
  const stage = at > 0 ? prog(frame, since, f(0.45), UP) : 1;
  // 押している 上げる（押す前の 8 コマから、押したあとの 16 コマまで輪が出る）。
  const pressed = ups.find((u) => frame - u >= -8 && frame - u <= 16);
  const top = at === CLIMB.steps.length - 1;
  const saidClip = SAID_CLIP[at];
  return (
    <Page title="浴びる">
      <StepsTrack current={1} />
      <section style={{ display: "flex", flexDirection: "column", gap: 8, padding: "20px 0 8px" }}>
        <p style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 10, fontSize: 15, fontWeight: 600, color: C.ink2 }}>
          {RAIN.title}
          <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>1 / {RAIN.climbs.length}</span>
        </p>
        <p style={note}>相手を替えると、同じひとことが段を上る。</p>
      </section>
      <article style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, border: `1px solid ${C.line2}`, borderRadius: 12 }}>
        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{CLIMB.title}</h4>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 6 }}>
          {CLIMB.steps.map((s, i) => {
            const state = i === at ? "here" : i < at ? "past" : "next";
            return (
              <li key={s.said.id} style={{ marginBottom: i * 4 }}>
                <span
                  style={{
                    minHeight: 34,
                    padding: "0 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    border: `1px solid ${state === "here" ? C.accent : C.line2}`,
                    borderRadius: 999,
                    background: state === "here" ? C.tint : state === "past" ? C.surface : C.paper,
                    color: state === "here" ? C.accent : state === "past" ? C.ink2 : C.muted,
                    fontWeight: state === "here" ? 600 : 400,
                    fontSize: 13,
                  }}
                >
                  {PEOPLE[s.said.to as PersonId].short}
                </span>
              </li>
            );
          })}
        </ol>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4, opacity: stage, transform: `translateY(${(1 - stage) * 10}px)` }}>
          <LineView line={step.said} size={23} marks={marks} diff={added} playing={saidClip ? playingAt(frame, clipAt(saidClip)) : 0} />
          {step.reply ? (
            <div style={{ padding: "10px 12px", borderLeft: `2px solid ${C.line2}` }}>
              <LineView line={step.reply} playing={top ? playingAt(frame, clipAt("eat-a.4r")) : 0} />
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          {top ? (
            <>
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>いちばん上まで上がりました</p>
              <Btn quiet press={pressed !== undefined ? frame - pressed : -99}>
                <Icon name="replay" size={16} />
                はじめから
              </Btn>
            </>
          ) : (
            <Btn press={pressed !== undefined ? frame - pressed : -99}>
              <Icon name="up" size={18} />
              上げる
              <span style={{ fontWeight: 500, opacity: 0.85 }}>{PEOPLE[CLIMB.steps[at + 1].said.to as PersonId].short}</span>
            </Btn>
          )}
        </div>
      </article>
      {/* その下の「次の組へ」は、画面の下で切れるので描かない。 */}
    </Page>
  );
}

// ---- 場面で言う -------------------------------------------------------------------------------------------------------

/** 場面の札（ScenePage の card）：場所と人、題、何があったか、その人の一言、わたしの事情。 */
function SceneCard({ scene, playing }: { scene: Scene; playing: number }) {
  const person = PEOPLE[scene.line.by as PersonId];
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10, padding: "20px 0 16px", borderBottom: `1px solid ${C.line}` }}>
      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: C.accent }}>
        {PLACES[scene.place]} · {person.short}
      </p>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>{scene.title}</h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: C.ink2 }}>{scene.situation}</p>
      <div style={{ padding: "6px 0" }}>
        <LineView line={scene.line} size={23} playing={playing} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 14px", borderLeft: `2px solid ${C.accent}`, background: C.tint, borderRadius: "0 10px 10px 0" }}>
        <p style={label}>わたしの事情</p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>{scene.mine}</p>
      </div>
    </section>
  );
}

const sceneActions = (thread: boolean) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "8px 0 20px" }}>
    {quiet(thread ? "ほかの返し方" : "見本を見る")}
    {thread
      ? quiet(
          <>
            次の場面
            <Icon name="arrow" size={16} />
          </>,
        )
      : null}
    {quiet("場面を選ぶ")}
  </div>
);

/** 打つ欄の中身：`from` から打ちはじめ、`until`（送ったとき）で空になる。 */
function typed(frame: number, t: Typing, from: number, until: number) {
  return frame >= from && frame < until ? typedAt(t, frame - from) : "";
}
const caretOn = (frame: number, focus: number, typing: boolean) => frame >= focus && (typing || Math.floor((frame - focus) / 16) % 2 === 0);

/** 場面で言う の一画面：札、やりとり、打つ欄。`turns`：送ってからのやりとり（無ければ「わたしならどう返す？」）。 */
function SceneScreen({
  frame,
  scene,
  lineClip,
  typing,
  typeAt,
  send,
  turns,
}: {
  frame: number;
  scene: Scene;
  lineClip: Parameters<typeof clipAt>[0];
  typing: Typing;
  typeAt: number;
  send: number;
  turns: ReactNode;
}) {
  const sent = frame >= send;
  const text = typed(frame, typing, typeAt, send);
  const now = frame >= typeAt && frame < typeAt + typing.duration;
  return (
    <>
      <Page title="場面で言う" focus={[{ anchor: "tail", w: prog(frame, send, 16, SOFT) }]}>
        <SceneCard scene={scene} playing={playingAt(frame, clipAt(lineClip))} />
        {sent ? (
          <ol style={{ listStyle: "none", margin: 0, padding: "8px 0 16px", display: "flex", flexDirection: "column" }}>{turns}</ol>
        ) : (
          <p style={{ margin: 0, padding: "18px 0 4px", fontSize: 16, fontWeight: 600 }}>わたしならどう返す？</p>
        )}
        {sceneActions(sent)}
        <div style={{ height: 70 }} />
        <div data-anchor="tail" />
      </Page>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3 }}>
        <Composer text={text} caret={!sent && caretOn(frame, typeAt - 10, now)} send={frame - send} />
      </div>
    </>
  );
}

const DINNER = sceneById("dinner")!;
const DINNER_RESULT = SCENE.dinner.result;
const DINNER_DIFF = diffRanges(SCENE.dinner.input, DINNER_RESULT.corrected, "ko");
/** 雨で出会った語（진지・드시다）は紫、はじめての 저 はアクセント。 */
const DINNER_MARKS = litMarks(DINNER_RESULT.corrected, DINNER_RESULT.words, ["진지", "드시다"]);

/** 上の語の数と、日本語で補ったところ（MeView の くわしく の札）。 */
function moreOf(r: { words: { origin: string }[]; gaps: unknown[] }) {
  const own = r.words.filter((w) => w.origin === "mine").length;
  return (
    [r.words.length ? `上の語 ${r.words.length}${own ? `（自分で使った ${own}）` : ""}` : null, r.gaps.length ? `日本語で補った ${r.gaps.length}` : null].filter(Boolean).join(" · ") || "くわしく"
  );
}

function DinnerScreen({ frame }: { frame: number }) {
  const d = T.dinner;
  const shown = prog(frame, d.result, 10, SOFT);
  const reply = SCENE.dinner.reply.film;
  const turns = (
    <>
      <li style={fall(frame, d.send, 10, f(0.35))}>
        <MeBubble
          input={SCENE.dinner.input}
          corrected={DINNER_RESULT.corrected}
          marks={DINNER_MARKS}
          removed={DINNER_DIFF.removed.map((x) => ({ ...x, kind: "del" as const }))}
          added={DINNER_DIFF.added.map((x) => ({ ...x, kind: "ins" as const }))}
          more={moreOf(DINNER_RESULT)}
          shown={frame >= d.result ? shown : 0}
        />
      </li>
      {frame < d.result ? (
        <li style={{ marginTop: 18 }}>
          <Dots frame={frame} />
        </li>
      ) : null}
      <Grow p={prog(frame, d.reply, 12, SOFT)}>
        <li style={{ marginTop: 18, ...fall(frame, d.reply, 10, f(0.45)) }}>
          <ThemBubble who={PEOPLE.halmeoni.short} text={reply.text} ja={reply.ja} playing={playingAt(frame, clipAt("halmeoni.reply"))} />
        </li>
      </Grow>
    </>
  );
  return <SceneScreen frame={frame} scene={DINNER} lineClip="dinner" typing={TYPE_DINNER} typeAt={d.type} send={d.send} turns={turns} />;
}

const CAFE = sceneById("cafe-guest")!;
const CAFE_RESULT = SCENE.cafe.result;
/** 드시다 は前に出会った語（紫）、분 ははじめて（アクセント）。どちらも自分で使った語。 */
const CAFE_MARKS = litMarks(CAFE_RESULT.corrected, CAFE_RESULT.words, ["드시다"]);

function CafeScreen({ frame }: { frame: number }) {
  const c = T.cafe;
  const shown = prog(frame, c.result, 10, SOFT);
  const turns = (
    <>
      <li style={fall(frame, c.send, 10, f(0.35))}>
        <MeBubble input={SCENE.cafe.input} corrected={CAFE_RESULT.corrected} marks={CAFE_MARKS} natural more={moreOf(CAFE_RESULT)} shown={frame >= c.result ? shown : 0} />
      </li>
      {frame < c.result ? (
        <li style={{ marginTop: 18 }}>
          <Dots frame={frame} />
        </li>
      ) : null}
    </>
  );
  return <SceneScreen frame={frame} scene={CAFE} lineClip="cafe-guest" typing={TYPE_CAFE} typeAt={c.type} send={c.send} turns={turns} />;
}

// ---- 自分 -------------------------------------------------------------------------------------------------------------

/** これまで（学ぶ人の手持ちから：浴びた雨は 食べる・飲む ほか、場面は下宿の夕飯と窓ぎわのお客さん、自分で使えた 분・드시다）。 */
const STATS: [string, number][] = [
  ["浴びた雨", 3],
  ["場面で言った", 2],
  ["送った文", 2],
  ["自分で使えた上の語", 2],
];
const THREADS = [
  { title: CAFE.title, text: CAFE_RESULT.corrected },
  { title: DINNER.title, text: DINNER_RESULT.corrected },
];
const h2: CSSProperties = { margin: 0, fontSize: 15, fontWeight: 600 };
const section: CSSProperties = { display: "flex", flexDirection: "column", gap: 10, padding: "20px 0" };

function MeScreen({ frame }: { frame: number }) {
  const c = T.cafe;
  // 「できたこと」と言うところで、その一つが灯る。
  const lit = prog(frame, c.grown, 10) * (1 - prog(frame, c.grown + 40, 30));
  const settled = prog(frame, c.grown, 10);
  const grown = wordById("드시다")!;
  return (
    <Page
      title="自分"
      right={
        <span style={{ display: "inline-flex", alignItems: "center", minHeight: 38, padding: "0 11px", border: `1px solid ${C.line2}`, borderRadius: 999, fontSize: 13, whiteSpace: "nowrap" }}>
          設定とアカウント
        </span>
      }
      focus={[{ anchor: "grown", w: prog(frame, c.me + f(0.9), 30, SOFT), margin: 6 }]}
    >
      <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.75, color: C.muted }}>これまでを振り返る場所。点数にはせず、ほかの人とも比べません。</p>
      <section style={section}>
        <h2 style={h2}>これまで</h2>
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {STATS.map(([name, n]) => (
            <div key={name} style={{ padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 12 }}>
              <dt style={{ fontSize: 12.5, color: C.muted }}>{name}</dt>
              <dd style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 600 }}>{n}</dd>
            </div>
          ))}
        </dl>
        <p style={note}>自分のための数です。</p>
      </section>
      <section data-anchor="grown" style={{ ...section, borderTop: `1px solid ${C.line}` }}>
        <h2 style={h2}>できたこと</h2>
        <p style={note}>見本やAIの助けで出会った上の語を、あとで自分から使えたとき。</p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "12px 10px",
              margin: "0 -10px",
              borderTop: `1px solid ${C.line}`,
              borderBottom: `1px solid ${C.line}`,
              background: mixColor(C.paper, C.tint, 0.55 * settled),
              boxShadow: lit > 0 ? `0 0 0 ${2 * lit}px ${rgba(C.accent, 0.5 * lit)}` : undefined,
              borderRadius: 10 * settled,
            }}
          >
            <p style={{ margin: 0, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
              <span style={{ fontFamily: FONT.ko, fontSize: 17, fontWeight: 600, color: C.accent }}>{grown.id}</span>
              <span style={{ fontSize: 13, color: C.muted }}>{grown.ja}</span>
            </p>
            <p style={{ margin: 0, fontFamily: FONT.ko, fontSize: 15, color: C.ink2 }}>{SCENE.cafe.input}</p>
            <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>前はAIが補った</p>
          </li>
        </ul>
      </section>
      <section style={{ ...section, borderTop: `1px solid ${C.line}` }}>
        <h2 style={h2}>場面のやりとり</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {THREADS.map((x, i) => (
            <li key={x.title} style={{ borderTop: `1px solid ${C.line}`, borderBottom: i === THREADS.length - 1 ? `1px solid ${C.line}` : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 56, padding: "10px 2px" }}>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15 }}>{x.title}</span>
                  <span style={{ fontFamily: FONT.ko, fontSize: 13, color: C.muted }}>{x.text}</span>
                </span>
                <span style={{ color: C.faint }}>
                  <Icon name="arrow" size={16} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
