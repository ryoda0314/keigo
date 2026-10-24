"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { wordById } from "@/content/index.ts";
import { Icon } from "@/components/Icon";
import { ja } from "@/lib/i18n/ja";
import { grown, setCurrent, stageOf, type State } from "@/lib/record";
import { commit, useRecord } from "@/lib/store";
import { account, type Account } from "@/lib/sync";
import { useOpenBranch } from "../_parts/BranchHost";
import page from "../_parts/page.module.css";
import styles from "./me.module.css";

const t = ja.me;

/** 自分: the learner's own history. Counts are theirs, never compared, never a score. */
export function Me() {
  const state = useRecord();
  const [me, setMe] = useState<Account | null | undefined>(undefined);
  useEffect(() => {
    void account().then(setMe);
  }, []);
  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
        <div className={page.barActions}>
          <Link href="/app/me/settings" className={page.barButton}>
            {t.settingsLink}
          </Link>
        </div>
      </header>
      <p className={page.lead}>{t.lead}</p>
      {state ? <MeView state={state} /> : <p className={page.skeleton}>{ja.common.loading}</p>}
      <section className={page.section}>
        <p className={page.note}>{me ? t.linkedShort(me.email ?? "") : me === null ? t.localShort : ""}</p>
        {me === null ? (
          <div className={page.actions}>
            <Link href="/login?next=/app/me" className="btn-quiet">
              {t.connect}
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MeView({ state }: { state: State }) {
  const open = useOpenBranch();
  const done = grown(state);
  const rains = new Set(state.visits.filter((v) => v.kind === "rain").map((v) => v.id)).size;
  const scenes = state.threads.filter((x) => x.kind === "scene").length;
  const said = state.threads.reduce((n, x) => n + x.turns.filter((u) => u.role === "me").length, 0);
  const own = Object.keys(state.words).filter((k) => stageOf(state, k) === 3).length;
  return (
    <>
      <section className={page.section}>
        <h2 className={page.h2}>{t.sofar}</h2>
        <dl className={styles.stats}>
          <div>
            <dt>{t.stats.rains}</dt>
            <dd>{rains}</dd>
          </div>
          <div>
            <dt>{t.stats.scenes}</dt>
            <dd>{scenes}</dd>
          </div>
          <div>
            <dt>{t.stats.said}</dt>
            <dd>{said}</dd>
          </div>
          <div>
            <dt>{t.stats.own}</dt>
            <dd>{own}</dd>
          </div>
        </dl>
        <p className={page.note}>{t.sofarNote}</p>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.grown}</h2>
        <p className={page.note}>{t.grownLead}</p>
        {done.length ? (
          <ul className={styles.grown}>
            {done.slice(0, 20).map((g) => (
              <li key={`${g.key}${g.at}`}>
                <p className={styles.grownHead}>
                  <button type="button" className={styles.word} onClick={() => open({ word: g.key })} lang="ko">
                    {g.key}
                  </button>
                  <span className={styles.grownLabel}>{wordById(g.key)?.ja}</span>
                </p>
                {g.text ? (
                  <p className={`${styles.grownText} t-ko`} lang="ko">
                    {g.text}
                  </p>
                ) : null}
                <p className={styles.grownMeta}>{t.grownItem(g.before)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={page.empty}>{t.grownEmpty}</p>
        )}
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.threads}</h2>
        {state.threads.length ? (
          <ul className={page.rows}>
            {state.threads.slice(0, 20).map((x) => {
              const last = [...x.turns].reverse().find((u) => u.role === "me");
              return (
                <li key={x.id}>
                  <Link href="/app/scene" className={page.row} onClick={() => commit((s) => setCurrent(s, { scene: x.ref, sceneThread: x.id }))}>
                    <span className={page.rowMain}>
                      <span className={page.rowTitle}>{x.title}</span>
                      {last && last.role === "me" ? (
                        <span className={`${page.rowSub} t-ko`} lang="ko">
                          {last.result?.corrected ?? last.input}
                        </span>
                      ) : null}
                    </span>
                    <Icon name="arrow" size={16} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={page.empty}>{t.threadsEmpty}</p>
        )}
      </section>
    </>
  );
}
