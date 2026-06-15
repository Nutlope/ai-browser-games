"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useInView } from "@/lib/use-in-view";
import styles from "./game-frame.module.css";

type GameFrameProps = {
  html: string;
  title: string;
  /** CSS aspect-ratio for the framed area. Default square. */
  aspect?: string;
  /** Fixed virtual viewport (px) the game renders into before scaling. */
  virtual?: number;
  interactive?: boolean;
  lazy?: boolean;
  className?: string;
};

/**
 * Renders an embedded game at a fixed virtual viewport, then scales the whole
 * iframe to "contain" it in the responsive container. Because each game centers
 * its fixed-pixel canvas inside the virtual viewport, every game shows in full
 * (no clipping) regardless of its native aspect ratio. One frame primitive is
 * reused for cards, the play page, and the table hover popup for consistency.
 */
export function GameFrame({
  html,
  title,
  aspect = "1 / 1",
  virtual = 640,
  interactive = false,
  lazy = false,
  className
}: GameFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: 0, x: 0, y: 0 });
  const { ref: inViewRef, inView } = useInView<HTMLDivElement>();

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      if (!width || !height) {
        return;
      }
      const scale = Math.min(width, height) / virtual;
      setLayout({
        scale,
        x: (width - virtual * scale) / 2,
        y: (height - virtual * scale) / 2
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [virtual]);

  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    inViewRef.current = node;
  };

  const mount = interactive || !lazy || inView;

  return (
    <div
      ref={setRefs}
      className={`${styles.frame} ${className ?? ""}`}
      style={{ aspectRatio: aspect }}
    >
      {mount && layout.scale > 0 ? (
        <iframe
          className={styles.iframe}
          title={title}
          srcDoc={html}
          sandbox="allow-scripts"
          loading={interactive ? undefined : "lazy"}
          tabIndex={interactive ? 0 : -1}
          aria-hidden={interactive ? undefined : true}
          style={{
            width: `${virtual}px`,
            height: `${virtual}px`,
            transform: `translate(${layout.x}px, ${layout.y}px) scale(${layout.scale})`,
            pointerEvents: interactive ? "auto" : "none"
          }}
        />
      ) : null}
    </div>
  );
}
