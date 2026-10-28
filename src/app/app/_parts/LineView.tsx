"use client";

import { useState } from "react";
import { roleOf, type Line } from "@/content/index.ts";
import { lineSound } from "@/components/audio";
import { Ko, type KoDiff, type KoMark } from "@/components/Ko";
import { Speak } from "@/components/Speak";
import { usePref } from "@/components/local";
import { ja } from "@/lib/i18n/ja";
import type { State } from "@/lib/record";
import { useOpenBranch } from "./BranchHost";
import { lineMarks } from "./marks";
import styles from "./line.module.css";

/**
 * Who says it to whom, by what they are to わたし, and whose the raised words are when it is a third person:
 * わたし → 할머니 ・ 친구のおばあさんのこと.
 */
export function WhoLine({ line }: { line: Line }) {
  return (
    <p className={styles.who}>
      <span>
        {roleOf(line.by)} {ja.who.to(roleOf(line.to))}
      </span>
      {line.about ? <span className={styles.about}>{ja.who.about(line.about)}</span> : null}
    </p>
  );
}

/** One prepared line: who to whom, the Korean with its words lit, its sound, and the translation when asked for. */
export function LineView({
  line,
  state,
  since = Infinity,
  size = "md",
  marks,
  diff,
  showWho = true,
}: {
  line: Line;
  state: State | null;
  since?: number;
  size?: "md" | "lg";
  /** Instead of the line's own (上げてみる lights what changed). */
  marks?: KoMark[];
  diff?: KoDiff[];
  showWho?: boolean;
}) {
  const open = useOpenBranch();
  const [always] = usePref("translation", false);
  const [ruby] = usePref("ruby", true);
  const [shown, setShown] = useState(false);
  return (
    <div className={styles.line}>
      {showWho ? <WhoLine line={line} /> : null}
      <div className={styles.row}>
        <p className={`${styles.text} ${size === "lg" ? styles.lg : ""} t-ko`} lang="ko">
          <Ko text={line.ko} marks={marks ?? lineMarks(line, state, since)} diff={diff} ruby={ruby} onWord={(word) => open({ word, text: line.ko })} />
        </p>
        <Speak sound={lineSound(line)} text={line.ko} label={ja.common.play} size="sm" />
      </div>
      {always || shown ? (
        <p className={styles.ja}>{line.ja}</p>
      ) : (
        <button type="button" className={styles.reveal} onClick={() => setShown(true)}>
          {ja.common.translation}
        </button>
      )}
    </div>
  );
}
