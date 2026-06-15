"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * FLIP reordering: when `orderKey` changes, elements tagged with
 * [data-flip-id] inside the container animate from their previous position to
 * the new one. Respects prefers-reduced-motion.
 */
export function useFlip<T extends HTMLElement>(orderKey: string) {
  const ref = useRef<T>(null);
  const positions = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) {
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-flip-id]")
    );

    if (!prefersReduced) {
      for (const node of nodes) {
        const id = node.dataset.flipId;
        if (!id) continue;
        const prev = positions.current.get(id);
        const next = node.getBoundingClientRect();
        if (prev) {
          const dx = prev.left - next.left;
          const dy = prev.top - next.top;
          if (dx || dy) {
            node.animate(
              [
                { transform: `translate(${dx}px, ${dy}px)` },
                { transform: "translate(0, 0)" }
              ],
              { duration: 320, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
            );
          }
        }
      }
    }

    positions.current.clear();
    for (const node of nodes) {
      const id = node.dataset.flipId;
      if (id) {
        positions.current.set(id, node.getBoundingClientRect());
      }
    }
  }, [orderKey]);

  return ref;
}
