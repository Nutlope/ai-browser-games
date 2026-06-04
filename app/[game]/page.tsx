import { notFound } from "next/navigation";
import { ComparisonPage } from "@/components/comparison-page";
import { entriesByGame, gameDefinitions, getGameDefinition } from "@/lib/games";
import type { GameSlug } from "@/lib/games";

type GamePageProps = {
  params: Promise<{
    game: string;
  }>;
};

export function generateStaticParams() {
  return gameDefinitions
    .filter((game) => game.slug !== "snake")
    .map((game) => ({
      game: game.slug
    }));
}

export default async function GamePage({ params }: GamePageProps) {
  const { game: slug } = await params;
  const game = getGameDefinition(slug);

  if (!game || game.slug === "snake") {
    notFound();
  }

  return (
    <ComparisonPage
      eyebrow="AI Browser Games"
      title={game.title}
      description={game.description}
      note="Each tile can carry generation metadata alongside the playable result, so the gallery can compare quality, token count, and spend across models."
      entries={entriesByGame[game.slug as GameSlug]}
    />
  );
}
