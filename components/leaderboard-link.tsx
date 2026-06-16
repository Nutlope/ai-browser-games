"use client";

import styles from "./chrome.module.css";

/**
 * Header link to the "Models by average cost" table. When the table is on the
 * current page (home) it scrolls straight to it instantly; otherwise it falls
 * back to navigating home with the #leaderboard anchor. The scroll is instant
 * (no smooth animation) by design.
 */
export function LeaderboardLink() {
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("leaderboard");
    if (!target) {
      return; // not on this page: let the link navigate to /#leaderboard
    }
    event.preventDefault();
    target.scrollIntoView({ behavior: "auto", block: "start" });
    history.replaceState(null, "", "#leaderboard");
  };

  return (
    <a href="/#leaderboard" className={styles.navLink} onClick={onClick}>
      Models by avg cost
    </a>
  );
}
