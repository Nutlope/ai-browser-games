import { normalize } from "@/lib/format";
import styles from "./magnitude-bar.module.css";

type MagnitudeBarProps = {
  value: number | null | undefined;
  min: number;
  max: number;
  delay?: number;
  ariaLabel?: string;
};

/**
 * A grayscale magnitude bar. Cheap-vs-expensive (or few-vs-many) reads
 * pre-attentively from fill width alone, never from color.
 */
export function MagnitudeBar({ value, min, max, delay = 0, ariaLabel }: MagnitudeBarProps) {
  const ratio = normalize(value, min, max);
  const pct = Math.max(ratio * 100, value != null ? 2 : 0);

  return (
    <div
      className={styles.track}
      role="img"
      aria-label={ariaLabel ?? `relative magnitude ${Math.round(ratio * 100)} percent`}
    >
      <div
        className={styles.fill}
        style={{ width: `${pct}%`, animationDelay: `${delay}ms` }}
      />
    </div>
  );
}
