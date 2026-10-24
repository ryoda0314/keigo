"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { branchesOf, hits, isRaised, linesWith, rainOf, wordById } from "@/content/index.ts";
import { Icon } from "@/components/Icon";
import { Ko } from "@/components/Ko";
import { Sheet } from "@/components/Sheet";
import { usePref } from "@/components/local";
import { ja } from "@/lib/i18n/ja";
import { recordLooked, setCurrent, type EventKind, type State, type Where } from "@/lib/record";
import { commit, useRecord } from "@/lib/store";
import { BranchSteps } from "./Ladder";
import { LineView } from "./LineView";
import styles from "./branch.module.css";

/** A word to open: and, when it was pressed in a sentence, that sentence. */
export type BranchTarget = { word: string; text?: string; from?: Where };

const Open = createContext<(t: BranchTarget) => void>(() => undefined);

/** Opens a word's branch over whatever screen the learner is on. */
export function useOpenBranch() {
  return useContext(Open);
}

export function BranchHost({ children }: { children: ReactNode }) {
  // When it was opened: violet in it is for what was met before that, not for opening it.
  const [target, setTarget] = useState<(BranchTarget & { at: number }) | null>(null);
  const open = useCallback((t: BranchTarget) => setTarget({ ...t, at: Date.now() }), []);
  const close = useCallback(() => setTarget(null), []);
  const state = useRecord();

  // Opening a raised word is looking at it: kept, so it can come back.
  useEffect(() => {
    if (target && isRaised(target.word)) commit((s) => recordLooked(s, target.word, target.from ?? { kind: "eda", id: target.word }));
  }, [target]);

  const word = target ? wordById(target.word) : undefined;
  return (
    <Open.Provider value={open}>
      {children}
      <Sheet
        open={Boolean(target && word)}
        onClose={close}
        closeLabel={ja.common.close}
        title={
          word ? (
            <>
              <p className={styles.word} lang="ko">
                {word.id}
              </p>
              <p className={styles.ja}>{word.ja}</p>
            </>
          ) : null
        }
      >
        {target && word && state ? <BranchPanel target={target} state={state} onOpen={(w) => setTarget({ word: w, at: Date.now() })} onLeave={close} /> : null}
      </Sheet>
    </Open.Provider>
  );
}

function BranchPanel({
  target,
  state,
  onOpen,
  onLeave,
}: {
  target: BranchTarget & { at: number };
  state: State;
  onOpen: (word: string) => void;
  onLeave: () => void;
}) {
  const router = useRouter();
  const [ruby] = usePref("ruby", true);
  const word = wordById(target.word)!;
  const branches = branchesOf(word.id);
  const rare = branches.flatMap((b) => b.rare ?? []);
  const lines = linesWith(word.id);
  const rain = rainOf(word.id);
  const here = target.text ? hits(target.text, word.id)[0] : undefined;

  return (
    <>
      {target.text && here ? (
        <section className={styles.section}>
          <h3 className="label">{ja.branch.here}</h3>
          <p className={`${styles.here} t-ko`} lang="ko">
            <Ko text={target.text} marks={[{ ...trim(target.text, here), word: word.id, kind: "raised" }]} ruby={ruby} />
          </p>
        </section>
      ) : null}

      {branches.map((b) => (
        <section key={b.id} className={styles.section}>
          <BranchSteps branch={b} current={word.id} onWord={(w) => w !== word.id && onOpen(w)} />
        </section>
      ))}

      {word.note || word.hanja || rare.length ? (
        <section className={styles.section}>
          {word.note ? <p className={styles.note}>{word.note}</p> : null}
          {word.hanja ? (
            <p className={styles.small}>
              {ja.branch.hanja}：<span lang="ko">{word.hanja}</span>
            </p>
          ) : null}
          {rare.length ? (
            <p className={styles.small}>
              {ja.branch.rare}：
              {rare.map((r) => (
                <span key={r.ko} className={styles.rare}>
                  <span lang="ko">{r.ko}</span>（{r.ja}）
                </span>
              ))}
            </p>
          ) : null}
        </section>
      ) : null}

      {lines.length ? (
        <section className={styles.section}>
          <h3 className="label">{ja.branch.lines}</h3>
          <ul className={styles.lines}>
            {lines.map((l) => (
              <li key={l.id}>
                <LineView line={l} state={state} since={target.at} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isRaised(word.id) ? <History state={state} word={word.id} /> : null}

      {rain ? (
        <button
          type="button"
          className="btn-quiet"
          onClick={() => {
            commit((s) => setCurrent(s, { rain: rain.id }));
            onLeave();
            router.push("/app");
          }}
        >
          {ja.branch.toRain(rain.title)}
          <Icon name="arrow" size={16} />
        </button>
      ) : null}
    </>
  );
}

/** A core's hit without the space it leans on. */
function trim(text: string, r: { start: number; end: number }) {
  let { start, end } = r;
  while (start < end && !/[가-힣]/.test(text[start])) start++;
  while (end > start && !/[가-힣]/.test(text[end - 1])) end--;
  return { start, end };
}

function History({ state, word }: { state: State; word: string }) {
  const events = state.words[word]?.events ?? [];
  if (!events.length) return null;
  const counts = new Map<EventKind, number>();
  for (const e of events) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
  return (
    <section className={styles.section}>
      <h3 className="label">{ja.branch.history}</h3>
      <ul className={styles.counts}>
        {[...counts].map(([kind, n]) => (
          <li key={kind}>
            {ja.branch.kinds[kind]} <span className={styles.n}>{n}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
