import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { prog } from "./anim";
import { End } from "./scenes/End";
import { Hook } from "./scenes/Hook";
import { NameMark } from "./scenes/Mark";
import { Story } from "./scenes/Story";
import { C, FONT, useFonts } from "./theme";
import { CLIP_AT, T, TOTAL, TYPE_CAFE, TYPE_DINNER, TYPE_STUCK, VOICE_AT } from "./timeline";

/** `from` から `to`（コマ）まで見せる。両端は `fade` コマで薄れる。 */
function Window({
  frame,
  from,
  to,
  fade = 12,
  fadeIn = true,
  fadeOut = true,
  children,
}: {
  frame: number;
  from: number;
  to: number;
  fade?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}) {
  if (frame < from || frame >= to) return null;
  const opacity = Math.min(fadeIn ? prog(frame, from, fade) : 1, fadeOut ? 1 - prog(frame, to - fade, fade) : 1);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

/** 映像。 */
export function Promo() {
  useFonts();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper, color: C.ink, fontFamily: FONT.ui, WebkitFontSmoothing: "antialiased" }}>
      <style>{"* { box-sizing: border-box; }"}</style>
      <Window frame={frame} from={0} to={T.title.start + 8} fadeIn={false} fade={16}>
        <Hook frame={frame} />
      </Window>
      <Window frame={frame} from={T.title.start} to={T.rain.start + 10} fade={14}>
        <NameMark frame={frame} icon={T.title.icon} word={T.title.word} lead={T.title.lead} size={280} top={150} wordSize={104} leadSize={46} />
      </Window>
      <Window frame={frame} from={T.rain.start} to={T.end.start + 10} fade={14}>
        <Story frame={frame} />
      </Window>
      <Window frame={frame} from={T.end.start} to={TOTAL} fade={20} fadeOut={false}>
        <End frame={frame} />
      </Window>
      <Sound />
    </AbsoluteFill>
  );
}

// ---- 音：ナレーション（scripts/voice.mjs）、アプリの声（scripts/assets.mjs）、静かな音楽と画面の小さな音（scripts/music.py）

const MUSIC = 0.5;
/** 声のあいだ、音楽をどれだけ下げるか（0〜1）。 */
const DUCK = 0.5;
/**
 * アプリの声の大きさ。アプリのクリップは話し声が約 -21 dB にそろえてあり、ナレーション（約 -16 dB）より 5 dB ほど小さい。
 * 映像で見せたいのは韓国語の文なので、+4.6 dB 上げてナレーションと並べる（山は -2 dBFS まで：割れない）。
 */
const APP_VOICE = 1.7;

/**
 * 音楽を下げる度合い（コマごと、0〜1）。声（ナレーションもアプリの声も）の 4 コマ前から下げはじめ、声が消えてから戻す。
 * 声と声のあいだの短いすき間では戻しきらない（戻る速さを、下がる速さより遅くしている）。
 */
const DUCKING: number[] = (() => {
  const want = new Float32Array(TOTAL);
  for (const v of [...VOICE_AT, ...CLIP_AT]) for (let i = Math.max(0, v.from - 4); i < Math.min(TOTAL, v.until + 2); i++) want[i] = 1;
  const out: number[] = [];
  let level = 0;
  for (let i = 0; i < TOTAL; i++) {
    level += (want[i] - level) * (want[i] > level ? 0.25 : 0.07);
    out.push(level);
  }
  return out;
})();

function Clip({ from, src, volume = 1, frames }: { from: number; src: string; volume?: number; frames?: number }) {
  return (
    <Sequence from={from} durationInFrames={frames} layout="none">
      <Audio src={staticFile(src)} volume={volume} />
    </Sequence>
  );
}

function Sound() {
  const h = T.hook;
  const r = T.rain;
  const c = T.climb;
  const d = T.dinner;
  const k = T.cafe;
  const musicVolume = (frame: number) =>
    MUSIC * interpolate(frame, [0, 20, TOTAL - 75, TOTAL - 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - DUCK * (DUCKING[frame] ?? 0));
  // 文が降るときの雨粒。冒頭の枝が並ぶとき（Hook の rise と同じ時）は小さく。
  const drops = r.lines;
  const branchDrops = Array.from({ length: 8 }, (_, i) => h.words + 14 + i * 3);
  const taps = [r.play, r.press, c.up1, c.up2, c.up3, d.send, k.send];
  const typing: [number, number][] = [
    [h.type, TYPE_STUCK.duration],
    [d.type, TYPE_DINNER.duration],
    [k.type, TYPE_CAFE.duration],
  ];
  return (
    <>
      <Audio src={staticFile("sound/music.wav")} volume={musicVolume} />
      {VOICE_AT.map((v) => (
        <Clip key={v.id} from={v.from} src={`voice/${v.id}.wav`} />
      ))}
      {CLIP_AT.map((v) => (
        <Clip key={`${v.id}${v.from}`} from={v.from} src={v.src} volume={APP_VOICE} />
      ))}
      {drops.map((at, i) => (
        <Clip key={`d${at}`} from={at} src={`sound/drop${(i % 3) + 1}.wav`} volume={0.22} />
      ))}
      {branchDrops.map((at, i) => (
        <Clip key={`b${at}`} from={at} src={`sound/drop${(i % 3) + 1}.wav`} volume={0.12} />
      ))}
      {[0, 4, 7].map((delay, i) => (
        <Clip key={`t${delay}`} from={T.title.icon + delay + 8} src={`sound/drop${i + 1}.wav`} volume={0.28} />
      ))}
      {[0, 4, 7].map((delay, i) => (
        <Clip key={`e${delay}`} from={T.end.icon + delay + 8} src={`sound/drop${i + 1}.wav`} volume={0.24} />
      ))}
      {taps.map((at) => (
        <Clip key={`p${at}`} from={at - 2} src="sound/tap.wav" volume={0.5} />
      ))}
      {[d.send, k.send].map((at) => (
        <Clip key={`s${at}`} from={at} src="sound/send.wav" volume={0.3} />
      ))}
      {typing.map(([at, dur]) => (
        <Clip key={`k${at}`} from={at} frames={dur + 2} src="sound/typing.wav" volume={0.45} />
      ))}
      <Clip from={d.result} src="sound/chime.wav" volume={0.2} />
      <Clip from={k.result} src="sound/chime.wav" volume={0.26} />
      <Clip from={k.grown} src="sound/chime.wav" volume={0.24} />
    </>
  );
}
