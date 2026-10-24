import { fallbackOf, VOICES } from "@/content/index.ts";
import { addressOf, allow } from "@/lib/limits";
import { verify } from "@/lib/sign";
import { speak } from "@/lib/tts";

// Voices Korean the app's AI wrote (a person's reply, a corrected sentence), only when it comes with the signature the
// server gave it, as in ことのは. Prepared lines are static files (public/audio) and never come here. When Google refuses,
// the person's OpenAI voice speaks (src/lib/tts.ts).   POST { text, sig, voice }  →  audio/mpeg

const MAX = 600;
const KEPT = 300;
// The same few sentences are played again and again in a conversation: keep the recent ones.
const cache = new Map<string, Uint8Array>();

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: unknown; sig?: unknown; voice?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text : "";
  const sig = typeof body?.sig === "string" ? body.sig : "";
  const voice = typeof body?.voice === "string" && VOICES.includes(body.voice) ? body.voice : null;
  if (!text || text.length > MAX || !voice || !verify(text, sig)) return Response.json({ error: "bad request" }, { status: 400 });

  const key = `${voice}\n${text}`;
  let audio = cache.get(key);
  if (!audio) {
    if (!allow("say", addressOf(request))) return Response.json({ error: "too many" }, { status: 429 });
    try {
      // A learner is waiting: one more take only if the first came out rushed or dragging.
      const said = await speak(text, voice, { tries: 2, fallback: process.env.OPENAI_API_KEY ? fallbackOf(voice) : null });
      audio = said.mp3;
      // A fallback take is not kept under the Gemini voice's name: the next play asks Google again.
      if (said.voice === voice) {
        cache.set(key, audio);
        if (cache.size > KEPT) cache.delete(cache.keys().next().value as string);
      }
    } catch (err) {
      console.error("[say]", err instanceof Error ? err.message : err);
      // The page falls back to the browser's own voice.
      return Response.json({ error: "failed" }, { status: 502 });
    }
  }
  return new Response(Buffer.from(audio), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" } });
}
