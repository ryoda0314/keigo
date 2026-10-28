// The shape of the prepared Korean: the people, the words on their branches (枝), the rains of 浴びる with their
// climbs (上げてみる), and the scenes of 場面で言う. Everything here is written ahead and checked
// (tests/content.test.mjs); the app's AI only corrects and replies (CONCEPT.md).

export type PersonId = "seojun" | "jieun" | "park" | "halmeoni" | "choi" | "mikyung";
/** Who says a line: one of the people, or "me" (わたし, the learner's side). */
export type SpeakerId = PersonId | "me";
/** Who a line is said to: a speaker, or a customer of the cafe (who never speaks). */
export type ListenerId = SpeakerId | "guest";

/**
 * What a word does: something an elder does (드시다), something done to an elder (드리다), an elder's thing (댁), the
 * speaker stepping down (저), or what attaches to a person (께서).
 */
export type Group = "does" | "toward" | "thing" | "self" | "attach";

/**
 * One word on a branch. Height 0 is the everyday word (下枝), 1 the raised word (中つ枝), 2 the more raised one
 * (上つ枝). `id` is the dictionary form, unique.
 */
export type Word = {
  id: string;
  ja: string;
  height: 0 | 1 | 2;
  group: Group;
  /** For a raised word: the everyday words it stands in for. */
  base?: string[];
  /** Who it is for, in plain Japanese. */
  who?: string;
  /** One plain sentence on when it is used. */
  note?: string;
  hanja?: string;
  /** Finds the word in Korean text: checks the marks, and tells whether the learner's own words had it. */
  core: RegExp;
};

/** One everyday word and the raised words above it. Words that are rarely said are only named. */
export type Branch = { id: string; base: string; limbs: string[]; rare?: { ko: string; ja: string }[] };

/**
 * Where a word shows in a line: the word and the exact text. The plain -시- of a verb (오셨어요) is marked too, with the
 * everyday verb it raises (`base`: 오다), shown above it like the raised words.
 */
export type Mark = { word: string; text: string; base?: string };

/**
 * One line of Korean. `about` names, in Japanese, whom the raised words honor when it is not the listener (a third
 * person). `id` names its audio.
 */
export type Line = { id: string; by: SpeakerId; to: ListenerId; about?: string; ko: string; ja: string; marks?: Mark[] };

/** 上げてみる: the same message said to people higher and higher, each answering in their own voice. */
export type Step = { said: Line; reply?: Line };
export type Climb = { id: string; title: string; steps: Step[] };

/** A rain of 浴びる: a branch or a few close ones, its lines, and its climbs. */
export type Rain = { id: string; title: string; lead: string; branches: string[]; lines: Line[]; climbs: Climb[] };

export type Sample = { ko: string; ja: string; puts: string; marks?: Mark[] };

export type PlaceId = "house" | "lab" | "club" | "cafe" | "friend";

export type Scene = {
  id: string;
  place: PlaceId;
  title: string;
  /** What has happened, in Japanese. */
  situation: string;
  /** The person's line the learner answers. */
  line: Line;
  /** The learner's own circumstances and wish, never the finished answer. */
  mine: string;
  /** Ways of answering, each putting something else forward; shown only when asked for. */
  samples: Sample[];
  /** For the person's side of the scene, in English. */
  brief: string;
};

export type Person = {
  id: PersonId;
  /** As written in Korean: 서준, 박정호. */
  name: string;
  kana: string;
  /** How わたし calls them: 서준아, 선배, 교수님. */
  call: string;
  /** Short, with the name, for the conversation (the reply's header): 서준, 지은 선배, 박 교수님. */
  short: string;
  /**
   * What they are to わたし, for the labels that show the relationship (who says it to whom, a climb's steps, a scene's
   * person): 친구, 선배, 교수님. There the relationship is the point, and a name says less than 선배 does.
   */
  role: string;
  about: string;
  /** How they speak to わたし. */
  speaks: string;
  /** A Gemini voice (Vertex AI), and the OpenAI voice that speaks a reply when Google cannot. */
  voice: string;
  fallback: string;
  /** How Gemini is asked to say their lines. */
  style: string;
  /** Hangul syllables per second they speak at, when it is not everyday speech's (a grandmother, slower). */
  pace?: [number, number];
  persona: string;
};
