"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { branchById, rainById, sceneOf, type Rain as RainContent } from "@/content/index.ts";
import { lineSound, playInTurn, stop, unlock } from "@/components/audio";
import { Icon } from "@/components/Icon";
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
import { Steps, type StepId } from "./Steps";
import styles from "./rain.module.css";

const t = ja.rain;

/** 浴びる: a rain of lines falls in, one by one with their voices; then 上げてみる, one climb at a time. */
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

const STEPS: { step: StepId; label: string }[] = [
  { step: "rain", label: t.steps.rain },
  { step: "climb", label: t.steps.climb },
  { step: "scene", label: t.steps.scene },
];

function RainView({ rain, state }: { rain: RainContent; state: State }) {
  const router = useRouter();
  const open = useOpenBranch();
  const [before] = useState(() => seen(state, rain.id));
  // A rain bathed in before is all there at once; a new one falls in as it is played.
  const [shown, setShown] = useState(before ? rain.lines.length : 0);
  const [playing, setPlaying] = useState(false);
  // 浴びる, then 上げてみる: each on its own, so the climbs do not pile up under the rain.
  const [stage, setStage] = useState<"rain" | "climb">("rain");
  const [climbAt, setClimbAt] = useState(0);
  const [tops, setTops] = useState<Set<number>>(() => new Set());
  // Violet for words met before this rain began, not for those met in it now.
  const [since] = useState(() => Date.now());
  const done = shown >= rain.lines.length;
  const finished = useRef(before);
  const scene = sceneOf(rain.id);
  // Gone on to its scene, the last step of the set: this rain is through, so 浴びる brings the next one. Set only once the
  // page has left, or the next rain would show for a moment on the way out.
  const through = useRef(false);

  useEffect(
    () => () => {
      stop();
      if (through.current) commit((s) => setCurrent(s, { rain: pickNext(s, "rain", Date.now(), rain.id) }));
    },
    [rain.id],
  );

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

  function toScene() {
    if (!scene) return;
    stop();
    through.current = true;
    goToScene(scene);
    router.push("/app/scene");
  }

  function go(step: StepId) {
    stop();
    if (step === "scene") return toScene();
    setStage(step);
    window.scrollTo({ top: 0 });
  }

  function nextClimb() {
    stop();
    setClimbAt(climbAt + 1);
    window.scrollTo({ top: 0 });
  }

  const climb = rain.climbs[climbAt];
  const lastClimb = climbAt === rain.climbs.length - 1;
  // One way on from 上げてみる, along the set: the next climb, then the scene. No 次の雨 here: the next rain comes once
  // the scene has been gone to.
  const onward = !lastClimb ? rain.climbs[climbAt + 1].title : t.steps.scene;
  const goOn = () => (lastClimb ? toScene() : nextClimb());

  return (
    <>
      <Steps steps={STEPS} current={stage} open={done ? ["rain", "climb", ...(scene ? (["scene"] as const) : [])] : ["rain"]} onPick={go} />

      {stage === "rain" ? (
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
              <button type="button" className={done ? "btn-quiet" : "btn"} onClick={() => (playing ? stop() : void run())}>
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
            <div className={page.actions}>
              <button type="button" className="btn" onClick={() => go("climb")}>
                <Icon name="up" size={18} />
                {t.toClimb}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <section className={styles.head}>
            <p className={styles.kicker}>
              {rain.title}
              {rain.climbs.length > 1 ? <span className={styles.count}>{t.climbCount(climbAt + 1, rain.climbs.length)}</span> : null}
            </p>
            <p className={page.note}>{t.climbLead}</p>
          </section>
          {climb ? <Climb key={climb.id} climb={climb} state={state} since={since} onTop={() => setTops((x) => new Set(x).add(climbAt))} /> : null}
          <div className={page.actions}>
            <button type="button" className={tops.has(climbAt) ? "btn" : "btn-quiet"} onClick={goOn}>
              {t.onward}
              <span className={styles.whither}>{onward}</span>
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </>
      )}

    </>
  );
}
