"use client";

import { useRef } from "react";
import type { GameEntry } from "@/types/game";
import styles from "./game-tile.module.css";

type GameTileProps = {
  entry: GameEntry;
};

export function GameTile({ entry }: GameTileProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const metadata = [
    {
      label: "Model",
      value: entry.model
    },
    {
      label: "Output",
      value: entry.outputTokens?.toLocaleString() ?? "TBD"
    },
    {
      label: "Total",
      value: entry.totalTokens?.toLocaleString() ?? "TBD"
    },
    {
      label: "Cost",
      value: entry.generationCostUsd != null ? `$${entry.generationCostUsd.toFixed(3)}` : "TBD"
    }
  ];

  const focusFrame = () => {
    iframeRef.current?.focus();
  };

  return (
    <article className={styles.tile}>
      <header className={styles.header}>
        <div>
          <span className={styles.label}>{entry.label}</span>
          <p className={styles.provider}>
            {[entry.provider, entry.game].filter(Boolean).join(" · ")}
          </p>
        </div>
      </header>
      <div className={styles.frameWrap}>
        <iframe
          ref={iframeRef}
          className={styles.frame}
          title={entry.label}
          srcDoc={entry.html}
          sandbox="allow-scripts"
          loading="lazy"
          tabIndex={0}
          onPointerDown={focusFrame}
        />
      </div>
      <dl className={styles.metaGrid}>
        {metadata.map((item) => (
          <div key={item.label} className={styles.metaItem}>
            <dt className={styles.metaLabel}>{item.label}</dt>
            <dd className={styles.metaValue}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
