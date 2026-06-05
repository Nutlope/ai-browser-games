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
  costFocused?: boolean;
};

export function ComparisonPage({
  eyebrow,
  title,
  description,
  note,
  entries,
  costFocused = false
}: ComparisonPageProps) {
  const totalCost = entries.reduce((sum, entry) => sum + (entry.generationCostUsd ?? 0), 0);
  const totalTokens = entries.reduce((sum, entry) => sum + (entry.totalTokens ?? 0), 0);
  const sortedByCost = [...entries].sort(
    (a, b) => (a.generationCostUsd ?? Number.POSITIVE_INFINITY) - (b.generationCostUsd ?? Number.POSITIVE_INFINITY)
  );
  const cheapestEntry = sortedByCost.find((entry) => entry.generationCostUsd != null);
  const mostExpensiveEntry = [...entries]
    .filter((entry) => entry.generationCostUsd != null)
    .sort((a, b) => (b.generationCostUsd ?? 0) - (a.generationCostUsd ?? 0))[0];
  const tokenHeaviestEntry = [...entries].sort((a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0))[0];
  const cheapestToMostExpensiveMultiple =
    cheapestEntry?.generationCostUsd && mostExpensiveEntry?.generationCostUsd
      ? mostExpensiveEntry.generationCostUsd / cheapestEntry.generationCostUsd
      : undefined;

  function formatCostMultiple(multiple: number) {
    return multiple >= 10 ? multiple.toFixed(0) : multiple.toFixed(1);
  }

  function getRelativeCost(entry: GameEntry) {
    if (entry.generationCostUsd == null || !cheapestEntry?.generationCostUsd) {
      return "TBD";
    }

    const multiple = entry.generationCostUsd / cheapestEntry.generationCostUsd;

    if (multiple === 1) {
      return "Cheapest";
    }

    return `${formatCostMultiple(multiple)}x more expensive`;
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href="/" className={styles.eyebrow}>{eyebrow}</Link>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
          {note ? <p className={styles.note}>{note}</p> : null}
        </div>
        <nav className={styles.nav} aria-label="Game sections">
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
          <p>
            {cheapestEntry?.generationCostUsd != null
              ? `$${cheapestEntry.generationCostUsd.toFixed(4)}${
                  cheapestToMostExpensiveMultiple
                    ? ` · ${formatCostMultiple(cheapestToMostExpensiveMultiple)}x cheaper than priciest`
                    : ""
                }`
              : "No cost recorded yet"}
          </p>
        </div>
        {costFocused ? (
          <div className={styles.scoreCard}>
            <span>Most expensive run</span>
            <strong>{mostExpensiveEntry ? mostExpensiveEntry.label : "TBD"}</strong>
            <p>
              {mostExpensiveEntry?.generationCostUsd != null
                ? `$${mostExpensiveEntry.generationCostUsd.toFixed(4)}`
                : "No cost recorded yet"}
            </p>
          </div>
        ) : null}
        <div className={styles.scoreCard}>
          <span>Most tokens</span>
          <strong>{tokenHeaviestEntry ? tokenHeaviestEntry.label : "TBD"}</strong>
          <p>{tokenHeaviestEntry?.totalTokens ? `${tokenHeaviestEntry.totalTokens.toLocaleString()} tokens` : "No tokens recorded yet"}</p>
        </div>
        {costFocused ? null : (
          <div className={styles.scoreCard}>
            <span>Total receipt</span>
            <strong>{totalCost ? `$${totalCost.toFixed(4)}` : "TBD"}</strong>
            <p>{totalTokens ? `${totalTokens.toLocaleString()} total tokens` : "No token total yet"}</p>
          </div>
        )}
      </section>

      <section className={styles.ledgerSection} aria-label={`${title} model comparison table`}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Cost and token table</p>
        </div>
        <div className={styles.ledgerWrap}>
          <table className={styles.ledgerTable}>
            <thead>
              {costFocused ? (
                <tr>
                  <th>Run</th>
                  <th>Provider</th>
                  <th>Model</th>
                  <th>Total tokens</th>
                  <th>Cost</th>
                  <th>Relative cost</th>
                </tr>
              ) : (
                <tr>
                  <th>Run</th>
                  <th>Provider</th>
                  <th>Model</th>
                  <th>Input</th>
                  <th>Output</th>
                  <th>Total</th>
                  <th>Cost</th>
                </tr>
              )}
            </thead>
            <tbody>
              {(costFocused ? sortedByCost : entries).map((entry) =>
                costFocused ? (
                  <tr key={entry.id}>
                    <td>{entry.label}</td>
                    <td>{entry.provider ?? "TBD"}</td>
                    <td>{entry.model}</td>
                    <td>{entry.totalTokens?.toLocaleString() ?? "TBD"}</td>
                    <td>{entry.generationCostUsd != null ? `$${entry.generationCostUsd.toFixed(4)}` : "TBD"}</td>
                    <td>{getRelativeCost(entry)}</td>
                  </tr>
                ) : (
                  <tr key={entry.id}>
                    <td>{entry.label}</td>
                    <td>{entry.provider ?? "TBD"}</td>
                    <td>{entry.model}</td>
                    <td>{entry.inputTokens?.toLocaleString() ?? "TBD"}</td>
                    <td>{entry.outputTokens?.toLocaleString() ?? "TBD"}</td>
                    <td>{entry.totalTokens?.toLocaleString() ?? "TBD"}</td>
                    <td>{entry.generationCostUsd != null ? `$${entry.generationCostUsd.toFixed(4)}` : "TBD"}</td>
                  </tr>
                )
              )}
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
