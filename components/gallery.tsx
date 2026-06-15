"use client";

import { RunCard } from "@/components/run-card";
import { gameDefinitions, type GameSlug, type Run } from "@/lib/games";
import { useFlip } from "@/lib/use-flip";
import styles from "./gallery.module.css";

type GalleryProps = {
  runs: Run[];
  stats: { costMin: number; costMax: number };
};

export function Gallery({ runs, stats }: GalleryProps) {
  const flipRef = useFlip<HTMLDivElement>(runs.map((r) => r.id).join(","));

  const grouped = new Map<GameSlug, Run[]>();
  for (const run of runs) {
    const list = grouped.get(run.gameSlug) ?? [];
    list.push(run);
    grouped.set(run.gameSlug, list);
  }

  if (runs.length === 0) {
    return <p className={styles.empty}>No builds match these filters.</p>;
  }

  return (
    <div ref={flipRef}>
      {gameDefinitions.map((game) => {
        const chapterRuns = grouped.get(game.slug);
        if (!chapterRuns || chapterRuns.length === 0) {
          return null;
        }

        return (
          <section key={game.slug} className={styles.chapter} aria-label={game.name}>
            <div className={styles.chapterHead}>
              <h2 className={styles.chapterName}>{game.name}</h2>
              <span className={styles.rule} />
            </div>
            <div className={styles.grid}>
              {chapterRuns.map((run, runIndex) => (
                <RunCard key={run.id} run={run} stats={stats} index={runIndex} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
