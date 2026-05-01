import { flappyGameHtml, snakeGameHtml } from "@/lib/game-html";
import type { GameEntry } from "@/types/game";
import generatedGames from "@/generated/games.json";

type GeneratedGamesFile = {
  snakeEntries: GameEntry[];
  flappyEntries: GameEntry[];
};

const generated = generatedGames as GeneratedGamesFile;

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

const fallbackFlappyEntries: GameEntry[] = [
  {
    id: "gpt-5-4-flappy",
    label: "GPT 5.4",
    game: "Flappy",
    model: "GPT 5.4",
    provider: "OpenAI",
    sourceModelId: "openai/gpt-5.4",
    inputTokens: 436,
    outputTokens: 2014,
    totalTokens: 2450,
    generationCostUsd: 0.025,
    generatedAt: "2026-04-10T00:00:00.000Z",
    html: flappyGameHtml
  }
];

export const snakeEntries: GameEntry[] =
  generated.snakeEntries.length > 0 ? generated.snakeEntries : fallbackSnakeEntries;

export const flappyEntries: GameEntry[] =
  generated.flappyEntries.length > 0 ? generated.flappyEntries : fallbackFlappyEntries;
