// いつ何が起きるか（秒で決めて、コマにする）。ナレーションの長さは src/voice.json（scripts/voice.mjs が書く）から、アプリの
// 声（用意した文のクリップと、場面の相手の返事）の長さは src/audio.json（scripts/assets.mjs が書く）から、打つ長さは打ち方
// （anim.ts の mixTyping）から。声が言い終わってから、次のできごとへ進む。韓国語の声の上に、ナレーションは重ねない。
//
// 見る人：友だちとの반말から韓国語に入って、話せても해요体まで、という人たち。目上の人の前で言葉が出てこないのは、語尾では
// なく 말씀・잡수시다 のような語が足りないから。その語を、文と人と声で身につけていく流れを、アプリの画面で見せる。
// 文はすべてアプリの中身（../src/content）のまま。場面の直しと返事は、アプリの /api/turn が返した本物（src/scene.json）。
import { f, mixTyping } from "./anim";
import AUDIO from "./audio.json";
import VOICE from "./voice.json";

/** 할머니 に言いかけて、止まる。 */
export const TYPE_STUCK = mixTyping([{ ko: "할머니, 잘" }], 4);
/** 下宿の夕飯：韓国語で言えるところまで言って、あとは日本語で（scene.json の dinner.input）。 */
export const TYPE_DINNER = mixTyping([{ ko: "할머니 밥 먹었어요? 나는 " }, { kana: "ともだちと", ja: "友だちと" }, { kana: "たべてきた", ja: "食べてきた" }, { ko: "。" }]);
/** 窓ぎわのお客さん：今度は自分から（scene.json の cafe.input）。 */
export const TYPE_CAFE = mixTyping([{ ko: "네, 두 분 다 따뜻한 커피 드신대요." }], 2);

const sec = (frames: number) => frames / 30;

type VoiceId = keyof typeof VOICE;
type ClipId = keyof typeof AUDIO;
/** ナレーションの末尾の余白（声が消えてから残した 250ms と、足した 120ms）。次の声やできごとは、ここに重ねてよい。 */
const TAIL = 0.37;
/** アプリの声の末尾の無音（測ると 0.21〜0.28 秒）。 */
const CLIP_TAIL = 0.22;
/** 声が鳴っている長さ（秒）。 */
const said = (id: VoiceId) => VOICE[id] - TAIL;
const heard = (id: ClipId) => AUDIO[id].seconds - CLIP_TAIL;
/** ナレーションとアプリの声を置いた時（秒）。make() が積む。 */
const cues: { id: VoiceId; at: number }[] = [];
const clips: { id: ClipId; at: number }[] = [];
/** `at` 秒にナレーションを置いて、言い終わる時（秒）を返す。 */
const say = (id: VoiceId, at: number) => {
  cues.push({ id, at });
  return at + said(id);
};
/** `at` 秒にアプリの声を置いて、言い終わる時（秒）を返す。 */
const play = (id: ClipId, at: number) => {
  clips.push({ id, at });
  return at + heard(id);
};

function make() {
  // A. 友だちとの반말なら話せる（잘 자.）。目上の人の前だと出てこない（할머니, 잘…）。同じ「おやすみ」が、相手が上がると
  //    語ごと替わる（잘 자. → 선배, 잘 자요. → 할머니, 안녕히 주무세요.）。足りないのは、語尾ではなく語（枝が並ぶ）。
  const hook = { start: 0, stuck: 0, type: 0, ladder: 0, r1: 0, r2: 0, r3: 0, lit: 0, words: 0, end: 0 };
  hook.stuck = say("V01", 0.3) + 0.3;
  hook.type = hook.stuck + 0.45;
  hook.ladder = Math.max(say("V02", hook.stuck + 0.15), hook.type + sec(TYPE_STUCK.duration)) + 0.35;
  hook.r1 = hook.ladder + 0.25;
  hook.r2 = play("sleep-a.1@f", hook.r1) + 0.3;
  hook.r3 = play("sleep-a.2@f", hook.r2) + 0.3;
  hook.lit = play("sleep-a.3@f", hook.r3) + 0.15;
  hook.words = say("V03", hook.lit + 0.2) + 0.3;
  hook.end = say("V04", hook.words + 0.2) + 0.6;

  // B. ことのえだ
  const title = { start: hook.end, icon: hook.end + 0.3, word: hook.end + 0.7, lead: hook.end + 1.5, end: 0 };
  title.end = say("V05", title.word - 0.05) + 0.45;

  // C. 浴びる：食べる・飲む の雨。文が一つずつ降る。서준 の「우리 할머니는 아침을 꼭 드셔.」で、반말でも話の中の
  //    おばあさんは上げる。드셔 を押すと 드시다 の枝：먹다 › 드시다 › 잡수시다 が下から一段ずつ。
  const rain = { start: title.end - 0.2, cap1: 0, play: 0, lines: [] as number[], sub1: 0, cap2: 0, line6: 0, press: 0, sheet: 0, cap3: 0, k1: 0, k2: 0, k3: 0, end: 0 };
  rain.cap1 = rain.start + 0.4;
  const v06 = say("V06", rain.start + 0.5);
  // 雨の頭（段・題・枝・流す）を見せてから、V06 を言い終わるころに流す。
  rain.play = v06 - 0.3;
  rain.lines = Array.from({ length: RAIN_LINES }, (_, i) => rain.play + 0.35 + i * 0.6);
  rain.sub1 = v06 + 0.2;
  rain.cap2 = say("V17", rain.sub1) + 0.3;
  rain.line6 = say("V08", rain.cap2 + 0.15) + 0.25;
  rain.press = play("eat.6", rain.line6) + 0.3;
  rain.sheet = rain.press + 0.2;
  rain.cap3 = rain.sheet + 0.1;
  rain.k1 = say("V09", rain.sheet + 0.3) + 0.15;
  rain.k2 = say("K01", rain.k1) + 0.12;
  rain.k3 = say("K02", rain.k2) + 0.12;
  rain.end = say("K03", rain.k3) + 0.95;

  // D. 上げてみる：ご飯、食べた？ を、서준 → 지은 선배 → 박 교수님 → 할머니 と上げる。上げるたびにわたしの声、いちばん上で
  //    할머니 の返事。
  const climb = { start: rain.end, cap: 0, up1: 0, up2: 0, up3: 0, reply: 0, end: 0 };
  climb.cap = climb.start + 0.2;
  climb.up1 = say("V10", climb.start + 0.35) + 0.2;
  climb.up2 = play("eat-a.2@f", climb.up1 + 0.15) + 0.3;
  climb.up3 = play("eat-a.3@f", climb.up2 + 0.15) + 0.3;
  climb.reply = play("eat-a.4@f", climb.up3 + 0.15) + 0.3;
  climb.end = play("eat-a.4r", climb.reply) + 0.7;

  // E. 場面で言う：下宿の夕飯。할머니 の一言に、言えるところまで韓国語で、あとは日本語で返す。直った文と、할머니 の返事。
  const dinner = { start: climb.end, cap1: 0, type: 0, cap2: 0, send: 0, result: 0, cap3: 0, reply: 0, end: 0 };
  dinner.cap1 = dinner.start + 0.2;
  dinner.type = play("dinner", dinner.start + 0.5) + 0.4;
  dinner.cap2 = dinner.type;
  const v12 = say("V12", dinner.type + 0.2);
  dinner.send = Math.max(dinner.type + sec(TYPE_DINNER.duration), v12) + 0.35;
  dinner.result = dinner.send + 1.1;
  dinner.cap3 = dinner.result + 0.1;
  dinner.reply = say("V13", dinner.result + 0.3) + 0.25;
  dinner.end = play("halmeoni.reply", dinner.reply + 0.05) + 0.6;

  // F. 数日後、カフェで：사장님 に、自分から 드신대요。そのままで自然。自分：AI が補った 드시다 を自分で使えた（できたこと）。
  const cafe = { start: dinner.end, cap1: 0, type: 0, send: 0, result: 0, me: 0, cap2: 0, grown: 0, end: 0 };
  cafe.cap1 = cafe.start + 0.2;
  const v14 = say("V14", play("cafe-guest", cafe.start + 0.5) + 0.2);
  cafe.type = v14 - said("V14") + 0.4;
  cafe.send = Math.max(cafe.type + sec(TYPE_CAFE.duration), v14) + 0.3;
  cafe.result = cafe.send + 1.0;
  cafe.me = cafe.result + 1.7;
  cafe.cap2 = cafe.me + 0.1;
  const v15 = say("V15", cafe.me + 0.3);
  // 「…できたこととして残ります」の、できたこと のところ。
  cafe.grown = cafe.me + 4.5;
  cafe.end = v15 + 0.7;

  // G. 終わり
  const end = { start: cafe.end, icon: cafe.end + 0.3, word: cafe.end + 0.7, lead: cafe.end + 1.4, rest: cafe.end + 2.1, end: 0 };
  end.end = Math.max(end.start + 5.8, say("V16", end.word + 0.05) + 1.5);

  return { hook, title, rain, climb, dinner, cafe, end };
}

/** 雨に降らせる文の数（食べる・飲む の頭から：eat.1 〜 eat.7）。 */
export const RAIN_LINES = 7;

const S = make();
const frames = <T extends Record<string, number | number[]>>(o: T) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.map(f) : f(v)])) as { [K in keyof T]: T[K] extends number[] ? number[] : number };

export const T = {
  hook: frames(S.hook),
  title: frames(S.title),
  rain: frames(S.rain),
  climb: frames(S.climb),
  dinner: frames(S.dinner),
  cafe: frames(S.cafe),
  end: frames(S.end),
};

export const TOTAL = f(S.end.end);

/** ナレーション：クリップと、鳴らしはじめるコマ・声が消えるコマ（音楽はこの間だけ下がる）。 */
export const VOICE_AT = cues.map((c) => ({ id: c.id, from: f(c.at), until: f(c.at + said(c.id)) }));
/** アプリの声：ファイルと、鳴らしはじめるコマ・声が消えるコマ（ナレーションと同じく、音楽はこの間だけ下がる）。 */
export const CLIP_AT = clips.map((c) => ({ id: c.id, src: AUDIO[c.id].src, from: f(c.at), until: f(c.at + heard(c.id)) }));
/** アプリの声が鳴っている間（読み上げのボタンが光る）。 */
export const clipAt = (id: ClipId) => CLIP_AT.find((c) => c.id === id) ?? { from: -1, until: -1 };

/** 音楽の区切り（秒）。scripts/music.py に渡す。 */
export const MUSIC_MARKS = { title: S.title.start, story: S.rain.start, later: S.cafe.start, end: S.end.start, total: S.end.end };
