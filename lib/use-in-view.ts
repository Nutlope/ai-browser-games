"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether the element is near the viewport, toggling continuously so
 * callers can mount heavy content (live game iframes) only while it is on or
 * near screen and unmount it once it scrolls well away. This keeps only a
 * handful of games running at once instead of accumulating all of them.
 */
export function useInView<T extends HTMLElement>(rootMargin = "250px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries[0]?.isIntersecting ?? false);
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
