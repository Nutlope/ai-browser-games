import { MakerLogo } from "@/components/logos";
import { MagnitudeBar } from "@/components/magnitude-bar";
import { formatCost, formatMultiple, formatTokens } from "@/lib/format";
import type { ModelSummary } from "@/lib/games";
import styles from "./leaderboard.module.css";

export function Leaderboard({ models }: { models: ModelSummary[] }) {
  const costs = models
    .map((model) => model.avgCost)
    .filter((value): value is number => value != null);
  const min = costs.length ? Math.min(...costs) : 0;
  const max = costs.length ? Math.max(...costs) : 0;
  const baseline = min > 0 ? min : null;

  if (models.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Models ranked by average cost">
      <div className={styles.head}>
        <h2 className={styles.title}>Models by average cost</h2>
        <span className={styles.rule} />
        <span className={styles.note}>cheapest first, averaged across the 3 games</span>
      </div>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rankCol} scope="col">
                #
              </th>
              <th scope="col">Model</th>
              <th className={styles.num} scope="col">
                Avg cost
              </th>
              <th className={styles.num} scope="col">
                Vs cheapest
              </th>
              <th className={styles.num} scope="col">
                Total tokens
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr key={model.label} className={styles.row}>
                <td className={`${styles.rank} tnum`}>{index + 1}</td>
                <td>
                  <span className={styles.identity}>
                    <span className={styles.logo}>
                      {model.makerId ? <MakerLogo maker={model.makerId} size={16} /> : null}
                    </span>
                    <span className={styles.names}>
                      <span className={styles.model}>{model.label}</span>
                      <span className={styles.maker}>{model.makerName}</span>
                    </span>
                  </span>
                </td>
                <td className={styles.num}>
                  <span className="tnum">{formatCost(model.avgCost)}</span>
                  <span className={styles.bar}>
                    <MagnitudeBar value={model.avgCost} min={min} max={max} />
                  </span>
                </td>
                <td className={`${styles.num} tnum`}>
                  {model.avgCost != null && baseline ? formatMultiple(model.avgCost, baseline) : "--"}
                </td>
                <td className={`${styles.num} tnum`}>{formatTokens(model.totalTokens)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
