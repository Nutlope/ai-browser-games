import {
  getGeneratedHtmlSyntaxError,
  prepareEmbeddedGameHtml,
  snakeGameHtml
} from "@/lib/game-html";
import type { GameEntry } from "@/types/game";
import generatedGames from "@/generated/games.json";
import openrouterGames from "@/generated/openrouter-games.json";

export type GameSlug = "snake" | "tetris" | "breakout";

export type GameDefinition = {
  slug: GameSlug;
  entriesKey: `${string}Entries`;
  name: string;
  title: string;
  description: string;
  cardText: string;
};

type GeneratedGamesFile = {
  snakeEntries?: GameEntry[];
  tetrisLiteEntries?: GameEntry[];
  breakoutEntries?: GameEntry[];
};

const generated = generatedGames as GeneratedGamesFile;
const openrouter = openrouterGames as GeneratedGamesFile;

function providerSortRank(provider?: string) {
  if (provider === "OpenRouter") {
    return 1;
  }

  return 0;
}

function sortEntriesForDisplay(entries: GameEntry[]) {
  return [...entries].sort((left, right) => {
    const providerDiff =
      providerSortRank(left.provider) - providerSortRank(right.provider);

    if (providerDiff !== 0) {
      return providerDiff;
    }

    return left.label.localeCompare(right.label);
  });
}

function prepareEntryForDisplay(entry: GameEntry): GameEntry {
  const syntaxError = getGeneratedHtmlSyntaxError(entry.html);

  return {
    ...entry,
    game: entry.game === "Tetris-lite" ? "Tetris" : entry.game,
    html: prepareEmbeddedGameHtml(entry.html),
    description: syntaxError
      ? `${entry.description ?? ""} Generated script did not parse cleanly: ${syntaxError}`.trim()
      : entry.description
  };
}

function mergeGameEntries(
  togetherEntries: GameEntry[] | undefined,
  openrouterEntries: GameEntry[] | undefined
) {
  const byId = new Map<string, GameEntry>();

  for (const entry of togetherEntries ?? []) {
    if (entry.provider === "OpenRouter") {
      continue;
    }

    byId.set(entry.id, entry);
  }

  for (const entry of openrouterEntries ?? []) {
    byId.set(entry.id, entry);
  }

  for (const entry of togetherEntries ?? []) {
    if (entry.provider === "OpenRouter") {
      byId.set(entry.id, entry);
    }
  }

  return sortEntriesForDisplay(Array.from(byId.values())).map(prepareEntryForDisplay);
}

function entriesForKey(key: keyof GeneratedGamesFile) {
  return mergeGameEntries(generated[key], openrouter[key]);
}

export const gameDefinitions: GameDefinition[] = [
  {
    slug: "snake",
    entriesKey: "snakeEntries",
    name: "Snake",
    title: "Snake",
    description:
      "A comparison wall for model-generated snake experiments. Click into any tile, play in place, and compare how different models approach the same browser game.",
    cardText: "Grid movement, collision logic, scoring, and keyboard feel."
  },
  {
    slug: "tetris",
    entriesKey: "tetrisLiteEntries",
    name: "Tetris",
    title: "Tetris",
    description:
      "A compact falling-block benchmark for comparing rotation, collision handling, line clears, scoring, and speed ramping.",
    cardText: "Piece rotation, line clears, board state, and pacing."
  },
  {
    slug: "breakout",
    entriesKey: "breakoutEntries",
    name: "Breakout",
    title: "Breakout",
    description:
      "A paddle-and-ball benchmark for comparing physics, brick collision, scoring, levels, and visual feedback.",
    cardText: "Ball physics, paddle control, brick hits, and polish."
  }
];

const fallbackSnakeEntries: GameEntry[] = [
  {
    id: "gpt-5-4-snake",
    label: "GPT 5.4",
    game: "Snake",
    model: "GPT 5.4",
    provider: "OpenAI",
    sourceModelId: "openai/gpt-5.4",
    inputTokens: 412,
    outputTokens: 1886,
    totalTokens: 2298,
    generationCostUsd: 0.023,
    generatedAt: "2026-04-10T00:00:00.000Z",
    html: snakeGameHtml
  }
];

const mergedSnakeEntries = entriesForKey("snakeEntries");

export const snakeEntries: GameEntry[] =
  mergedSnakeEntries.length > 0 ? mergedSnakeEntries : fallbackSnakeEntries;

export const tetrisLiteEntries: GameEntry[] = entriesForKey("tetrisLiteEntries");
export const breakoutEntries: GameEntry[] = entriesForKey("breakoutEntries");

export const entriesByGame: Record<GameSlug, GameEntry[]> = {
  snake: snakeEntries,
  tetris: tetrisLiteEntries,
  breakout: breakoutEntries
};

export const allEntries = gameDefinitions.flatMap((game) => entriesByGame[game.slug]);

export function getGameDefinition(slug: string) {
  return gameDefinitions.find((game) => game.slug === slug);
}
