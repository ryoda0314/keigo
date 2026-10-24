// How Korean is voiced, the same for the prepared lines (scripts/generate-audio.mjs) and for what the app's AI writes
// (/api/say), so a person sounds the same in a rain and in a scene. Every voice is Gemini's (Vertex AI, ことのあめ's
// project); a reply falls back on an OpenAI voice when Google refuses (src/lib/tts.ts).

// Gemini 3.1 Flash TTS, the model ことのは uses: its quota is per model, so it is not the one ことのあめ's live voice
// (2.5 Pro) or ことのおと's scripts (2.5 Flash) draw on, and it was the quickest of the three.
export const GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview";
export const LANGUAGE = "ko-KR";

// OpenAI's voice, only when Google cannot speak a reply.
export const TTS_MODEL = "gpt-4o-mini-tts";
export const TTS_INSTRUCTIONS = "Speak natural, clear Korean at an everyday pace. Read only the text.";

// Part of every clip's name. Clips are cached as immutable by name, so when the way lines are voiced changes, this
// changes, every name changes, and every line is voiced again instead of a new sound hiding behind an old name.
export const VOICING = "1";

// Hangul syllables per second of an everyday pace (ことのあめ's range for Korean). Gemini's pace changes from one take to
// the next: a take outside it is made again.
export const PACE_RANGE: [number, number] = [3, 6.5];
