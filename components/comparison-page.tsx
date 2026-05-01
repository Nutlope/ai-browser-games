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
  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
          {note ? <p className={styles.note}>{note}</p> : null}
        </div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Index
          </Link>
          <Link href="/snake" className={styles.navLink}>
            Snake
          </Link>
          <Link href="/flappy" className={styles.navLink}>
            Flappy
          </Link>
        </nav>
      </div>

      <section className={styles.grid} aria-label={`${title} games`}>
        {entries.map((entry) => (
          <GameTile key={entry.id} entry={entry} />
        ))}
      </section>
    </main>
  );
}
