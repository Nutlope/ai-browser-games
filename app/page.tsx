import Link from "next/link";
import { allEntries, entriesByGame, gameDefinitions } from "@/lib/games";
import styles from "./page.module.css";

export default function HomePage() {
  const gameCount = allEntries.length;
  const modelCount = new Set(allEntries.map((entry) => entry.model)).size;
  const totalTokens = allEntries.reduce((sum, entry) => sum + (entry.totalTokens ?? 0), 0);
  const totalCost = allEntries.reduce((sum, entry) => sum + (entry.generationCostUsd ?? 0), 0);
  const pricedEntries = allEntries.filter((entry) => entry.generationCostUsd != null);
  const cheapestEntry = [...pricedEntries].sort(
    (a, b) => (a.generationCostUsd ?? Number.POSITIVE_INFINITY) - (b.generationCostUsd ?? Number.POSITIVE_INFINITY)
  )[0];
  const biggestEntry = [...allEntries].sort((a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0))[0];
  const tableEntries = [...allEntries]
    .sort((a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0))
    .slice(0, 6);
  const getEntryHref = (gameName: string) => {
    const definition = gameDefinitions.find((game) => game.name === gameName || game.title === gameName);

    return definition ? `/${definition.slug}` : "/";
  };

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.brand}>
          <span className={styles.dot} /> Bubble Bench
        </div>
        <nav className={styles.mastheadActions} aria-label="Primary">
          <Link href="#model-ledger" className={styles.mastheadLink}>
            Price table
          </Link>
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
          <h1 className={styles.title}>See what each model spent to make the game.</h1>
          <p className={styles.description}>
            Every tile is playable. Every run carries its token count and build cost, so the
            comparison is about more than which game feels best.
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

        <aside className={styles.heroBoard} aria-label="Benchmark totals">
          <span className={styles.bubbleMascot} aria-hidden="true" />
          <div className={styles.heroMetric}>
            <span>Total spend</span>
            <strong>{totalCost ? `$${totalCost.toFixed(3)}` : "TBD"}</strong>
            <p>Across generated playable outputs.</p>
          </div>
          <div className={styles.heroMetric}>
            <span>Total tokens</span>
            <strong>{totalTokens ? totalTokens.toLocaleString() : "TBD"}</strong>
            <p>Input and output tokens combined.</p>
          </div>
          <div className={styles.heroAside}>
            <span>Cheapest build</span>
            <strong>{cheapestEntry ? cheapestEntry.label : "TBD"}</strong>
            <p>{cheapestEntry?.generationCostUsd != null ? `$${cheapestEntry.generationCostUsd.toFixed(4)}` : "No price yet"}</p>
          </div>
          <div className={styles.heroAside}>
            <span>Most tokens</span>
            <strong>{biggestEntry ? biggestEntry.label : "TBD"}</strong>
            <p>{biggestEntry?.totalTokens ? biggestEntry.totalTokens.toLocaleString() : "No token count yet"}</p>
          </div>
        </aside>
      </section>

      <section className={styles.ledgerSection} id="model-ledger" aria-label="Model price and token ledger">
        <div className={styles.sectionHeader}>
          <p className={styles.kicker}>Model ledger</p>
          <h2 className={styles.sectionTitle}>Token-heavy and cost-light runs, side by side.</h2>
        </div>
        <div className={styles.ledgerWrap}>
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th>Run</th>
                <th>Game</th>
                <th>Model</th>
                <th>Tokens</th>
                <th>Build cost</th>
                <th>Play</th>
              </tr>
            </thead>
            <tbody>
              {tableEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.label}</td>
                  <td>{entry.game}</td>
                  <td>{entry.model}</td>
                  <td>{entry.totalTokens?.toLocaleString() ?? "TBD"}</td>
                  <td>{entry.generationCostUsd != null ? `$${entry.generationCostUsd.toFixed(4)}` : "TBD"}</td>
                  <td>
                    <Link href={getEntryHref(entry.game)} className={styles.tableLink}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tableEntries.length === 0 ? (
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
