import Link from "next/link";
import { notFound } from "next/navigation";
import { RunPlayer } from "@/components/run-player";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  gameDefinitions,
  getGameDefinition,
  getRunLeaders,
  getRunsByGame,
  type GameSlug
} from "@/lib/games";
import styles from "./game.module.css";

type GamePageProps = {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ model?: string }>;
};

export function generateStaticParams() {
  return gameDefinitions.map((game) => ({ game: game.slug }));
}

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const { game: slug } = await params;
  const { model } = await searchParams;
  const game = getGameDefinition(slug);

  if (!game) {
    notFound();
  }

  const runs = getRunsByGame()[game.slug as GameSlug];

  if (!runs || runs.length === 0) {
    notFound();
  }

  const figIndex = gameDefinitions.findIndex((g) => g.slug === game.slug) + 1;
  const initialId = model ?? getRunLeaders(runs).cheapest?.id ?? runs[0].id;

  return (
    <div className={styles.shell}>
      <SiteHeader />

      <main>
        <section className={styles.chapterHead}>
          <Link href={`/?game=${game.slug}#explore`} className={styles.back} scroll={false}>
            ← All builds
          </Link>
          <p className={styles.eyebrow}>
            Fig. {String(figIndex).padStart(2, "0")} / {game.name}
          </p>
          <h1 className={styles.title}>{game.title}</h1>
          <p className={styles.description}>{game.description}</p>
        </section>

        <RunPlayer runs={runs} initialId={initialId} />
      </main>

      <SiteFooter />
    </div>
  );
}
