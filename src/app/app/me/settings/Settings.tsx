"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ME_CHOICES, SPEEDS, type Speed } from "@/components/audio";
import { Icon } from "@/components/Icon";
import { useChoice, usePref } from "@/components/local";
import { ja } from "@/lib/i18n/ja";
import { useRecord } from "@/lib/store";
import { account, resetRecord, signOut, type Account } from "@/lib/sync";
import page from "../../_parts/page.module.css";
import styles from "./settings.module.css";

const t = ja.settings;

/** 設定とアカウント: how to hear and see, the ことのあめ account, and clearing the record. */
export function Settings() {
  const state = useRecord();
  const [sound, setSound] = usePref("sound", true);
  const [translation, setTranslation] = usePref("translation", false);
  const [ruby, setRuby] = usePref("ruby", true);
  const [speed, setSpeed] = useChoice<Speed>("speed", SPEEDS, "1");
  const [voice, setVoice] = useChoice<(typeof ME_CHOICES)[number]>("voice", ME_CHOICES, "f");
  const [me, setMe] = useState<Account | null | undefined>(undefined);
  const [done, setDone] = useState(false);
  useEffect(() => {
    void account().then(setMe);
  }, []);

  return (
    <div className={page.page}>
      <header className={page.bar}>
        <Link href="/app/me" className={page.iconLink} aria-label={ja.common.back}>
          <Icon name="back" size={22} />
        </Link>
        <h1 className={page.barTitle}>{t.title}</h1>
      </header>

      <section className={page.section}>
        <h2 className={page.h2}>{t.listen}</h2>
        <label className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.sound}</span>
            <span className={page.note}>{t.soundLead}</span>
          </span>
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
        </label>
        <div className={styles.toggle}>
          <span className={styles.toggleTitle}>{t.speed}</span>
          <span className={styles.choices} role="group" aria-label={t.speed}>
            {SPEEDS.map((s) => (
              <button key={s} type="button" className="btn-quiet" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                {t.speeds[s]}
              </button>
            ))}
          </span>
        </div>
        <div className={styles.toggle}>
          <span>
            <span className={styles.toggleTitle}>{t.voice}</span>
            <span className={page.note}>{t.voiceLead}</span>
          </span>
          <span className={styles.choices} role="group" aria-label={t.voice}>
            {ME_CHOICES.map((v) => (
              <button key={v} type="button" className="btn-quiet" aria-pressed={voice === v} onClick={() => setVoice(v)}>
                {t.voices[v]}
              </button>
            ))}
          </span>
        </div>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.see}</h2>
        <label className={styles.toggle}>
          <span className={styles.toggleTitle}>{t.ruby}</span>
          <input type="checkbox" checked={ruby} onChange={(e) => setRuby(e.target.checked)} />
        </label>
        <label className={styles.toggle}>
          <span className={styles.toggleTitle}>{t.translation}</span>
          <input type="checkbox" checked={translation} onChange={(e) => setTranslation(e.target.checked)} />
        </label>
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.account}</h2>
        {me ? (
          <>
            <p className={styles.text}>{t.linked(me.email ?? "")}</p>
            <p className={page.note}>{t.linkedLead}</p>
            <div className={page.actions}>
              <button
                type="button"
                className="btn-quiet"
                onClick={async () => {
                  await signOut();
                  setMe(null);
                }}
              >
                {t.unlink}
              </button>
            </div>
          </>
        ) : me === null ? (
          <>
            <p className={page.note}>{t.linkLead}</p>
            <div className={page.actions}>
              <Link href="/login?next=/app/me/settings" className="btn">
                {t.link}
              </Link>
            </div>
          </>
        ) : null}
      </section>

      <section className={page.section}>
        <h2 className={page.h2}>{t.record}</h2>
        {state ? <p className={page.note}>{t.size(Object.keys(state.words).length, state.threads.length)}</p> : null}
        <div className={page.actions}>
          <button
            type="button"
            className="btn-quiet"
            onClick={async () => {
              if (!window.confirm(me ? t.resetLinkedConfirm : t.resetConfirm)) return;
              await resetRecord();
              setDone(true);
            }}
          >
            {me ? t.resetLinked : t.reset}
          </button>
        </div>
        {done ? <p className={page.note}>{t.done}</p> : null}
      </section>
    </div>
  );
}
