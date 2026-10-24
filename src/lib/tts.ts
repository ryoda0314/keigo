// Voicing Korean with Gemini TTS on Vertex AI (ことのあめ's project and service account), each person in their own voice
// and way of speaking (content/cast.ts), tidied as ことのは's clips are (pcm.ts) and kept as MP3. When Google refuses a
// reply and a fallback is given, an OpenAI voice speaks instead. Used by /api/say and scripts/generate-audio.mjs only,
// never in the browser: it reads the keys.
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { paceOf, styleOf } from "../content/cast.ts";
import { pcmToSamples, rateOf, syllablesPerSecond, tidy, toMp3 } from "./pcm.ts";
import { GEMINI_TTS_MODEL, LANGUAGE, PACE_RANGE, TTS_INSTRUCTIONS, TTS_MODEL } from "./speech.ts";

let openai: OpenAI | null = null;
let gemini: GoogleGenAI | null = null;

function vertex(): GoogleGenAI {
  if (gemini) return gemini;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!raw || !project) throw new Error("no Google credentials");
  let credentials: object;
  try {
    credentials = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    credentials = JSON.parse(raw.replace(/\\n/g, "\n"));
  }
  gemini = new GoogleGenAI({ vertexai: true, project, location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1", googleAuthOptions: { credentials } });
  return gemini;
}

// OpenAI's "pcm" is 24 kHz, 16-bit, little-endian mono with no header.
const OPENAI_RATE = 24000;

async function openaiMp3(text: string, voice: string): Promise<Uint8Array> {
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.audio.speech.create({ model: TTS_MODEL, voice, input: text, instructions: TTS_INSTRUCTIONS, response_format: "pcm" });
  const samples = tidy(pcmToSamples(new Uint8Array(await res.arrayBuffer())), OPENAI_RATE);
  if (samples.length === 0) throw new Error("empty take");
  return toMp3(samples, OPENAI_RATE);
}

/** One Gemini take, tidied (see pcm.ts), with its length. */
async function geminiTake(text: string, voice: string): Promise<{ samples: Float32Array; rate: number; seconds: number }> {
  const r = await vertex().models.generateContent({
    model: GEMINI_TTS_MODEL,
    contents: [{ role: "user", parts: [{ text: `${styleOf(voice)}\n${text}` }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: { languageCode: LANGUAGE, voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  const part = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const data = part?.inlineData?.data;
  const mime = part?.inlineData?.mimeType ?? "";
  if (!data || !/pcm|l16/i.test(mime)) throw new Error(`no audio (${mime || "nothing"})`);
  const rate = rateOf(mime);
  const samples = tidy(pcmToSamples(new Uint8Array(Buffer.from(data, "base64"))), rate);
  return { samples, rate, seconds: samples.length / rate };
}

/** How far a take is from its voice's pace (0 inside it). Lines under four syllables are not judged. */
export function offPace(text: string, seconds: number, range: [number, number] = PACE_RANGE): number {
  if ((text.match(/[가-힣]/g) ?? []).length < 4) return 0;
  const speed = syllablesPerSecond(text, seconds);
  const [slow, fast] = range;
  if (speed > fast) return speed / fast - 1;
  if (speed < slow) return slow / Math.max(speed, 0.01) - 1;
  return 0;
}

export const isQuota = (err: unknown) => /RESOURCE_EXHAUSTED|429|quota/i.test(String((err as Error)?.message ?? err));

/**
 * The line in this Gemini voice, as MP3: up to `tries` takes, keeping the first at an everyday pace (or the nearest).
 * When Google cannot (its quota refuses, no credentials) and a `fallback` OpenAI voice is given, that one speaks
 * instead; the returned `voice` says which did.
 */
export async function speak(
  text: string,
  voice: string,
  { tries = 1, fallback = null }: { tries?: number; fallback?: string | null } = {},
): Promise<{ mp3: Uint8Array; voice: string; off: number }> {
  try {
    let best: { samples: Float32Array; rate: number; off: number } | null = null;
    for (let i = 0; i < tries; i++) {
      const take = await geminiTake(text, voice);
      const off = offPace(text, take.seconds, paceOf(voice) ?? PACE_RANGE);
      if (!best || off < best.off) best = { ...take, off };
      if (off === 0) break;
    }
    if (!best || best.samples.length === 0) throw new Error("empty take");
    return { mp3: toMp3(best.samples, best.rate), voice, off: best.off };
  } catch (err) {
    if (!fallback) throw err;
    return { mp3: await openaiMp3(text, fallback), voice: fallback, off: 0 };
  }
}
