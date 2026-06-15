"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring } from "motion/react";
import { GameFrame } from "@/components/game-frame";
import { MakerLogo } from "@/components/logos";
import { MagnitudeBar } from "@/components/magnitude-bar";
import { formatCost, formatTokens } from "@/lib/format";
import type { Run } from "@/lib/games";
import type { SortDir, SortKey } from "@/lib/runs-view";
import { useFlip } from "@/lib/use-flip";
import styles from "./compare-table.module.css";

type CompareTableProps = {
  runs: Run[];
  stats: { costMin: number; costMax: number; tokenMin: number; tokenMax: number };
  sort: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
};

const POPUP_W = 280;
const POPUP_H = 320;
const GAP = 22;

export function CompareTable({ runs, stats, sort, dir, onSort }: CompareTableProps) {
  const flipRef = useFlip<HTMLTableSectionElement>(`${runs.map((r) => r.id).join(",")}`);
  const [hovered, setHovered] = useState<Run | null>(null);
  const [enabled, setEnabled] = useState(false);
  const x = useSpring(0, { stiffness: 350, damping: 32, mass: 0.6 });
  const y = useSpring(0, { stiffness: 350, damping: 32, mass: 0.6 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const place = (clientX: number, clientY: number, jump: boolean) => {
    let nextX = clientX + GAP;
    let nextY = clientY + GAP;
    if (nextX + POPUP_W > window.innerWidth - 12) nextX = clientX - POPUP_W - GAP;
    if (nextY + POPUP_H > window.innerHeight - 12) nextY = clientY - POPUP_H - GAP;
    nextX = Math.max(12, nextX);
    nextY = Math.max(12, nextY);
    if (jump) {
      x.jump(nextX);
      y.jump(nextY);
    } else {
      x.set(nextX);
      y.set(nextY);
    }
  };

  if (runs.length === 0) {
    return <p className={styles.empty}>No builds match these filters.</p>;
  }

  const sortableHead = (key: SortKey, label: string) => (
    <button
      type="button"
      className={styles.sortBtn}
      data-on={sort === key}
      onClick={() => onSort(key)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span className={styles.caret} aria-hidden="true">
        {sort === key ? (dir === "asc" ? "↑" : "↓") : ""}
      </span>
    </button>
  );

  return (
    <div
      className={styles.wrap}
      onMouseMove={(event) => {
        if (enabled && hovered) place(event.clientX, event.clientY, false);
      }}
      onMouseLeave={() => setHovered(null)}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thLeft} scope="col">
              Model
            </th>
            <th scope="col">Game</th>
            <th className={styles.thNum} scope="col">
              {sortableHead("cost", "Cost")}
            </th>
            <th className={styles.thNum} scope="col">
              {sortableHead("tokens", "Total")}
            </th>
            <th className={styles.thNum} scope="col">
              In
            </th>
            <th className={styles.thNum} scope="col">
              Out
            </th>
          </tr>
        </thead>
        <tbody ref={flipRef}>
          {runs.map((run) => (
            <tr
              key={run.id}
              data-flip-id={run.id}
              className={styles.row}
              data-active={hovered?.id === run.id}
              onMouseEnter={(event) => {
                if (!enabled) return;
                setHovered(run);
                place(event.clientX, event.clientY, true);
              }}
            >
              <td className={styles.tdLeft}>
                <a
                  className={styles.identity}
                  href={`/${run.gameSlug}?model=${encodeURIComponent(run.id)}`}
                >
                  <span className={styles.logo}>
                    {run.maker ? <MakerLogo maker={run.maker.id} size={16} /> : null}
                  </span>
                  <span className={styles.names}>
                    <span className={styles.model}>{run.label}</span>
                    <span className={styles.maker}>{run.maker?.name ?? "Unknown"}</span>
                  </span>
                </a>
              </td>
              <td className={styles.game}>{run.game}</td>
              <td className={styles.num}>
                <span className="tnum">{formatCost(run.generationCostUsd)}</span>
                <span className={styles.cellBar}>
                  <MagnitudeBar
                    value={run.generationCostUsd}
                    min={stats.costMin}
                    max={stats.costMax}
                  />
                </span>
              </td>
              <td className={`${styles.num} tnum`}>{formatTokens(run.totalTokens)}</td>
              <td className={`${styles.num} ${styles.muted} tnum`}>
                {formatTokens(run.inputTokens)}
              </td>
              <td className={`${styles.num} ${styles.muted} tnum`}>
                {formatTokens(run.outputTokens)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AnimatePresence>
        {enabled && hovered ? (
          <motion.div
            key="table-preview"
            className={styles.popup}
            style={{ x, y, width: POPUP_W }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.5 }}
          >
            <GameFrame
              key={hovered.id}
              html={hovered.html}
              title={`${hovered.label} ${hovered.game} preview`}
              className={styles.popupFrame}
            />
            <div className={styles.popupCaption}>
              <span className={styles.popupLogo}>
                {hovered.maker ? <MakerLogo maker={hovered.maker.id} size={15} /> : null}
              </span>
              <span className={styles.popupModel}>{hovered.label}</span>
              <span className={styles.popupGame}>{hovered.game}</span>
              <span className={`${styles.popupCost} tnum`}>
                {formatCost(hovered.generationCostUsd)}
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
