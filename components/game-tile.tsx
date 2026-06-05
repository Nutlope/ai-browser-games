"use client";

import { useEffect, useRef, useState } from "react";
import type { GameEntry } from "@/types/game";
import styles from "./game-tile.module.css";

type GameTileProps = {
  entry: GameEntry;
};

export function GameTile({ entry }: GameTileProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalIframeRef = useRef<HTMLIFrameElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const scrollPositionRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
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
    modalIframeRef.current?.focus();
  };

  const openGame = () => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    setIsOpen(true);

    if (!dialog.open) {
      dialog.showModal();
    }
  };

  const closeGame = () => {
    dialogRef.current?.close();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const gameControlKeys = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "Spacebar",
      "w",
      "W",
      "a",
      "A",
      "s",
      "S",
      "d",
      "D"
    ]);
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;

    scrollPositionRef.current = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.width = "100%";
    window.setTimeout(() => modalIframeRef.current?.focus(), 60);

    const lockPageKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        return;
      }

      if (gameControlKeys.has(event.key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const lockPageMovement = (event: WheelEvent | TouchEvent) => {
      event.preventDefault();
    };

    window.addEventListener("keydown", lockPageKeys, { capture: true });
    window.addEventListener("wheel", lockPageMovement, { capture: true, passive: false });
    window.addEventListener("touchmove", lockPageMovement, { capture: true, passive: false });

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      window.scrollTo(0, scrollPositionRef.current);
      window.removeEventListener("keydown", lockPageKeys, { capture: true });
      window.removeEventListener("wheel", lockPageMovement, { capture: true });
      window.removeEventListener("touchmove", lockPageMovement, { capture: true });
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleClose = () => {
      setIsOpen(false);
    };

    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  useEffect(() => {
    const button = playButtonRef.current;

    if (!button) {
      return;
    }

    button.addEventListener("click", openGame);
    button.addEventListener("pointerdown", openGame);

    return () => {
      button.removeEventListener("click", openGame);
      button.removeEventListener("pointerdown", openGame);
    };
  }, []);

  return (
    <article className={styles.tile} id={entry.id}>
      <header className={styles.header}>
        <div>
          <span className={styles.label}>{entry.label}</span>
          <p className={styles.provider}>
            {[entry.provider, entry.game].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className={styles.status}>
          {entry.generationCostUsd != null ? `$${entry.generationCostUsd.toFixed(4)}` : "Ready"}
        </span>
      </header>
      <div className={styles.frameWrap}>
        <iframe
          ref={iframeRef}
          className={styles.frame}
          title={entry.label}
          srcDoc={entry.html}
          sandbox="allow-scripts"
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          ref={playButtonRef}
          className={styles.playButton}
          type="button"
          onClick={openGame}
          onPointerDown={openGame}
          aria-label={`Play ${entry.label} ${entry.game}`}
        >
          Play game
        </button>
      </div>
      <p className={styles.hint}>Play it first, then compare the cost and token receipt below.</p>
      <dl className={styles.metaGrid}>
        {metadata.map((item) => (
          <div key={item.label} className={styles.metaItem}>
            <dt className={styles.metaLabel}>{item.label}</dt>
            <dd className={styles.metaValue}>{item.value}</dd>
          </div>
        ))}
      </dl>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={`${entry.label} ${entry.game} player`}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            closeGame();
          }
        }}
      >
        <div className={styles.modalShell}>
          <header className={styles.modalHeader}>
            <div>
              <span className={styles.modalEyebrow}>{entry.game}</span>
              <h2 className={styles.modalTitle}>{entry.label}</h2>
            </div>
            <dl className={styles.modalStats}>
              <div>
                <dt>Tokens</dt>
                <dd>{entry.totalTokens?.toLocaleString() ?? "TBD"}</dd>
              </div>
              <div>
                <dt>Cost</dt>
                <dd>{entry.generationCostUsd != null ? `$${entry.generationCostUsd.toFixed(4)}` : "TBD"}</dd>
              </div>
            </dl>
            <button className={styles.closeButton} type="button" onClick={closeGame}>
              Close
            </button>
          </header>
          <div className={styles.modalFrameWrap}>
            {isOpen ? (
              <iframe
                ref={modalIframeRef}
                className={styles.modalFrame}
                title={`${entry.label} ${entry.game}`}
                srcDoc={entry.html}
                sandbox="allow-scripts"
                tabIndex={0}
                onPointerDown={focusFrame}
              />
            ) : null}
          </div>
          <p className={styles.modalHint}>Arrow keys are captured while this player is open. Press Escape to close.</p>
        </div>
      </dialog>
    </article>
  );
}
