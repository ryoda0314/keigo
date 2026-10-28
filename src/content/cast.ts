import type { ListenerId, Person, PersonId, PlaceId, SpeakerId } from "./types.ts";

// The people the learner meets: わたし is an exchange student at a university in Seoul, living in a boarding house
// (하숙집) and working part-time at a cafe. Each has a name and a voice, how わたし calls them, and how they speak to
// わたし: the elders speak 반말 down, and わたし raises them back (CONCEPT.md, 人). Voices are Gemini's (Vertex AI, in
// ことのあめ's project); scripts/generate-audio.mjs and /api/say use the same ones.
export const PEOPLE: Record<PersonId, Person> = {
  seojun: {
    id: "seojun",
    name: "서준",
    kana: "ソジュン",
    call: "서준아",
    short: "서준",
    role: "친구",
    about: "同い年の友だち。同じ授業をとっている。",
    speaks: "반말",
    voice: "Achird",
    fallback: "ash",
    style: "Say this the way a friendly Korean university student in his twenties talks to a close friend, relaxed, at a natural pace:",
    persona:
      "정서준 (Seo-jun), a Korean university student in his early twenties, the learner's classmate and close friend of the same age. Easygoing and kind. You speak 반말 to the learner.",
  },
  jieun: {
    id: "jieun",
    name: "지은",
    kana: "チウン",
    call: "선배",
    short: "지은 선배",
    role: "선배",
    about: "一つ上の先輩。同じサークル。",
    speaks: "반말",
    voice: "Sulafat",
    fallback: "coral",
    style: "Say this the way a warm Korean university student in her twenties talks to a younger club member, at a natural pace:",
    persona:
      "이지은 (Ji-eun), a third-year university student one year above the learner in the same club. Friendly, caring, a little big-sisterly. You speak 반말 to the learner, your 후배.",
  },
  park: {
    id: "park",
    name: "박정호",
    kana: "パク・チョンホ",
    call: "교수님",
    short: "박 교수님",
    role: "교수님",
    about: "指導の教授。50代。",
    speaks: "해요체",
    voice: "Sadaltager",
    fallback: "onyx",
    style: "Say this the way a calm, kind Korean professor in his fifties talks to a student, clearly, at a natural pace:",
    persona:
      "박정호 (Park Jeong-ho), a professor in his fifties and the learner's advisor. Calm, kind, a little formal. You speak polite 해요체 to students and never raise yourself.",
  },
  halmeoni: {
    id: "halmeoni",
    name: "김순자",
    kana: "キム・スンジャ",
    call: "할머니",
    short: "할머니",
    role: "할머니",
    about: "下宿のおばあさん。70代。ご飯を作ってくれる。",
    speaks: "반말",
    voice: "Gacrux",
    fallback: "sage",
    style: "Say this the way a warm Korean grandmother in her seventies talks to a young student she looks after, gently and a little slowly:",
    pace: [2.3, 5.5],
    persona:
      "김순자 (Kim Sun-ja), the grandmother in her seventies who runs the boarding house (하숙집) where the learner lives. Warm, a little worrying, loves feeding students. You speak 반말 to the learner, like a grandmother (해라체 and 해체: 먹었니?, 먹어라, 괜찮다).",
  },
  choi: {
    id: "choi",
    name: "최민호",
    kana: "チェ・ミンホ",
    call: "사장님",
    short: "사장님",
    role: "사장님",
    about: "バイト先のカフェの社長。40代。",
    speaks: "반말（お客さんには上の語）",
    voice: "Alnilam",
    fallback: "echo",
    style: "Say this the way a brisk but friendly Korean cafe owner in his forties talks to his part-timer, at a natural pace:",
    persona:
      "최민호 (Choi Min-ho), in his forties, the owner of the cafe where the learner works part-time. Brisk but fair. You speak 반말 to your part-timer, and raise customers (손님) when you talk about them.",
  },
  mikyung: {
    id: "mikyung",
    name: "한미경",
    kana: "ハン・ミギョン",
    call: "어머님",
    short: "서준 어머님",
    role: "친구 어머님",
    about: "서준のお母さん。50代。",
    speaks: "반말",
    voice: "Despina",
    fallback: "shimmer",
    style: "Say this the way a warm, chatty Korean mother in her fifties talks to her son's friend, at a natural pace:",
    persona:
      "한미경 (Han Mi-gyeong), 서준's mother in her fifties. Warm and talkative. You speak 반말 to your son's friend, kindly.",
  },
};

/** The people in order of how high they stand from わたし, as 上げてみる climbs. */
export const LADDER: PersonId[] = ["seojun", "jieun", "choi", "park", "mikyung", "halmeoni"];

/** わたし's voice: the learner chooses (自分 → 設定); both are made for every line わたし says. */
export const ME_VOICES = { f: { voice: "Leda", fallback: "nova" }, m: { voice: "Puck", fallback: "alloy" } } as const;
export type MeVoice = keyof typeof ME_VOICES;
export const ME_STYLE = "Say this the way a Japanese exchange student who speaks Korean well would, clearly, at a natural pace:";

export const VOICES: readonly string[] = [...Object.values(PEOPLE).map((p) => p.voice), ME_VOICES.f.voice, ME_VOICES.m.voice];

export function voiceOf(who: SpeakerId, me: MeVoice = "f"): string {
  return who === "me" ? ME_VOICES[me].voice : PEOPLE[who].voice;
}

export function styleOf(voice: string): string {
  return Object.values(PEOPLE).find((p) => p.voice === voice)?.style ?? ME_STYLE;
}

/** The pace a voice is held to, in Hangul syllables per second (null: everyday speech's). */
export function paceOf(voice: string): [number, number] | null {
  return Object.values(PEOPLE).find((p) => p.voice === voice)?.pace ?? null;
}

/** The OpenAI voice a Gemini voice falls back on for a reply. */
export function fallbackOf(voice: string): string | null {
  const person = Object.values(PEOPLE).find((p) => p.voice === voice);
  if (person) return person.fallback;
  const me = Object.values(ME_VOICES).find((v) => v.voice === voice);
  return me?.fallback ?? null;
}

/** A listener or speaker in a label that shows the relationship: わたし, 친구, 선배, 교수님, お客さん. */
export function roleOf(who: ListenerId): string {
  if (who === "me") return "わたし";
  if (who === "guest") return "お客さん";
  return PEOPLE[who].role;
}

export const PLACES: Record<PlaceId, string> = {
  house: "下宿",
  lab: "研究室",
  club: "サークル",
  cafe: "カフェ",
  friend: "友だちの家族",
};
