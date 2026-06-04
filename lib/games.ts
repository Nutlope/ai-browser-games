import { snakeGameHtml } from "@/lib/game-html";
import type { GameEntry } from "@/types/game";
import generatedGames from "@/generated/games.json";

export type GameSlug = "snake" | "tetris-lite" | "breakout" | "sokoban" | "pong";

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
  sokobanEntries?: GameEntry[];
  pongEntries?: GameEntry[];
};

const generated = generatedGames as GeneratedGamesFile;

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
    slug: "tetris-lite",
    entriesKey: "tetrisLiteEntries",
    name: "Tetris-lite",
    title: "Tetris-lite",
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
  },
  {
    slug: "sokoban",
    entriesKey: "sokobanEntries",
    name: "Sokoban",
    title: "Sokoban",
    description:
      "A grid puzzle benchmark for comparing deterministic movement, push rules, level completion, undo, and readable board design.",
    cardText: "Grid rules, box pushes, goals, and puzzle clarity."
  },
  {
    slug: "pong",
    entriesKey: "pongEntries",
    name: "Pong",
    title: "Pong",
    description:
      "A simple arcade benchmark for comparing paddle responsiveness, ball movement, scoring, restart flow, and baseline polish.",
    cardText: "Paddle feel, ball motion, scoring, and restart handling."
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

export const snakeEntries: GameEntry[] =
  generated.snakeEntries && generated.snakeEntries.length > 0
    ? generated.snakeEntries
    : fallbackSnakeEntries;

export const tetrisLiteEntries: GameEntry[] = generated.tetrisLiteEntries ?? [];
export const breakoutEntries: GameEntry[] = generated.breakoutEntries ?? [];
export const sokobanEntries: GameEntry[] = generated.sokobanEntries ?? [];
export const pongEntries: GameEntry[] = generated.pongEntries ?? [];

export const entriesByGame: Record<GameSlug, GameEntry[]> = {
  snake: snakeEntries,
  "tetris-lite": tetrisLiteEntries,
  breakout: breakoutEntries,
  sokoban: sokobanEntries,
  pong: pongEntries
};

export const allEntries = gameDefinitions.flatMap((game) => entriesByGame[game.slug]);

export function getGameDefinition(slug: string) {
  return gameDefinitions.find((game) => game.slug === slug);
}
