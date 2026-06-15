"use client";

import { useEffect } from "react";

/**
 * The first downward scroll from the very top smoothly glides the page to the
 * target section (the filters + gallery), then releases so all subsequent
 * scrolling is native. Triggers once per page load, is disabled under
 * prefers-reduced-motion, and yields immediately to ANY user input so it can
 * never get stuck blocking scrolling or clicks.
 */
export function FirstScrollGlide({ targetId }: { targetId: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.scrollY > 8) return;
    // Don't hijack when arriving at an in-page anchor (e.g. #explore on back-nav).
    if (window.location.hash) return;

    let triggered = false;
    let animating = false;
    let rafId = 0;
    let safetyId = 0;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const cancel = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (safetyId) window.clearTimeout(safetyId);
      rafId = 0;
      safetyId = 0;
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
      // Hard safety: never stay in the animating state.
      safetyId = window.setTimeout(cancel, duration + 500);

      const step = (ts: number) => {
        if (!animating) return;
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
      // Any scroll during the glide yields control back to the user immediately.
      if (animating) {
        cancel();
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
        cancel();
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

    // A click or keypress during the glide also cancels it.
    const onInterrupt = () => {
      if (animating) cancel();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("pointerdown", onInterrupt, { passive: true });
    window.addEventListener("keydown", onInterrupt, { passive: true });

    return () => {
      cancel();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerdown", onInterrupt);
      window.removeEventListener("keydown", onInterrupt);
    };
  }, [targetId]);

  return null;
}
