import Link from "next/link";
import { allEntries, entriesByGame, gameDefinitions } from "@/lib/games";
import styles from "./page.module.css";

export default function HomePage() {
  const gameCount = allEntries.length;
  const modelCount = new Set(allEntries.map((entry) => entry.model)).size;
  const pricedEntries = allEntries.filter((entry) => entry.generationCostUsd != null);
  const modelComparisons = Array.from(
    pricedEntries.reduce((groups, entry) => {
      const current = groups.get(entry.label) ?? [];
      current.push(entry);
      groups.set(entry.label, current);

      return groups;
    }, new Map<string, typeof pricedEntries>())
  )
    .map(([label, entries]) => {
      const costs = entries.map((entry) => entry.generationCostUsd ?? 0);
      const averageCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      const cheapestRun = [...entries].sort(
        (a, b) => (a.generationCostUsd ?? Number.POSITIVE_INFINITY) - (b.generationCostUsd ?? Number.POSITIVE_INFINITY)
      )[0];

      return {
        label,
        entries,
        averageCost,
        cheapestRun
      };
    })
    .sort((a, b) => a.averageCost - b.averageCost);
  const baselineModel =
    modelComparisons.find((comparison) => comparison.label === "MiniMax M2.7") ?? modelComparisons[0];
  const kimiComparison = modelComparisons.find((comparison) => comparison.label === "Kimi K2.6");
  const opusComparison = modelComparisons.find((comparison) => comparison.label === "Opus 4.8");
  const gptComparison = modelComparisons.find((comparison) => comparison.label === "GPT 5.5");
  const formatShortModelName = (label: string) => (label === "MiniMax M2.7" ? "M2.7" : label);
  const comparisonCards = [
    {
      label: "Cheapest average",
      value: baselineModel ? formatShortModelName(baselineModel.label) : "TBD",
      detail: baselineModel ? `$${baselineModel.averageCost.toFixed(4)} avg/run` : "No price yet"
    },
    {
      label: "Opus vs MiniMax",
      value: formatCostMultiple(opusComparison, baselineModel),
      detail: opusComparison && baselineModel ? `$${opusComparison.averageCost.toFixed(4)} avg/run` : "No price yet"
    },
    {
      label: "GPT 5.5 vs MiniMax",
      value: formatCostMultiple(gptComparison, baselineModel),
      detail: gptComparison && baselineModel ? `$${gptComparison.averageCost.toFixed(4)} avg/run` : "No price yet"
    },
    {
      label: "Kimi vs Opus",
      value: formatCostMultiple(opusComparison, kimiComparison),
      detail: opusComparison && kimiComparison ? "Opus 4.8 vs Kimi K2.6" : "No price yet"
    }
  ];

  function formatCostMultiple(
    comparison: (typeof modelComparisons)[number] | undefined,
    baseline: (typeof modelComparisons)[number] | undefined
  ) {
    if (!comparison || !baseline?.averageCost) {
      return "TBD";
    }

    const multiple = comparison.averageCost / baseline.averageCost;

    if (multiple === 1) {
      return "Baseline";
    }

    return `${multiple >= 10 ? multiple.toFixed(0) : multiple.toFixed(1)}x`;
  };

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.brand}>
          <span className={styles.dot} /> AI Browser Games
        </div>
        <nav className={styles.mastheadActions} aria-label="Primary">
          {gameDefinitions.map((game) => (
            <Link key={game.slug} href={`/${game.slug}`} className={styles.mastheadLink}>
              {game.name}
            </Link>
          ))}
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Playable games, priced honestly.</p>
          <h1 className={styles.title}>LLM game benchmarks</h1>
          <p className={styles.description}>
            Watch different AI models build the same game to see the difference in quality and price.
          </p>
          <div className={styles.actions}>
            <Link href="/snake" className={styles.primaryAction}>
              Play Snake runs
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="#model-ledger" className={styles.secondaryAction}>
              Compare tokens
            </Link>
          </div>
        </div>

        <aside className={styles.heroBoard} aria-label="Average model cost comparisons">
          <span className={styles.bubbleMascot} aria-hidden="true" />
          {comparisonCards.map((card, index) => (
            <div key={card.label} className={index < 2 ? styles.heroMetric : styles.heroAside}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </div>
          ))}
        </aside>
      </section>

      <section className={styles.ledgerSection} id="model-ledger" aria-label="Model price and token ledger">
        <div className={styles.sectionHeader}>
          <p className={styles.kicker}>Model averages</p>
          <h2 className={styles.sectionTitle}>Average build cost, compared against MiniMax.</h2>
        </div>
        <div className={styles.ledgerWrap}>
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Runs</th>
                <th>Avg build cost</th>
                <th>Vs MiniMax</th>
                <th>Cheapest run</th>
                <th>Cheapest cost</th>
              </tr>
            </thead>
            <tbody>
              {modelComparisons.map((comparison) => (
                <tr key={comparison.label}>
                  <td>{comparison.label}</td>
                  <td>{comparison.entries.length}</td>
                  <td>${comparison.averageCost.toFixed(4)}</td>
                  <td>{formatCostMultiple(comparison, baselineModel)}</td>
                  <td>{comparison.cheapestRun.game}</td>
                  <td>{comparison.cheapestRun.generationCostUsd != null ? `$${comparison.cheapestRun.generationCostUsd.toFixed(4)}` : "TBD"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {modelComparisons.length === 0 ? (
            <p className={styles.emptyLedger}>Generate a game run to populate the price table.</p>
          ) : null}
        </div>
      </section>

      <section className={styles.games} aria-label="Choose a game">
        <div className={styles.sectionHeader}>
          <p className={styles.kicker}>Play the benchmarks</p>
          <h2 className={styles.sectionTitle}>Pick a game, then judge cost against feel.</h2>
        </div>
        <div className={styles.gameGrid}>
          {gameDefinitions.map((game, index) => {
            const entries = entriesByGame[game.slug];
            const gameTokens = entries.reduce((sum, entry) => sum + (entry.totalTokens ?? 0), 0);
            const gameCost = entries.reduce((sum, entry) => sum + (entry.generationCostUsd ?? 0), 0);

            return (
              <Link
                key={game.slug}
                href={`/${game.slug}`}
                className={styles.gameCard}
                data-accent={index % 4}
              >
                <span className={styles.gameStatus}>
                  {entries.length ? `${entries.length} playable runs` : "Waiting for runs"}
                </span>
                <strong>{game.name}</strong>
                <p>{game.cardText}</p>
                <dl>
                  <div>
                    <dt>Tokens</dt>
                    <dd>{gameTokens ? gameTokens.toLocaleString() : "TBD"}</dd>
                  </div>
                  <div>
                    <dt>Cost</dt>
                    <dd>{gameCost ? `$${gameCost.toFixed(3)}` : "TBD"}</dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.metrics} aria-label="Current benchmark size">
        <div>
          <span>Playable outputs</span>
          <strong>{gameCount}</strong>
        </div>
        <div>
          <span>Models compared</span>
          <strong>{modelCount}</strong>
        </div>
        <div>
          <span>Game prompts</span>
          <strong>{gameDefinitions.length}</strong>
        </div>
      </section>
    </main>
  );
}
