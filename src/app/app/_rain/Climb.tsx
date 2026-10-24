"use client";

import { useEffect, useState } from "react";
import { PEOPLE, type Climb as ClimbContent, type PersonId } from "@/content/index.ts";
import { lineSound, playInTurn, stop, unlock } from "@/components/audio";
import { Icon } from "@/components/Icon";
import type { KoDiff } from "@/components/Ko";
import { prefNow } from "@/components/local";
import { diffRanges } from "@/lib/diff";
import { ja } from "@/lib/i18n/ja";
import type { State } from "@/lib/record";
import { LineView } from "../_parts/LineView";
import { lineMarks } from "../_parts/marks";
import styles from "./climb.module.css";

const t = ja.rain;

/**
 * 上げてみる: the same message, said to people higher and higher. Each step shows what changed from the one below
 * (underlined, the raised words coming up a step) and is heard in わたし's voice, then the person answers in theirs.
 */
export function Climb({ climb, state, since }: { climb: ClimbContent; state: State; since: number }) {
  const [at, setAt] = useState(0);
  const step = climb.steps[at];
  const prev = at > 0 ? climb.steps[at - 1].said : null;
  const top = at === climb.steps.length - 1;

  useEffect(() => () => stop(), []);

  function go(i: number) {
    unlock();
    setAt(i);
    const s = climb.steps[i];
    if (prefNow("sound", true)) {
      void playInTurn([s.said, ...(s.reply ? [s.reply] : [])].map((l) => ({ sound: lineSound(l), text: l.ko })), undefined, 350);
    }
  }

  // What changed from the step below: added letters underlined, and the lit words among them rise.
  const added: KoDiff[] = prev ? diffRanges(prev.ko, step.said.ko, "ko").added.map((r) => ({ ...r, kind: "ins" as const })) : [];
  const marks = lineMarks(step.said, state, since).map((m) => ({ ...m, rise: added.some((d) => d.start < m.end && d.end > m.start) }));

  return (
    <article className={styles.climb}>
      <h4 className={styles.title}>{climb.title}</h4>
      <ol className={styles.people}>
        {climb.steps.map((s, i) => {
          const person = PEOPLE[s.said.to as PersonId];
          return (
            <li key={s.said.id}>
              <button type="button" className={i === at ? `${styles.person} ${styles.here}` : i < at ? `${styles.person} ${styles.past}` : styles.person} onClick={() => go(i)} aria-current={i === at ? "step" : undefined}>
                {person.short}
              </button>
            </li>
          );
        })}
      </ol>
      <div key={step.said.id} className={styles.stage} style={{ "--step": at } as React.CSSProperties}>
        <LineView line={step.said} state={state} since={since} size="lg" marks={marks} diff={added} />
        {step.reply ? (
          <div className={styles.reply}>
            <LineView line={step.reply} state={state} since={since} />
          </div>
        ) : null}
      </div>
      <div className={styles.actions}>
        {top ? (
          <>
            <p className={styles.top}>{t.top}</p>
            <button type="button" className="btn-quiet" onClick={() => go(0)}>
              <Icon name="replay" size={16} />
              {t.again}
            </button>
          </>
        ) : (
          <button type="button" className="btn" onClick={() => go(at + 1)}>
            <Icon name="up" size={18} />
            {t.up}
            <span className={styles.toWhom}>{PEOPLE[climb.steps[at + 1].said.to as PersonId].short}</span>
          </button>
        )}
      </div>
    </article>
  );
}
