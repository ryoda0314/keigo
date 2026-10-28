"use client";

import { useEffect, useState } from "react";
import { PEOPLE, PLACES, SCENES, sceneById, wordsIn, type PlaceId, type Scene } from "@/content/index.ts";
import { stop, unlock } from "@/components/audio";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { ja } from "@/lib/i18n/ja";
import { pickNext, recordMet, sentAsSample, setCurrent, threadById, type State, type Thread } from "@/lib/record";
import { commit, useRecord } from "@/lib/store";
import { lineTurn, send, startThread, useWaiting } from "@/lib/talk";
import { Composer } from "../_parts/Composer";
import { Conversation } from "../_parts/Conversation";
import { goToScene } from "../_parts/go";
import { LineView } from "../_parts/LineView";
import page from "../_parts/page.module.css";
import styles from "./scene.module.css";

const t = ja.scene;

/** 場面で言う: a person's line and わたし's own circumstances; how to answer is the learner's to decide. */
export function ScenePage() {
  const state = useRecord();
  const current = state?.current.scene;
  useEffect(() => {
    if (state && (!current || !sceneById(current))) goToScene(pickNext(state, "scene"));
  }, [state, current]);
  // Leaving the screen stops what is playing.
  useEffect(() => () => stop(), []);
  const scene = current ? sceneById(current) : undefined;
  return (
    <div className={page.page}>
      <header className={page.bar}>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>
      {state && scene ? <SceneView key={scene.id} scene={scene} state={state} /> : <p className={page.skeleton}>{ja.common.loading}</p>}
    </div>
  );
}

function SceneView({ scene, state }: { scene: Scene; state: State }) {
  const [samples, setSamples] = useState(false);
  const [fill, setFill] = useState<{ text: string; n: number } | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [since] = useState(() => Date.now());
  const thread: Thread | undefined = state.current.sceneThread ? threadById(state, state.current.sceneThread) : undefined;
  const busy = useWaiting(thread?.id ?? null);
  const person = PEOPLE[scene.line.by as keyof typeof PEOPLE];

  const openSamples = () => {
    setSamples(true);
    commit((s) => recordMet(s, wordsIn({ kind: "scene", id: scene.id }), { kind: "scene", id: scene.id }));
  };

  async function onSend(text: string, spoken: boolean) {
    let id = thread?.id;
    if (!id) {
      id = startThread({ kind: "scene", ref: scene.id, person: person.id, title: scene.title, first: lineTurn(scene.line) }).id;
      commit((s) => setCurrent(s, { sceneThread: id }));
    }
    // Samples opened before answering are support; a sample sent as it was is borrowing.
    const support = samples ? { samples: sentAsSample(text, scene.samples.map((s) => s.ko)) ? ("borrowed" as const) : ("opened" as const) } : undefined;
    return send(id, text, { spoken, support });
  }

  const next = () => {
    unlock();
    goToScene(pickNext(state, "scene", Date.now(), scene.id), true);
  };

  return (
    <>
      <section className={styles.card}>
        <p className={styles.theme}>
          {PLACES[scene.place]} · {person.role}
        </p>
        <h2 className={styles.title}>{scene.title}</h2>
        <p className={styles.situation}>{scene.situation}</p>
        <div className={styles.line}>
          <LineView line={scene.line} state={state} since={since} size="lg" />
        </div>
        <div className={styles.mine}>
          <p className="label">{t.mine}</p>
          <p className={styles.mineText}>{scene.mine}</p>
        </div>
      </section>

      {thread ? <Conversation thread={{ ...thread, turns: thread.turns.slice(1) }} /> : <p className={styles.ask}>{t.ask}</p>}

      {samples ? (
        <section className={styles.samples}>
          <h3 className="label">{thread ? t.otherReplies : t.samplesTitle}</h3>
          <p className={page.note}>{t.samplesNote}</p>
          <ul className={styles.sampleList}>
            {scene.samples.map((s, i) => (
              <li key={s.ko}>
                <p className={styles.puts}>{s.puts}</p>
                <LineView line={{ id: `${scene.id}.s${i + 1}`, by: "me", to: scene.line.by, ko: s.ko, ja: s.ja, marks: s.marks }} state={state} since={since} showWho={false} />
                {!thread ? (
                  <button type="button" className={styles.use} onClick={() => setFill({ text: s.ko, n: (fill?.n ?? 0) + 1 })}>
                    {t.use}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={page.actions}>
        {!samples ? (
          <button type="button" className="btn-quiet" onClick={openSamples}>
            {thread ? t.otherReplies : t.samples}
          </button>
        ) : null}
        {thread ? (
          <button type="button" className="btn-quiet" onClick={next}>
            {t.next}
            <Icon name="arrow" size={16} />
          </button>
        ) : null}
        <button type="button" className="btn-quiet" onClick={() => setChoosing(true)}>
          {t.choose}
        </button>
      </div>

      <Composer draftKey={thread ? `scene-thread:${thread.id}` : `scene:${scene.id}`} busy={busy} onSend={onSend} fill={thread ? null : fill} />

      <Sheet open={choosing} onClose={() => setChoosing(false)} closeLabel={ja.common.close} title={<p className={styles.sheetTitle}>{t.chooseTitle}</p>}>
        {(Object.keys(PLACES) as PlaceId[]).map((place) => (
          <section key={place} className={styles.pick}>
            <h3 className="label">{PLACES[place]}</h3>
            <ul className={page.rows}>
              {SCENES.filter((s) => s.place === place).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={page.row}
                    onClick={() => {
                      unlock();
                      setChoosing(false);
                      goToScene(s.id, true);
                    }}
                  >
                    <span className={page.rowMain}>
                      <span className={page.rowTitle}>{s.title}</span>
                      <span className={`${page.rowSub} t-ko`} lang="ko">
                        {s.line.ko}
                      </span>
                    </span>
                    {state.threads.some((x) => x.kind === "scene" && x.ref === s.id) ? <span className={page.met}>{ja.rain.met}</span> : null}
                    <Icon name="arrow" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Sheet>
    </>
  );
}
