import "server-only";
import OpenAI from "openai";
import { sign } from "./sign.ts";
import { cleanTurn, TURN_SCHEMA, turnPrompt, type RawTurn, type TurnRequest, type TurnResult } from "./turn-core.ts";

export type { TurnRequest, TurnResult };

// The app's AI: once per sentence of the learner's (corrected with the honorifics set for the people involved, and
// answered by the person), as ことのは's /api/turn. What it asks and how the answers are checked: turn-core.ts.

// gpt-5.5, as ことのは: on ことのは's own examples it kept the learner's meaning where smaller models and no reasoning
// changed it. TALK_MODEL and TALK_EFFORT change it.
export const TALK_MODEL = process.env.TALK_MODEL || "gpt-5.5";
const TALK_EFFORT = (process.env.TALK_EFFORT as "low" | "medium" | "high" | undefined) || "low";

let client: OpenAI | null = null;
const openai = () => (client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

async function ask<T>({ system, user }: { system: string; user: string }, name: string, schema: object): Promise<T> {
  const completion = await openai().chat.completions.create({
    model: TALK_MODEL,
    reasoning_effort: TALK_EFFORT,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_schema", json_schema: { name, strict: true, schema: schema as Record<string, unknown> } },
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error(`empty ${name} response`);
  return JSON.parse(content) as T;
}

export async function takeTurn(req: TurnRequest): Promise<TurnResult> {
  return cleanTurn(await ask<RawTurn>(turnPrompt(req), "turn", TURN_SCHEMA), req, sign);
}
