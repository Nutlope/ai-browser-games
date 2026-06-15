"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring
} from "motion/react";
import { MakerLogo } from "@/components/logos";
import { formatCost, formatMultiple } from "@/lib/format";
import type { ModelSummary } from "@/lib/games";
import styles from "./hero-logos.module.css";

type Slot = {
  left: string;
  top: string;
  dir: -1 | 1;
  cardV: "top" | "bottom";
  cardH: "start" | "center" | "end";
};

// Positioned in the side gutters, clustered near (but outside) the title column.
const SLOTS: Slot[] = [
  { left: "17%", top: "28%", dir: -1, cardV: "bottom", cardH: "start" },
  { left: "24%", top: "72%", dir: -1, cardV: "top", cardH: "start" },
  { left: "11%", top: "52%", dir: -1, cardV: "bottom", cardH: "start" },
  { left: "27%", top: "10%", dir: -1, cardV: "bottom", cardH: "center" },
  { left: "83%", top: "26%", dir: 1, cardV: "bottom", cardH: "end" },
  { left: "76%", top: "70%", dir: 1, cardV: "top", cardH: "end" },
  { left: "89%", top: "52%", dir: 1, cardV: "bottom", cardH: "end" },
  { left: "73%", top: "9%", dir: 1, cardV: "bottom", cardH: "center" }
];

export function HeroLogos({ models }: { models: ModelSummary[] }) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const nodes = models.slice(0, SLOTS.length);

  const priced = models.filter((m) => m.avgCost != null);
  const cheapest = priced.reduce<ModelSummary | null>(
    (best, m) => (!best || (m.avgCost ?? 0) < (best.avgCost ?? 0) ? m : best),
    null
  );
  const priciest = priced.reduce<ModelSummary | null>(
    (best, m) => (!best || (m.avgCost ?? 0) > (best.avgCost ?? 0) ? m : best),
    null
  );

  const compareFor = (m: ModelSummary): string | null => {
    if (m.avgCost == null || !cheapest?.avgCost || !priciest?.avgCost) {
      return null;
    }
    const cheapName = cheapest.label.split(" ")[0];
    const priceName = priciest.label.split(" ")[0];
    const mid = Math.sqrt(cheapest.avgCost * priciest.avgCost);

    if (m.label === priciest.label) {
      return `${formatMultiple(priciest.avgCost, cheapest.avgCost)} pricier than ${cheapName}`;
    }
    if (m.label === cheapest.label) {
      return `${formatMultiple(priciest.avgCost, cheapest.avgCost)} cheaper than ${priceName}`;
    }
    if (m.avgCost >= mid) {
      return `${formatMultiple(m.avgCost, cheapest.avgCost)} pricier than ${cheapName}`;
    }
    return `${formatMultiple(priciest.avgCost, m.avgCost)} cheaper than ${priceName}`;
  };

  return (
    <div className={styles.layer} style={{ zIndex: hoverId !== null ? 30 : 1 }} aria-hidden="true">
      {nodes.map((model, index) => (
        <HeroLogoNode
          key={`${model.label}-${index}`}
          model={model}
          slot={SLOTS[index]}
          index={index}
          compare={compareFor(model)}
          onHoverChange={(open) => setHoverId(open ? index : null)}
        />
      ))}
    </div>
  );
}

function HeroLogoNode({
  model,
  slot,
  index,
  compare,
  onHoverChange
}: {
  model: ModelSummary;
  slot: Slot;
  index: number;
  compare: string | null;
  onHoverChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const mx = useSpring(0, { stiffness: 220, damping: 14, mass: 0.4 });
  const my = useSpring(0, { stiffness: 220, damping: 14, mass: 0.4 });

  const clamp = (value: number) => Math.max(-12, Math.min(12, value));

  const setHover = (value: boolean) => {
    setOpen(value);
    onHoverChange(value);
  };

  const onMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set(clamp((event.clientX - (rect.left + rect.width / 2)) * 0.4));
    my.set(clamp((event.clientY - (rect.top + rect.height / 2)) * 0.4));
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
    setHover(false);
  };

  const go = () => {
    if (model.makerId) {
      router.push(`/?makers=${model.makerId}#explore`);
    }
  };

  const cardClass = [
    styles.card,
    slot.cardV === "top" ? styles.cardTop : styles.cardBottom,
    slot.cardH === "start"
      ? styles.cardStart
      : slot.cardH === "end"
        ? styles.cardEnd
        : styles.cardCenter
  ].join(" ");

  return (
    <motion.div
      className={styles.node}
      style={{ left: slot.left, top: slot.top, zIndex: open ? 50 : undefined }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: slot.dir * 380, rotate: slot.dir * 8 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      transition={
        reduce
          ? { duration: 0.3 }
          : { type: "spring", stiffness: 90, damping: 16, mass: 1, delay: 0.12 + index * 0.07 }
      }
    >
      <motion.div
        className={styles.floater}
        animate={reduce ? undefined : { y: [0, -9, 0], x: [0, index % 2 ? 5 : -5, 0] }}
        transition={
          reduce
            ? undefined
            : {
                duration: 7 + (index % 4),
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.4
              }
        }
      >
        <motion.button
          type="button"
          className={styles.chip}
          style={{ x: mx, y: my }}
          whileHover={{ scale: 1.16 }}
          whileTap={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          onPointerMove={onMove}
          onPointerLeave={reset}
          onHoverStart={() => setHover(true)}
          onFocus={() => setHover(true)}
          onBlur={reset}
          onClick={go}
          aria-label={`${model.label} by ${model.makerName}. View its builds.`}
        >
          <span className={styles.chipLogo}>
            {model.makerId ? <MakerLogo maker={model.makerId} size={26} /> : null}
          </span>
        </motion.button>

        <AnimatePresence>
          {open ? (
            <motion.div
              className={cardClass}
              initial={{ opacity: 0, y: slot.cardV === "top" ? 6 : -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: slot.cardV === "top" ? 6 : -6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <div className={styles.cardModel}>{model.label}</div>
              <div className={styles.cardMaker}>{model.makerName}</div>
              <div className={styles.cardPrice}>
                <span className={`${styles.cardValue} tnum`}>{formatCost(model.avgCost)}</span>
                <span className={styles.cardLabel}>avg / run</span>
              </div>
              {compare ? <div className={styles.cardCompare}>{compare}</div> : null}
              <div className={styles.cardCta}>View builds →</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
