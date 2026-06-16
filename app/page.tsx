import { Suspense } from "react";
import Link from "next/link";
import { Explorer } from "@/components/explorer";
import { HeroLogos } from "@/components/hero-logos";
import { Leaderboard } from "@/components/leaderboard";
import { MakerLogo } from "@/components/logos";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { MakerId } from "@/lib/makers";
import {
  getAllRuns,
  getModelSummaries,
  getRunLeaders,
  getRunStats
} from "@/lib/games";
import { formatCost, formatMultiple } from "@/lib/format";
import styles from "./page.module.css";

// Render on demand so URL filter/sort state (useSearchParams) is resolved on the
// server and the interactive Explorer ships in the HTML, instead of being
// deferred to a client-only render that can briefly leave controls unclickable.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const runs = getAllRuns();
  const stats = getRunStats(runs);
  const leaders = getRunLeaders(runs);
  const models = getModelSummaries();

  const makerIds = (...runs: (typeof leaders.cheapest)[]) =>
    runs.map((run) => run?.maker?.id).filter((id): id is MakerId => Boolean(id));

  const leaderCards = [
    {
      label: "Cheapest run",
      value: formatCost(leaders.cheapest?.generationCostUsd),
      detail: leaders.cheapest
        ? `${leaders.cheapest.label} · ${leaders.cheapest.game}`
        : "No runs yet",
      makers: makerIds(leaders.cheapest),
      href: "/?sort=cost#explore"
    },
    {
      label: "Priciest build",
      value: formatCost(leaders.priciest?.generationCostUsd),
      detail: leaders.priciest
        ? `${leaders.priciest.label} · ${leaders.priciest.game}`
        : "No runs yet",
      makers: makerIds(leaders.priciest),
      href: "/?sort=cost&dir=desc#explore"
    },
    {
      label: "Cost spread",
      value:
        leaders.cheapest?.generationCostUsd && leaders.priciest?.generationCostUsd
          ? formatMultiple(
              leaders.priciest.generationCostUsd,
              leaders.cheapest.generationCostUsd
            )
          : "--",
      detail: "Priciest vs cheapest",
      makers: makerIds(leaders.priciest, leaders.cheapest),
      href: undefined
    }
  ];

  return (
    <div className={styles.shell}>
      <SiteHeader />

      <main>
        <section className={styles.hero}>
          <HeroLogos models={models} />
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Eight AI models built the same three games.</h1>
            <p className={styles.standfirst}>
              Browse them, play them, and see what each one cost.
            </p>
          </div>
        </section>

        <section className={styles.leaders} aria-label="Benchmark highlights">
          {leaderCards.map((card) => {
            const inner = (
              <>
                <span className={styles.leaderLabel}>{card.label}</span>
                <span className={`${styles.leaderValue} tnum`}>{card.value}</span>
                <span className={styles.leaderDetail}>
                  {card.makers.length ? (
                    <span className={styles.leaderLogos}>
                      {card.makers.map((id) => (
                        <MakerLogo key={id} maker={id} size={14} />
                      ))}
                    </span>
                  ) : null}
                  {card.detail}
                </span>
              </>
            );

            return card.href ? (
              <Link key={card.label} href={card.href} className={styles.leader}>
                {inner}
              </Link>
            ) : (
              <div key={card.label} className={styles.leader}>
                {inner}
              </div>
            );
          })}
        </section>

        <Suspense fallback={null}>
          <Explorer runs={runs} stats={stats} />
        </Suspense>

        <Leaderboard models={models} />
      </main>

      <SiteFooter />
    </div>
  );
}
