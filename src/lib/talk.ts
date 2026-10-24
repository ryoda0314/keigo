"use client";

// What the screens do with a conversation, as in ことのは: start one, send the learner's sentence (it shows at once, the
// correction and the person's reply follow). Everything lands in the record (store.ts) and from there on every screen.
import { useSyncExternalStore } from "react";
import { isRaised, markSpans, PEOPLE, type Line, type PersonId } from "@/content/index.ts";
import { prefNow } from "@/components/local";
import { playAll, replyItems } from "@/components/audio";
import { dueKeys, historyOf, newId, putThread, recordResult, threadById, withTurn, type MeTurn, type Support, type ThemTurn, type Thread, type ThreadKind } from "./record.ts";
import { commit, getState } from "./store.ts";

// Threads waiting for the AI, so their screens can show it.
const waiting = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useWaiting(threadId: string | null): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (threadId ? waiting.has(threadId) : false),
    () => false,
  );
}

/** A prepared line said by a person, as the first turn of a conversation. */
export function lineTurn(line: Line, at = Date.now()): ThemTurn {
  const words = markSpans(line)
    .filter((s) => isRaised(s.word))
    .map((s) => ({ word: s.word, start: s.start, end: s.end }));
  return { id: newId(), role: "them", at, who: line.by as PersonId, text: line.ko, ja: line.ja, line: line.id, words };
}

export function startThread(args: { kind: ThreadKind; ref: string; person: PersonId; title: string; first?: ThemTurn }): Thread {
  const at = Date.now();
  const thread: Thread = { id: newId(), kind: args.kind, ref: args.ref, person: args.person, title: args.title, startedAt: at, updatedAt: at, turns: args.first ? [args.first] : [] };
  commit((s) => putThread(s, thread));
  return thread;
}

export type SendResult = { ok: true } | { ok: false; reason: "failed" | "tooMany" };

/**
 * Sends one sentence of the learner's. It shows at once; the correction and the reply follow. On failure the turn is
 * taken back and the screen keeps the text so nothing typed is lost.
 */
export async function send(threadId: string, input: string, opts: { support?: Support; spoken?: boolean; intent?: string; again?: string } = {}): Promise<SendResult> {
  const state = getState();
  const thread = threadById(state, threadId);
  if (!thread || waiting.has(threadId)) return { ok: false, reason: "failed" };

  const before = opts.again ? { ...thread, turns: thread.turns.filter((t) => t.id !== opts.again) } : thread;
  const me: MeTurn = { id: opts.again ?? newId(), role: "me", at: Date.now(), input, spoken: opts.spoken || undefined, support: opts.support, intent: opts.intent };
  commit((s) => putThread(s, withTurn(before, me)));
  waiting.add(threadId);
  emit();

  let response: Response | null = null;
  try {
    response = await fetch("/api/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: thread.kind,
        ref: thread.ref,
        person: thread.person,
        history: historyOf(before),
        input,
        intent: opts.intent,
        due: dueKeys(state).slice(0, 3),
      }),
    });
  } catch {
    response = null;
  }

  const body = response?.ok ? await response.json().catch(() => null) : null;
  waiting.delete(threadId);
  emit();
  if (!body || (!body.ask && !body.result)) {
    // Take the sentence back: the composer still has it.
    commit((s) => {
      const t = threadById(s, threadId);
      return t ? putThread(s, { ...t, turns: t.turns.filter((x) => x.id !== me.id) }) : s;
    });
    return { ok: false, reason: response?.status === 429 ? "tooMany" : "failed" };
  }

  if (body.ask) {
    commit((s) => {
      const t = threadById(s, threadId);
      return t ? putThread(s, withTurn(t, { ...me, ask: body.ask })) : s;
    });
    return { ok: true };
  }

  const done: MeTurn = { ...me, result: body.result, ask: undefined };
  const reply: ThemTurn = {
    id: newId(),
    role: "them",
    at: Date.now(),
    who: thread.person,
    text: body.reply.text,
    ja: body.reply.ja,
    sig: body.reply.sig,
    parts: body.reply.parts,
    words: body.reply.words ?? [],
  };
  commit((s) => {
    const t = threadById(s, threadId);
    if (!t) return s;
    const next = withTurn(withTurn(t, done), reply);
    return recordResult(putThread(s, next), next, done, reply);
  });
  if (prefNow("sound", true)) void playAll(replyItems(reply, PEOPLE[thread.person].voice));
  return { ok: true };
}
