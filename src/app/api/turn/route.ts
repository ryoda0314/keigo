import { PEOPLE, sceneById, type PersonId } from "@/content/index.ts";
import { takeTurn, type TurnRequest } from "@/lib/ai";
import { addressOf, allow } from "@/lib/limits";

// One sentence of the learner's: corrected with the honorifics set for the people involved, and answered by the person
// (src/lib/ai.ts).   POST { kind, ref, person, history, input, intent?, due }

const MAX_INPUT = 500;
const MAX_TURN = 800;

function parse(body: unknown): TurnRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const kind = b.kind;
  const ref = typeof b.ref === "string" ? b.ref : "";
  const person = b.person as PersonId;
  const input = typeof b.input === "string" ? b.input.trim() : "";
  if (kind !== "scene" && kind !== "free") return null;
  if (!PEOPLE[person] || !input || input.length > MAX_INPUT) return null;
  if (kind === "scene" && sceneById(ref)?.line.by !== person) return null;
  const history = Array.isArray(b.history)
    ? b.history
        .filter((h): h is { role: "me" | "them"; text: string } => {
          const x = h as Record<string, unknown>;
          return (x?.role === "me" || x?.role === "them") && typeof x.text === "string" && x.text.length <= MAX_TURN;
        })
        .slice(-14)
    : [];
  return {
    kind,
    ref,
    person,
    history,
    input,
    intent: typeof b.intent === "string" ? b.intent.slice(0, 200) : undefined,
    due: Array.isArray(b.due) ? b.due.filter((d): d is string => typeof d === "string").slice(0, 5) : [],
  };
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "unavailable" }, { status: 503 });
  const req = parse(await request.json().catch(() => null));
  if (!req) return Response.json({ error: "bad request" }, { status: 400 });
  if (!allow("turn", addressOf(request))) return Response.json({ error: "too many" }, { status: 429 });
  try {
    return Response.json(await takeTurn(req));
  } catch (err) {
    console.error("[turn]", err instanceof Error ? err.message : err);
    return Response.json({ error: "failed" }, { status: 502 });
  }
}
