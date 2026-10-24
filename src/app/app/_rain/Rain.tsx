"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { branchById, RAINS, rainById, SCENES, wordsIn, type Rain as RainContent } from "@/content/index.ts";
import { lineSound, playInTurn, stop, unlock } from "@/components/audio";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { prefNow } from "@/components/local";
import { ja } from "@/lib/i18n/ja";
import { pickNext, recordVisit, setCurrent, type State } from "@/lib/record";
import { commit, useRecord } from "@/lib/store";
import { useOpenBranch } from "../_parts/BranchHost";
import { goToScene } from "../_parts/go";
import { BranchRow } from "../_parts/Ladder";
import { LineView } from "../_parts/LineView";
import page from "../_parts/page.module.css";
import { Climb } from "./Climb";
import styles from "./rain.module.css";

const t = ja.rain;

/** 浴びる: a rain of lines falls in, one by one with their voices; then 上げてみる. */
export function Rain() {
  const state = useRecord();
  const current = state?.current.rain;

  // The first time (or when the kept one is gone), the next rain is chosen and kept.
  useEffect(() => {
    if (state && (!current || !rainById(current))) commit((s) => setCurrent(s, { rain: pickNext(s, "rain") }));
  }, [state, current]);

  const rain = current ? rainById(current) : undefined;
  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>
      {state && rain ? <RainView key={rain.id} rain={rain} state={state} /> : <p className={page.skeleton}>{ja.common.loading}</p>}
    </div>
  );
}

const seen = (state: State, id: string) => state.visits.some((v) => v.kind === "rain" && v.id === id);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The scene that holds most of a rain's raised words, to say them there. */
function sceneFor(rainId: string): string | null {
  const words = wordsIn({ kind: "rain", id: rainId });
  const best = SCENES.map((s) => ({ id: s.id, n: wordsIn({ kind: "scene", id: s.id }).filter((w) => words.includes(w)).length })).sort((a, b) => b.n - a.n)[0];
  return best && best.n > 0 ? best.id : null;
}

function RainView({ rain, state }: { rain: RainContent; state: State }) {
  const router = useRouter();
  const open = useOpenBranch();
  const [before] = useState(() => seen(state, rain.id));
  // A rain bathed in before is all there at once; a new one falls in as it is played.
  const [shown, setShown] = useState(before ? rain.lines.length : 0);
  const [playing, setPlaying] = useState(false);
  const [choosing, setChoosing] = useState(false);
  // Violet for words met before this rain began, not for those met in it now.
  const [since] = useState(() => Date.now());
  const done = shown >= rain.lines.length;
  const finished = useRef(before);

  useEffect(() => () => stop(), []);

  // Once all of it has fallen, it counts as bathed in (its words met).
  useEffect(() => {
    if (done && !finished.current) {
      finished.current = true;
      commit((s) => recordVisit(s, "rain", rain.id));
    }
  }, [done, rain.id]);

  async function run() {
    unlock();
    setPlaying(true);
    if (prefNow("sound", true)) {
      await playInTurn(
        rain.lines.map((l) => ({ sound: lineSound(l), text: l.ko })),
        (i) => setShown((n) => Math.max(n, i + 1)),
      );
    } else {
      // Without sound the lines still fall, at a reading pace.
      for (let i = shown; i < rain.lines.length; i++) {
        setShown(i + 1);
        await wait(1000 + rain.lines[i].ko.length * 90);
      }
    }
    setShown(rain.lines.length);
    setPlaying(false);
  }

  const next = () => {
    stop();
    commit((s) => setCurrent(s, { rain: pickNext(s, "rain", Date.now(), rain.id) }));
  };
  const scene = sceneFor(rain.id);

  return (
    <>
      <section className={styles.head}>
        <h2 className={styles.title}>{rain.title}</h2>
        <p className={styles.lead}>{rain.lead}</p>
        <div className={styles.branches} aria-label={t.branches}>
          {rain.branches.map((id) => {
            const b = branchById(id);
            return b ? <BranchRow key={id} branch={b} onWord={(word) => open({ word, from: { kind: "rain", id: rain.id } })} /> : null;
          })}
        </div>
        <div className={styles.controls}>
          <button type="button" className="btn" onClick={() => (playing ? stop() : void run())}>
            <Icon name={done ? "replay" : "speaker"} size={20} />
            {done ? t.replay : t.playAll}
          </button>
        </div>
        {shown === 0 ? <p className={styles.hint}>{t.lead}</p> : null}
      </section>

      <ol className={styles.lines}>
        {rain.lines.slice(0, shown).map((line) => (
          <li key={line.id} className={styles.line}>
            <LineView line={line} state={state} since={since} />
          </li>
        ))}
      </ol>

      {done ? (
        <>
          <section className={page.section}>
            <h3 className={page.h2}>{t.climb}</h3>
            <p className={page.note}>{t.climbLead}</p>
            {rain.climbs.map((c) => (
              <Climb key={c.id} climb={c} state={state} since={since} />
            ))}
          </section>
          <div className={page.actions}>
            <button type="button" className="btn" onClick={next}>
              {t.next}
              <Icon name="arrow" size={18} />
            </button>
            {scene ? (
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  stop();
                  goToScene(scene);
                  router.push("/app/scene");
                }}
              >
                {t.toScene}
              </button>
            ) : null}
            <button type="button" className="btn-quiet" onClick={() => setChoosing(true)}>
              {t.choose}
            </button>
          </div>
        </>
      ) : null}

      <Sheet open={choosing} onClose={() => setChoosing(false)} closeLabel={ja.common.close} title={<p className={styles.sheetTitle}>{t.chooseTitle}</p>}>
        <ul className={page.rows}>
          {RAINS.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={page.row}
                onClick={() => {
                  stop();
                  setChoosing(false);
                  commit((s) => setCurrent(s, { rain: r.id }));
                }}
              >
                <span className={page.rowMain}>
                  <span className={page.rowTitle}>{r.title}</span>
                  <span className={`${page.rowSub} t-ko`} lang="ko">
                    {r.branches.join("・")}
                  </span>
                </span>
                {seen(state, r.id) ? <span className={page.met}>{t.met}</span> : null}
                <Icon name="arrow" size={16} />
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
