import Link from "next/link";
import { flappyEntries, snakeEntries } from "@/lib/games";
import styles from "./page.module.css";

const gameLinks = [
  {
    href: "/snake",
    name: "Snake",
    status: `${snakeEntries.length} model ${snakeEntries.length === 1 ? "run" : "runs"}`,
    text: "Movement, collision logic, scoring, and keyboard feel."
  },
  {
    href: "/flappy",
    name: "Flappy Bird",
    status: `${flappyEntries.length} model ${flappyEntries.length === 1 ? "run" : "runs"}`,
    text: "Timing, physics, obstacle generation, and polish."
  }
];

const comingSoon = ["Tetris"];

export default function HomePage() {
  const gameCount = snakeEntries.length + flappyEntries.length;
  const modelCount = new Set([...snakeEntries, ...flappyEntries].map((entry) => entry.model)).size;

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.brand}>
          <span className={styles.dot} /> AI Game Bench
        </div>
        <nav className={styles.mastheadActions} aria-label="Primary">
          <Link href="/snake" className={styles.mastheadLink}>Snake</Link>
          <Link href="/flappy" className={styles.mastheadLink}>Flappy</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Playable model evaluation</p>
          <h1 className={styles.title}>Benchmark AI with playable games.</h1>
          <p className={styles.description}>
            Play model-generated Snake and Flappy Bird outputs, then compare the details that
            reveal quality: controls, rules, timing, polish, tokens, and cost.
          </p>
          <div className={styles.actions}>
            <Link href="/snake" className={styles.primaryAction}>Try Snake</Link>
            <Link href="/flappy" className={styles.secondaryAction}>Try Flappy Bird</Link>
          </div>
        </div>

        <aside className={styles.preview} aria-label="App preview">
          <div className={styles.previewTopbar}>
            <span />
            <span />
            <span />
            <strong>comparison run</strong>
          </div>
          <div className={styles.previewScreen}>
            <div className={styles.gameBoard} aria-hidden="true">
              <span className={styles.food} />
              <span className={styles.snakeA} />
              <span className={styles.snakeB} />
              <span className={styles.snakeC} />
            </div>
            <div className={styles.previewPanel}>
              <span>GPT 5.4</span>
              <strong>Snake</strong>
              <dl>
                <div>
                  <dt>Score</dt>
                  <dd>18</dd>
                </div>
                <div>
                  <dt>Tokens</dt>
                  <dd>2,298</dd>
                </div>
                <div>
                  <dt>Cost</dt>
                  <dd>$0.023</dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
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
          <strong>2</strong>
        </div>
      </section>

      <section className={styles.games} aria-label="Choose a game">
        <div className={styles.sectionHeader}>
          <p className={styles.kicker}>Choose a benchmark</p>
          <h2 className={styles.sectionTitle}>Pick a game and compare the model outputs.</h2>
        </div>
        <div className={styles.gameGrid}>
          {gameLinks.map((game) => (
            <Link key={game.href} href={game.href} className={styles.gameCard}>
              <span className={styles.gameStatus}>{game.status}</span>
              <strong>{game.name}</strong>
              <p>{game.text}</p>
            </Link>
          ))}
          {comingSoon.map((name) => (
            <div key={name} className={styles.disabledCard} aria-disabled="true">
              <span className={styles.gameStatus}>Coming soon</span>
              <strong>{name}</strong>
              <p>Reserved for future prompts and model comparisons.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
