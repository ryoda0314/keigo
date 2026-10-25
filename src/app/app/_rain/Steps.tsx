import { Icon } from "@/components/Icon";
import styles from "./steps.module.css";

export type StepId = "rain" | "climb" | "scene";

const ICONS = { rain: "rain", climb: "up", scene: "scene" } as const;

/**
 * Where the learner is in this rain, as in ことのおと: the steps on a track, those behind checked, this one lit, those
 * ahead faint. A step that can be gone to (`open`) is pressed to go there. A guide, not a score: nothing is counted.
 */
export function Steps({
  steps,
  current,
  open,
  onPick,
}: {
  steps: { step: StepId; label: string }[];
  current: StepId;
  open: StepId[];
  onPick: (step: StepId) => void;
}) {
  const at = steps.findIndex((s) => s.step === current);
  return (
    <ol className={styles.steps} aria-label="この雨の流れ" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => {
        const state = i < at ? "done" : i === at ? "now" : "next";
        return (
          <li key={s.step} className={styles.step} data-state={state} aria-current={state === "now" ? "step" : undefined}>
            <button type="button" className={styles.go} disabled={state === "now" || !open.includes(s.step)} onClick={() => onPick(s.step)}>
              <span className={styles.node} aria-hidden="true">
                <Icon name={state === "done" ? "check" : ICONS[s.step]} size={20} />
              </span>
              <span className={styles.label}>
                <span className={styles.number}>{i + 1}</span>
                {s.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
