import Link from "next/link";
import { GameTile } from "@/components/game-tile";
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
          <span className={styles.panelLabel}>Run summary</span>
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
              <dd>{totalCost ? `$${totalCost.toFixed(2)}` : "TBD"}</dd>
            </div>
          </dl>
        </aside>
        <nav className={styles.nav} aria-label="Game sections">
          <Link href="/" className={styles.navLink}>Index</Link>
          <Link href="/snake" className={styles.navLink}>Snake</Link>
          <Link href="/flappy" className={styles.navLink}>Flappy</Link>
        </nav>
      </header>

      <section className={styles.grid} aria-label={`${title} games`}>
        {entries.map((entry) => (
          <GameTile key={entry.id} entry={entry} />
        ))}
      </section>
    </main>
  );
}
