"use client";

import Link from "next/link";
import { GameFrame } from "@/components/game-frame";
import { MakerLogo } from "@/components/logos";
import { MagnitudeBar } from "@/components/magnitude-bar";
import { formatCost, formatTokens } from "@/lib/format";
import type { Run } from "@/lib/games";
import styles from "./run-card.module.css";

type RunCardProps = {
  run: Run;
  stats: { costMin: number; costMax: number };
  index?: number;
};

export function RunCard({ run, stats, index = 0 }: RunCardProps) {
  const maker = run.maker;

  return (
    <Link
      href={`/${run.gameSlug}?model=${encodeURIComponent(run.id)}`}
      className={styles.card}
      data-flip-id={run.id}
      aria-label={`Play ${run.label} ${run.game}, generated for ${formatCost(
        run.generationCostUsd
      )}`}
    >
      <div className={styles.media}>
        <div className={styles.poster} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" className={styles.posterGlyph}>
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </div>
        <GameFrame
          html={run.html}
          title={`${run.label} ${run.game} preview`}
          lazy
          className={styles.preview}
        />
        <span className={styles.playTag} aria-hidden="true">
          Play
          <svg viewBox="0 0 24 24" width="11" height="11">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </span>
        {run.broken ? <span className={styles.brokenPill}>Failed to run</span> : null}
      </div>

      <div className={styles.caption}>
        <div className={styles.identity}>
          <span className={styles.logo} data-maker={maker?.id}>
            {maker ? <MakerLogo maker={maker.id} size={20} /> : null}
          </span>
          <span className={styles.names}>
            <span className={styles.model}>{run.label}</span>
            <span className={styles.maker}>{maker?.name ?? "Unknown maker"}</span>
          </span>
        </div>

        <div className={styles.cost}>
          <span className={`${styles.costValue} tnum`}>{formatCost(run.generationCostUsd)}</span>
          <span className={styles.costUnit}>USD/run</span>
        </div>
        <MagnitudeBar
          value={run.generationCostUsd}
          min={stats.costMin}
          max={stats.costMax}
          delay={index * 35}
          ariaLabel={`cost relative to other runs`}
        />

        <div className={`${styles.tokens} tnum`}>
          {formatTokens(run.totalTokens)}
          <span className={styles.tokensSplit}>
            {run.inputTokens != null && run.outputTokens != null
              ? ` · in ${formatTokens(run.inputTokens)} · out ${formatTokens(run.outputTokens)}`
              : " tokens"}
          </span>
        </div>
      </div>
    </Link>
  );
}
