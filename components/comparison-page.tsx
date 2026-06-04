import Link from "next/link";
import { GameTile } from "@/components/game-tile";
import { gameDefinitions } from "@/lib/games";
import type { GameEntry } from "@/types/game";
import styles from "./comparison-page.module.css";

type ComparisonPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
  entries: GameEntry[];
};

export function ComparisonPage({
  eyebrow,
  title,
  description,
  note,
  entries
}: ComparisonPageProps) {
  const totalCost = entries.reduce((sum, entry) => sum + (entry.generationCostUsd ?? 0), 0);
  const totalTokens = entries.reduce((sum, entry) => sum + (entry.totalTokens ?? 0), 0);
  const sortedByCost = [...entries].sort(
    (a, b) => (a.generationCostUsd ?? Number.POSITIVE_INFINITY) - (b.generationCostUsd ?? Number.POSITIVE_INFINITY)
  );
  const cheapestEntry = sortedByCost.find((entry) => entry.generationCostUsd != null);
  const tokenHeaviestEntry = [...entries].sort((a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0))[0];
  const averageCost = totalCost && entries.length ? totalCost / entries.length : 0;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
          {note ? <p className={styles.note}>{note}</p> : null}
        </div>
        <aside className={styles.panel} aria-label="Run summary">
          <span className={styles.panelLabel}>Price receipt</span>
          <dl className={styles.stats}>
            <div>
              <dt>Builds</dt>
              <dd>{entries.length}</dd>
            </div>
            <div>
              <dt>Tokens</dt>
              <dd>{totalTokens ? totalTokens.toLocaleString() : "TBD"}</dd>
            </div>
            <div>
              <dt>Spend</dt>
              <dd>{totalCost ? `$${totalCost.toFixed(4)}` : "TBD"}</dd>
            </div>
            <div>
              <dt>Avg/run</dt>
              <dd>{averageCost ? `$${averageCost.toFixed(4)}` : "TBD"}</dd>
            </div>
          </dl>
        </aside>
        <nav className={styles.nav} aria-label="Game sections">
          <Link href="/" className={styles.navLink}>Index</Link>
          {gameDefinitions.map((game) => (
            <Link key={game.slug} href={`/${game.slug}`} className={styles.navLink}>
              {game.name}
            </Link>
          ))}
        </nav>
      </header>

      <section className={styles.scoreboard} aria-label={`${title} token and cost highlights`}>
        <div className={styles.scoreCard}>
          <span>Cheapest run</span>
          <strong>{cheapestEntry ? cheapestEntry.label : "TBD"}</strong>
          <p>{cheapestEntry?.generationCostUsd != null ? `$${cheapestEntry.generationCostUsd.toFixed(4)}` : "No cost recorded yet"}</p>
        </div>
        <div className={styles.scoreCard}>
          <span>Most tokens</span>
          <strong>{tokenHeaviestEntry ? tokenHeaviestEntry.label : "TBD"}</strong>
          <p>{tokenHeaviestEntry?.totalTokens ? `${tokenHeaviestEntry.totalTokens.toLocaleString()} tokens` : "No tokens recorded yet"}</p>
        </div>
        <div className={styles.scoreCard}>
          <span>Total receipt</span>
          <strong>{totalCost ? `$${totalCost.toFixed(4)}` : "TBD"}</strong>
          <p>{totalTokens ? `${totalTokens.toLocaleString()} total tokens` : "No token total yet"}</p>
        </div>
      </section>

      <section className={styles.ledgerSection} aria-label={`${title} model comparison table`}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Cost and token table</p>
          <h2 className={styles.sectionTitle}>Use the receipt before you pick a favorite.</h2>
        </div>
        <div className={styles.ledgerWrap}>
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th>Run</th>
                <th>Provider</th>
                <th>Model</th>
                <th>Input</th>
                <th>Output</th>
                <th>Total</th>
                <th>Cost</th>
                <th>Play</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.label}</td>
                  <td>{entry.provider ?? "TBD"}</td>
                  <td>{entry.model}</td>
                  <td>{entry.inputTokens?.toLocaleString() ?? "TBD"}</td>
                  <td>{entry.outputTokens?.toLocaleString() ?? "TBD"}</td>
                  <td>{entry.totalTokens?.toLocaleString() ?? "TBD"}</td>
                  <td>{entry.generationCostUsd != null ? `$${entry.generationCostUsd.toFixed(4)}` : "TBD"}</td>
                  <td>
                    <a href={`#${entry.id}`} className={styles.tableLink}>
                      Play
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 ? (
            <p className={styles.emptyLedger}>No generated runs yet for this game.</p>
          ) : null}
        </div>
      </section>

      <section className={styles.grid} aria-label={`${title} games`}>
        {entries.map((entry) => (
          <GameTile key={entry.id} entry={entry} />
        ))}
      </section>
    </main>
  );
}
