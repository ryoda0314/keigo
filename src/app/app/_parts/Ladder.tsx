"use client";

import { GROUPS, wordById, type Branch, type Word } from "@/content/index.ts";
import { ja } from "@/lib/i18n/ja";
import { stageOf, type State } from "@/lib/record";
import styles from "./ladder.module.css";

/** How far the learner has come with a word, as up to three small dots (never a score). */
export function Dots({ stage }: { stage: 0 | 1 | 2 | 3 }) {
  return (
    <span className={styles.dots} aria-label={ja.eda.stages[stage]} title={ja.eda.stages[stage]}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= stage ? styles.on : undefined} />
      ))}
    </span>
  );
}

/** The raised words of a branch, highest first; those at one height that do different things are kept apart. */
function levels(branch: Branch): Word[][] {
  const limbs = branch.limbs.map((id) => wordById(id)!).filter(Boolean);
  return [2, 1].map((h) => limbs.filter((w) => w.height === h)).filter((row) => row.length);
}

/**
 * A branch as steps: the everyday word at the bottom, each raised word a step higher, with what it means and who it is
 * for. A fork (目上の人がする／目上の人にする) shows which side each word is on.
 */
export function BranchSteps({ branch, current, onWord }: { branch: Branch; current?: string; onWord?: (word: string) => void }) {
  const base = wordById(branch.base)!;
  const fork = new Set(branch.limbs.map((id) => wordById(id)?.group)).size > 1;
  const rows = levels(branch);
  const step = (w: Word, height: number) => (
    <li key={w.id} className={styles.step} style={{ "--h": height } as React.CSSProperties}>
      <button type="button" className={w.id === current ? `${styles.word} ${styles.current}` : styles.word} onClick={() => onWord?.(w.id)} lang="ko">
        {w.id}
      </button>
      <span className={styles.meaning}>
        {fork && w.height > 0 ? <span className={styles.side}>{GROUPS[w.group].label}</span> : null}
        <span>{w.ja}</span>
        {w.who ? <span className={styles.whoFor}>{w.who}</span> : null}
      </span>
    </li>
  );
  return (
    <ol className={styles.steps}>
      {rows.flatMap((row) => row.map((w) => step(w, w.height)))}
      {step(base, 0)}
    </ol>
  );
}

/** A branch in one line, from the everyday word up: 먹다 › 드시다 › 잡수시다. With `state`, each raised word has its dots. */
export function BranchRow({ branch, state, onWord }: { branch: Branch; state?: State | null; onWord: (word: string) => void }) {
  const rows = levels(branch).reverse();
  return (
    <div className={styles.row}>
      <button type="button" className={`${styles.chip} ${styles.base}`} onClick={() => onWord(branch.base)} lang="ko">
        {branch.base}
      </button>
      {rows.map((row, i) => (
        <span key={i} className={styles.level}>
          <span className={styles.sep} aria-hidden="true">
            ›
          </span>
          {row.map((w, k) => (
            <span key={w.id} className={styles.level}>
              {k > 0 ? (
                <span className={styles.or} aria-hidden="true">
                  ／
                </span>
              ) : null}
              <button type="button" className={styles.chip} onClick={() => onWord(w.id)} lang="ko">
                {w.id}
                {state ? <Dots stage={stageOf(state, w.id)} /> : null}
              </button>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
