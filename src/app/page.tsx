import Link from "next/link";
import { hits } from "@/content/index.ts";
import { Ko, type KoMark } from "@/components/Ko";
import { Logo } from "@/components/Logo";
import { diffRanges } from "@/lib/diff";
import { ja } from "@/lib/i18n/ja";
import styles from "./page.module.css";

const t = ja.intro;

/** The sample's raised words, with the everyday word above each. */
function sampleMarks(text: string): KoMark[] {
  const lit = (word: string, ruby: string): KoMark[] => hits(text, word).map((h) => ({ ...h, word, kind: "raised", ruby }));
  return [...lit("진지", "밥"), ...lit("드시다", "먹다")];
}

export default function Home() {
  const { removed, added } = diffRanges(t.sample.input, t.sample.fixed, "ko");
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo size="lg" href={null} />
      </header>
      <section className={styles.hero}>
        <h1 className={styles.lead}>{t.lead}</h1>
        <figure className={styles.figure}>
          <p className={styles.tag}>{t.sampleLabel.input}</p>
          <p className={`${styles.before} t-ko`} lang="ko">
            <Ko text={t.sample.input} diff={removed.map((r) => ({ ...r, kind: "del" as const }))} />
          </p>
          <p className={styles.tag}>{t.sampleLabel.fixed}</p>
          <p className={`${styles.after} t-ko`} lang="ko">
            <Ko text={t.sample.fixed} marks={sampleMarks(t.sample.fixed)} diff={added.map((r) => ({ ...r, kind: "ins" as const }))} />
          </p>
        </figure>
        {t.body.map((p) => (
          <p key={p} className={styles.body}>
            {p}
          </p>
        ))}
        <Link href="/app" className={`btn ${styles.start}`}>
          {t.start}
        </Link>
        <p className={styles.note}>{t.note}</p>
        <Link href="/login?next=/app" className={styles.link}>
          {t.link}
        </Link>
      </section>
    </div>
  );
}
