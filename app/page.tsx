import Link from "next/link";
import { GameTile } from "@/components/game-tile";
import { flappyEntries, snakeEntries } from "@/lib/games";
import styles from "./page.module.css";

const sections = [
  {
    href: "/snake",
    title: "Snake",
    text: "See how different models handle classic grid movement, controls, and game feel."
  },
  {
    href: "/flappy",
    title: "Flappy",
    text: "Compare timing, animation, and polish on the same arcade prompt across models."
  }
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.brand}>
          <span className={styles.dot} />
          Games
        </div>
        <div className={styles.mastheadActions}>
          <span>Compare models</span>
          <Link href="/walkthrough" className={styles.mastheadLink}>
            View walkthrough
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.title}>Compare AI models building browser games.</h1>
        <p className={styles.description}>
          Play the outputs directly on this page. Each game keeps the generated result, model name,
          token usage, and cost together so you can compare quality across the board without
          clicking through a landing flow first.
        </p>
      </section>

      <section className={styles.summary} aria-label="Site summary">
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>What it is</span>
          <p className={styles.summaryText}>A playable comparison wall for model-generated games.</p>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>What you compare</span>
          <p className={styles.summaryText}>Gameplay feel, output quality, tokens, and spend.</p>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>How it grows</span>
          <p className={styles.summaryText}>Add more models and the gallery expands automatically.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{sections[0].title}</p>
            <h2 className={styles.sectionTitle}>Playable snake outputs</h2>
            <p className={styles.sectionText}>{sections[0].text}</p>
          </div>
          <Link href={sections[0].href} className={styles.sectionLink}>
            Open snake page
          </Link>
        </div>
        <div className={styles.grid}>
          {snakeEntries.map((entry) => (
            <GameTile key={entry.id} entry={entry} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{sections[1].title}</p>
            <h2 className={styles.sectionTitle}>Playable flappy outputs</h2>
            <p className={styles.sectionText}>{sections[1].text}</p>
          </div>
          <Link href={sections[1].href} className={styles.sectionLink}>
            Open flappy page
          </Link>
        </div>
        <div className={styles.grid}>
          {flappyEntries.map((entry) => (
            <GameTile key={entry.id} entry={entry} />
          ))}
        </div>
      </section>
    </main>
  );
}
