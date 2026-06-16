import Image from "next/image";
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
      <a
        href="https://www.together.ai"
        target="_blank"
        rel="noreferrer"
        className={styles.madeBy}
      >
        Made by
        <Image
          src="/together-logo.png"
          alt="Together AI"
          width={86}
          height={18}
          className={styles.madeByLogo}
        />
      </a>
    </footer>
  );
}
