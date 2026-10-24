"use client";

import { useState } from "react";
import { PEOPLE, wordById } from "@/content/index.ts";
import { meVoiceName, replyItems } from "@/components/audio";
import { Icon } from "@/components/Icon";
import { Ko } from "@/components/Ko";
import { Speak } from "@/components/Speak";
import { usePref } from "@/components/local";
import { diffRanges } from "@/lib/diff";
import { ja } from "@/lib/i18n/ja";
import type { MeTurn, ThemTurn, Thread } from "@/lib/record";
import { useRecord } from "@/lib/store";
import { send, useWaiting } from "@/lib/talk";
import { useOpenBranch } from "./BranchHost";
import { litMarks } from "./marks";
import styles from "./conversation.module.css";

const t = ja.turn;

/** A conversation's turns: the person's replies and the learner's sentences with their corrections. */
export function Conversation({ thread }: { thread: Thread }) {
  const waiting = useWaiting(thread.id);
  return (
    <ol className={styles.turns}>
      {thread.turns.map((turn, i) =>
        turn.role === "them" ? <ThemView key={turn.id} turn={turn} /> : <MeView key={turn.id} turn={turn} thread={thread} last={i === thread.turns.length - 1} />,
      )}
      {waiting ? (
        <li className={styles.waiting} aria-live="polite">
          <span className={styles.dots} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="sr-only">{ja.composer.sending}</span>
        </li>
      ) : null}
    </ol>
  );
}

function ThemView({ turn }: { turn: ThemTurn }) {
  const state = useRecord();
  const open = useOpenBranch();
  const [always] = usePref("translation", false);
  const [ruby] = usePref("ruby", true);
  const [shown, setShown] = useState(false);
  const person = PEOPLE[turn.who];
  const sound = turn.line ? { line: turn.line } : turn.sig ? { sig: turn.sig, voice: person.voice } : null;
  const sequence = turn.line ? undefined : replyItems(turn, person.voice);
  return (
    <li className={styles.them}>
      <p className={styles.who}>{person.short}</p>
      <div className={styles.line}>
        <p className={`${styles.text} t-ko`} lang="ko">
          <Ko text={turn.text} marks={litMarks(turn.text, turn.words, state, turn.at)} ruby={ruby} onWord={(word) => open({ word, text: turn.text })} />
        </p>
        <Speak sound={sound} text={turn.text} label={ja.common.play} size="sm" sequence={sequence} />
      </div>
      {turn.ja ? (
        always || shown ? (
          <p className={styles.ja}>{turn.ja}</p>
        ) : (
          <button type="button" className={styles.reveal} onClick={() => setShown(true)}>
            {ja.common.translation}
          </button>
        )
      ) : null}
    </li>
  );
}

function SupportTags({ turn }: { turn: MeTurn }) {
  const tags: string[] = [];
  if (turn.spoken) tags.push(t.spoken);
  if (turn.support?.samples) tags.push(t.support[turn.support.samples]);
  return tags.length ? (
    <span className={styles.tags}>
      {tags.map((x) => (
        <span key={x} className={styles.tag}>
          {x}
        </span>
      ))}
    </span>
  ) : null;
}

function MeView({ turn, thread, last }: { turn: MeTurn; thread: Thread; last: boolean }) {
  const state = useRecord();
  const open = useOpenBranch();
  const waiting = useWaiting(thread.id);
  const [ruby] = usePref("ruby", true);
  const [details, setDetails] = useState(false);
  const r = turn.result;

  if (!r) {
    return (
      <li className={styles.me}>
        <p className={styles.meHead}>
          {ja.common.me}
          <SupportTags turn={turn} />
        </p>
        <p className={styles.input}>{turn.input}</p>
        {turn.ask && last ? <Ask turn={turn} thread={thread} /> : !turn.ask && !waiting ? <Unanswered turn={turn} thread={thread} /> : null}
      </li>
    );
  }

  const { removed, added } = diffRanges(turn.input, r.corrected, "ko");
  const own = r.words.filter((w) => w.origin === "mine").length;
  return (
    <li className={styles.me}>
      <p className={styles.meHead}>
        {ja.common.me}
        <SupportTags turn={turn} />
        {r.natural ? <span className={`${styles.tag} ${styles.good}`}>{t.natural}</span> : null}
      </p>
      {r.natural ? null : (
        <p className={`${styles.input} t-ko`} lang="ko">
          <Ko text={turn.input} diff={removed.map((x) => ({ ...x, kind: "del" as const }))} />
        </p>
      )}
      <div className={styles.line}>
        <p className={`${styles.fixed} t-ko`} lang="ko">
          <Ko
            text={r.corrected}
            marks={litMarks(r.corrected, r.words, state, turn.at)}
            diff={added.map((x) => ({ ...x, kind: "ins" as const }))}
            ruby={ruby}
            onWord={(word) => open({ word, text: r.corrected })}
          />
        </p>
        <Speak sound={r.sig ? { sig: r.sig, voice: meVoiceName() } : null} text={r.corrected} label={ja.common.play} size="sm" />
      </div>
      <button type="button" className={styles.more} onClick={() => setDetails(!details)} aria-expanded={details}>
        <span>
          {[r.words.length ? `${t.wordsShort} ${r.words.length}${own ? `（${t.origin.mine} ${own}）` : ""}` : null, r.gaps.length ? `${t.gapsShort} ${r.gaps.length}` : null]
            .filter(Boolean)
            .join(" · ") || t.details}
        </span>
        <Icon name={details ? "back" : "arrow"} size={14} />
      </button>
      {details ? (
        <div className={styles.details}>
          {r.note ? (
            <section>
              <h4 className="label">{t.why}</h4>
              <p className={styles.note}>{r.note}</p>
            </section>
          ) : null}
          {r.words.length ? (
            <section>
              <h4 className="label">{t.words}</h4>
              <ul className={styles.phrases}>
                {r.words.map((w) => {
                  const word = wordById(w.word);
                  return (
                    <li key={`${w.word}${w.start}`}>
                      <button type="button" className={styles.phrase} onClick={() => open({ word: w.word, text: r.corrected })}>
                        <span className={styles.phraseText}>
                          <span className="t-ko" lang="ko">
                            {w.word}
                          </span>
                          <span className={styles.phraseLabel}>
                            {word?.base?.join("・")} → {word?.ja}
                          </span>
                        </span>
                        <span className={w.origin === "mine" ? `${styles.tag} ${styles.good}` : styles.tag}>{t.origin[w.origin]}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          {r.gaps.length ? (
            <section>
              <h4 className="label">{t.gaps}</h4>
              <table className={styles.gaps}>
                <tbody>
                  {r.gaps.map((g) => (
                    <tr key={g.ja}>
                      <td className="t-ja">{g.ja}</td>
                      <td className="t-ko" lang="ko">
                        {g.ko}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.small}>{t.gapsNote}</p>
            </section>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/** A sentence whose answer never came back (the page was left on the way): it can go again as it is. */
function Unanswered({ turn, thread }: { turn: MeTurn; thread: Thread }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={styles.ask}>
      <p className={styles.small}>{failed ? ja.composer.failed : t.unanswered}</p>
      <div className={styles.askOptions}>
        <button
          type="button"
          className="btn-quiet"
          onClick={async () => {
            const res = await send(thread.id, turn.input, { support: turn.support, spoken: turn.spoken, again: turn.id });
            setFailed(!res.ok);
          }}
        >
          {t.sendAgain}
        </button>
      </div>
    </div>
  );
}

/** The AI asked what the learner meant: they choose, and the same sentence goes again with that meaning. */
function Ask({ turn, thread }: { turn: MeTurn; thread: Thread }) {
  const busy = useWaiting(thread.id);
  return (
    <div className={styles.ask}>
      <p className={styles.askQ}>{turn.ask!.question}</p>
      <div className={styles.askOptions}>
        {turn.ask!.options.map((o) => (
          <button
            key={o}
            type="button"
            className="btn-quiet"
            disabled={busy}
            onClick={() => void send(thread.id, turn.input, { support: turn.support, spoken: turn.spoken, intent: o, again: turn.id })}
          >
            {o}
          </button>
        ))}
      </div>
      <p className={styles.small}>{t.askOr}</p>
    </div>
  );
}
