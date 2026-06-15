import styles from "./chrome.module.css";

export function SiteFooter() {
  return (
    <footer id="method" className={styles.footer}>
      <p className={styles.method}>
        A benchmark of single-prompt browser games. Each model was asked once to build Snake,
        Tetris and Breakout; the results are compared only by generation cost and token usage.
      </p>
      <p className={styles.attribution}>
        Model logos are trademarks of their respective owners, shown for identification only.
      </p>
    </footer>
  );
}
