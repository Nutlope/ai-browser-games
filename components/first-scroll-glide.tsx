"use client";

import { useEffect } from "react";

/**
 * The first downward scroll from the very top smoothly glides the page to the
 * target section (the filters + gallery), then releases so all subsequent
 * scrolling is native. Inspired by hero -> content "first scroll" transitions.
 * Triggers once per page load and is disabled under prefers-reduced-motion.
 */
export function FirstScrollGlide({ targetId }: { targetId: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.scrollY > 8) return;

    let triggered = false;
    let animating = false;
    let rafId = 0;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const cancel = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      animating = false;
    };

    const glide = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      const from = window.scrollY;
      const to = el.getBoundingClientRect().top + from;
      const dist = to - from;
      if (Math.abs(dist) < 8) return;

      const duration = 900;
      let start: number | undefined;
      animating = true;

      const step = (ts: number) => {
        if (start === undefined) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        window.scrollTo(0, from + dist * easeInOutCubic(p));
        if (p < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          cancel();
        }
      };

      rafId = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (animating) {
        if (event.deltaY < 0) cancel();
        else event.preventDefault();
        return;
      }
      if (triggered) return;
      if (window.scrollY > 8) {
        triggered = true;
        return;
      }
      if (event.deltaY > 0) {
        event.preventDefault();
        triggered = true;
        glide();
      }
    };

    let touchY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (animating) {
        event.preventDefault();
        return;
      }
      if (triggered || touchY == null) return;
      if (window.scrollY > 8) {
        triggered = true;
        return;
      }
      const dy = touchY - (event.touches[0]?.clientY ?? touchY);
      if (dy > 12) {
        event.preventDefault();
        triggered = true;
        glide();
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (triggered || animating) return;
      if (window.scrollY > 8) {
        triggered = true;
        return;
      }
      if (["PageDown", "ArrowDown", " ", "Spacebar"].includes(event.key)) {
        event.preventDefault();
        triggered = true;
        glide();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);

    return () => {
      cancel();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [targetId]);

  return null;
}
