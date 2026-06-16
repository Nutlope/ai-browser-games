import Image from "next/image";
import Link from "next/link";
import { Explorer } from "@/components/explorer";
import { HeroLogos } from "@/components/hero-logos";
import { Leaderboard } from "@/components/leaderboard";
import { MakerLogo } from "@/components/logos";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { MakerId } from "@/lib/makers";
import { getAllRuns, getModelSummaries, getRunStats } from "@/lib/games";
import { formatCost, formatMultiple } from "@/lib/format";
import styles from "./page.module.css";

// Render on demand so URL filter/sort state (useSearchParams) is resolved on the
// server and the interactive Explorer ships in the HTML, instead of being
// deferred to a client-only render that can briefly leave controls unclickable.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const runs = getAllRuns();
  const stats = getRunStats(runs);
  const models = getModelSummaries();

  // Compare models by their average cost across the 3 games, so the highlights
  // show what a cheap (often open) model costs vs an expensive (closed) one.
  const pricedModels = models.filter((model) => model.avgCost != null);
  const cheapestModel = pricedModels[0];
  const priciestModel = pricedModels[pricedModels.length - 1];

  const makersOf = (...list: (typeof models[number] | undefined)[]) =>
    list.map((model) => model?.makerId).filter((id): id is MakerId => Boolean(id));

  // Trim size/variant suffixes for the highlight cards (e.g. "Nemotron 3 Ultra
  // 550B" -> "Nemotron 3"); the full name still shows in the gallery and table.
  const shortModel = (label: string) => label.split(" ").slice(0, 2).join(" ");

  const spread =
    cheapestModel?.avgCost && priciestModel?.avgCost
      ? formatMultiple(priciestModel.avgCost, cheapestModel.avgCost)
      : "--";

  const leaderCards = [
    {
      label: "Cheapest model",
      value: formatCost(cheapestModel?.avgCost),
      detail: cheapestModel ? `${shortModel(cheapestModel.label)} · avg per run` : "No models yet",
      makers: makersOf(cheapestModel),
      href: cheapestModel?.makerId ? `/?makers=${cheapestModel.makerId}#explore` : undefined
    },
    {
      label: "Priciest model",
      value: formatCost(priciestModel?.avgCost),
      detail: priciestModel ? `${shortModel(priciestModel.label)} · avg per run` : "No models yet",
      makers: makersOf(priciestModel),
      href: priciestModel?.makerId ? `/?makers=${priciestModel.makerId}#explore` : undefined
    },
    {
      label: "Cost spread",
      value: spread,
      detail:
        cheapestModel && priciestModel
          ? `${shortModel(priciestModel.label)} vs ${shortModel(cheapestModel.label)}`
          : "Priciest vs cheapest model",
      makers: makersOf(priciestModel, cheapestModel),
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
            <a
              href="https://www.together.ai"
              target="_blank"
              rel="noreferrer"
              className={styles.heroPill}
            >
              <span className={styles.heroPillLabel}>Ran on</span>
              <Image
                src="/together-logo.png"
                alt="Together AI"
                width={85}
                height={18}
                priority
                className={styles.heroPillLogo}
              />
            </a>
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

        <Explorer runs={runs} stats={stats} />

        <Leaderboard models={models} />
      </main>

      <SiteFooter />
    </div>
  );
}
