"use client";

import { BRANCHES, GROUPS, wordById, type Group } from "@/content/index.ts";
import { ja } from "@/lib/i18n/ja";
import { useRecord } from "@/lib/store";
import { useOpenBranch } from "../_parts/BranchHost";
import { BranchRow, Dots } from "../_parts/Ladder";
import page from "../_parts/page.module.css";
import styles from "./eda.module.css";

const t = ja.eda;
const ORDER: Group[] = ["does", "toward", "thing", "self", "attach"];

/** 枝: every branch, from its everyday word up, as a map to look over (not a list to fill in). */
export function Eda() {
  const state = useRecord();
  const open = useOpenBranch();
  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>
      <p className={page.lead}>{t.lead}</p>
      {ORDER.map((group) => (
        <section key={group} className={page.section}>
          <h2 className={page.h2}>{GROUPS[group].label}</h2>
          <p className={page.note}>{GROUPS[group].lead}</p>
          <ul className={styles.branches}>
            {BRANCHES.filter((b) => wordById(b.base)?.group === group).map((b) => (
              <li key={b.id}>
                <BranchRow branch={b} state={state} onWord={(word) => open({ word, from: { kind: "eda", id: b.id } })} />
              </li>
            ))}
          </ul>
          {group === "does" ? <p className={page.note}>{t.si}</p> : null}
        </section>
      ))}
      <section className={page.section}>
        <ul className={styles.legend}>
          {([1, 2, 3] as const).map((s) => (
            <li key={s}>
              <Dots stage={s} />
              {t.stages[s]}
            </li>
          ))}
        </ul>
        <p className={page.note}>{t.stageNote}</p>
      </section>
    </div>
  );
}
