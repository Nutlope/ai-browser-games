import Link from "next/link";
import styles from "./page.module.css";

const frames = [
  {
    title: "Overview",
    text: "The homepage opens straight into playable comparisons, with each model shown as its own game tile.",
    className: "overview"
  },
  {
    title: "Play In Place",
    text: "Click into any game iframe and play right there without leaving the gallery view.",
    className: "play"
  },
  {
    title: "Compare Metadata",
    text: "Every tile pairs the game with the model name, output tokens, total tokens, and generation cost.",
    className: "meta"
  }
];

export default function WalkthroughPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Walkthrough</p>
        <h1 className={styles.title}>How the site works</h1>
        <p className={styles.description}>
          This is a lightweight HTML walkthrough built from screenshots rather than a recorded video.
          It shows the main interaction flow: browse the comparison wall, click into a game, and scan
          model metadata without leaving the page.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.link}>
            Open homepage
          </Link>
          <Link href="/snake" className={styles.link}>
            Open snake page
          </Link>
          <Link href="/tetris-lite" className={styles.link}>
            Open Tetris-lite page
          </Link>
        </div>
      </header>

      <section className={styles.fullShotSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Full-page view</h2>
          <p className={styles.sectionText}>
            The gallery is meant to feel like a wall of AI-made games, not a list of links. You land
            on real playable outputs immediately.
          </p>
        </div>
        <figure className={styles.fullShotFrame}>
          <img
            src="/walkthrough/site-overview.png"
            alt="Full screenshot of the AI browser games comparison site"
            className={styles.fullShot}
          />
        </figure>
      </section>

      <section className={styles.framesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Walkthrough frames</h2>
          <p className={styles.sectionText}>
            A few still frames to show the most important behaviors without having to record a full
            screen capture.
          </p>
        </div>

        <div className={styles.framesGrid}>
          {frames.map((frame) => (
            <article key={frame.title} className={styles.card}>
              <div className={`${styles.shotFrame} ${styles[frame.className]}`}>
                <img
                  src="/walkthrough/site-overview.png"
                  alt={`${frame.title} screenshot`}
                  className={styles.croppedShot}
                />
              </div>
              <div className={styles.cardCopy}>
                <p className={styles.cardEyebrow}>{frame.title}</p>
                <p className={styles.cardText}>{frame.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
