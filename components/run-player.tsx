"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GameFrame } from "@/components/game-frame";
import { MakerLogo } from "@/components/logos";
import { formatCost, formatTokens, formatTokensFull } from "@/lib/format";
import type { Run } from "@/lib/games";
import styles from "./run-player.module.css";

type RunPlayerProps = {
  runs: Run[];
  initialId: string;
};

const GAME_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  " ",
  "w",
  "a",
  "s",
  "d",
  "W",
  "A",
  "S",
  "D"
]);

export function RunPlayer({ runs, initialId }: RunPlayerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const frameWrapRef = useRef<HTMLDivElement>(null);

  const initial = runs.find((run) => run.id === initialId) ?? runs[0];
  const [selectedId, setSelectedId] = useState(initial?.id);
  const [reloadKey, setReloadKey] = useState(0);

  const selected = runs.find((run) => run.id === selectedId) ?? runs[0];

  const [copied, setCopied] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      setReloadKey((key) => key + 1);
      router.replace(`${pathname}?model=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router, pathname]
  );

  const copyLink = useCallback(() => {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Stop the page from scrolling when game keys are pressed on the play page.
  // The keys still reach the game while its iframe is focused (those events
  // fire inside the frame and never reach this listener); this only catches
  // the case where focus is on the page, which is what caused the page to
  // jump up/down while playing. Keys aimed at real controls are left alone.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!GAME_KEYS.has(event.key)) return;
      const active = document.activeElement;
      const tag = active?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (active instanceof HTMLElement && active.isContentEditable);
      const onControl = tag === "BUTTON" || tag === "A";
      if (!typing && !onControl) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!selected) {
    return null;
  }

  const maker = selected.maker;
  const restart = () => setReloadKey((key) => key + 1);
  const goFullscreen = () => frameWrapRef.current?.requestFullscreen?.();
  const total = selected.totalTokens ?? 0;
  const inputPct = total ? ((selected.inputTokens ?? 0) / total) * 100 : 0;

  return (
    <div className={styles.player}>
      <div className={styles.spread}>
        <div className={styles.main}>
          <div className={styles.nowPlaying}>
            <span className={styles.npLabel}>Now playing</span>
            <span className={styles.npMaker}>
              <span className={styles.npLogo}>
                {maker ? <MakerLogo maker={maker.id} size={16} /> : null}
              </span>
              {selected.label}
            </span>
            {selected.broken ? <span className={styles.brokenTag}>Failed to run</span> : null}
            <span className={styles.controls}>
              <button type="button" className={styles.ctrl} onClick={copyLink}>
                {copied ? "Copied" : "Copy link"}
              </button>
              <button type="button" className={styles.ctrl} onClick={restart}>
                Restart
              </button>
              <button type="button" className={styles.ctrl} onClick={goFullscreen}>
                Fullscreen
              </button>
            </span>
          </div>
          <div className={styles.frameWrap} ref={frameWrapRef}>
            <GameFrame
              key={`${selected.id}-${reloadKey}`}
              html={selected.html}
              title={`${selected.label} ${selected.game}`}
              interactive
              className={styles.frame}
            />
          </div>
          <p className={styles.hint}>
            {coarsePointer
              ? "These games are built for desktop play with a keyboard."
              : "Click the game to play. Arrow keys and WASD are captured while it is focused."}
          </p>
        </div>

        <aside className={styles.spec} aria-label="Run details">
          <div className={styles.specMaker}>
            <span className={styles.specLogo}>
              {maker ? <MakerLogo maker={maker.id} size={24} /> : null}
            </span>
            <div>
              <div className={styles.specModel}>{selected.label}</div>
              <div className={styles.specMakerName}>{maker?.name ?? "Unknown maker"}</div>
            </div>
          </div>

          <div className={styles.costBlock} key={`cost-${selected.id}`}>
            <span className={`${styles.costFigure} tnum`}>
              {formatCost(selected.generationCostUsd)}
            </span>
            <span className={styles.costUnit}>USD / run</span>
          </div>

          <dl className={styles.rows} key={`rows-${selected.id}`}>
            <div className={styles.specRow}>
              <dt>Input</dt>
              <dd className="tnum">{formatTokens(selected.inputTokens)}</dd>
            </div>
            <div className={styles.specRow}>
              <dt>Output</dt>
              <dd className="tnum">{formatTokens(selected.outputTokens)}</dd>
            </div>
            <div className={`${styles.specRow} ${styles.specTotal}`}>
              <dt>Total</dt>
              <dd className="tnum">{formatTokensFull(selected.totalTokens)}</dd>
            </div>
          </dl>

          <div
            className={styles.ioBar}
            role="img"
            aria-label={`Input ${formatTokens(selected.inputTokens)}, output ${formatTokens(
              selected.outputTokens
            )}`}
          >
            <span className={styles.ioInput} style={{ width: `${inputPct}%` }} />
            <span className={styles.ioOutput} style={{ width: `${100 - inputPct}%` }} />
          </div>
          <div className={styles.ioLegend}>
            <span>
              <i className={styles.swatchInput} /> Input
            </span>
            <span>
              <i className={styles.swatchOutput} /> Output
            </span>
          </div>
        </aside>
      </div>

      <section className={styles.railSection} aria-label="Same game, other models">
        <div className={styles.railHead}>
          <span className={styles.railLabel}>Same game, other models</span>
          <span className={styles.rule} />
        </div>
        <div className={styles.rail}>
          {runs.map((run) => {
            const active = run.id === selected.id;
            return (
              <button
                key={run.id}
                type="button"
                className={styles.thumb}
                data-on={active}
                onClick={() => select(run.id)}
                aria-pressed={active}
              >
                <span className={styles.thumbLogo}>
                  {run.maker ? <MakerLogo maker={run.maker.id} size={18} /> : null}
                </span>
                <span className={styles.thumbNames}>
                  <span className={styles.thumbModel}>{run.label}</span>
                  <span className={`${styles.thumbCost} tnum`}>
                    {formatCost(run.generationCostUsd)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
