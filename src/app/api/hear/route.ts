import OpenAI, { toFile } from "openai";
import { addressOf, allow } from "@/lib/limits";

// What the learner said aloud, as text they check and send (場面で言う): Korean with Japanese where it did not come
// out, as in ことのは. The recording is a 16 kHz WAV (src/components/recorder.ts), passed on and not kept.

const MODEL = process.env.HEAR_MODEL || "gpt-4o-transcribe";
const MAX_BYTES = 44 + 16000 * 2 * 30; // 30 seconds
let client: OpenAI | null = null;

function isWav16k(b: Uint8Array): boolean {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const tag = (o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
  return (
    b.byteLength > 44 &&
    tag(0) === "RIFF" &&
    tag(8) === "WAVE" &&
    view.getUint16(20, true) === 1 &&
    view.getUint16(22, true) === 1 &&
    view.getUint32(24, true) === 16000 &&
    view.getUint16(34, true) === 16
  );
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "unavailable" }, { status: 503 });
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_BYTES || !isWav16k(body)) return Response.json({ error: "bad audio" }, { status: 400 });
  if (!allow("hear", addressOf(request))) return Response.json({ error: "too many" }, { status: 429 });
  try {
    client ??= new OpenAI();
    const r = await client.audio.transcriptions.create({
      file: await toFile(body, "said.wav", { type: "audio/wav" }),
      model: MODEL,
      prompt: "일본인 대학생이 한국어로 말합니다. 한국어가 안 나오는 부분은 일본어로 말할 때도 있습니다.",
    });
    return Response.json({ text: r.text.trim() });
  } catch {
    return Response.json({ error: "failed" }, { status: 502 });
  }
}
