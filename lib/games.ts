import {
  getGeneratedHtmlSyntaxError,
  prepareEmbeddedGameHtml,
  snakeGameHtml
} from "@/lib/game-html";
import { makerFromSourceId, type Maker, type MakerId } from "@/lib/makers";
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
    broken: Boolean(syntaxError),
    description: entry.description
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

/** A generated run enriched with its real maker and game slug, ready for display. */
export type Run = GameEntry & {
  maker: Maker | null;
  gameSlug: GameSlug;
};

const GAME_NAME_TO_SLUG: Record<string, GameSlug> = {
  Snake: "snake",
  Tetris: "tetris",
  Breakout: "breakout"
};

function toRun(entry: GameEntry, gameSlug: GameSlug): Run {
  return {
    ...entry,
    gameSlug,
    maker: makerFromSourceId(entry.sourceModelId)
  };
}

export function getRunsByGame(): Record<GameSlug, Run[]> {
  return {
    snake: snakeEntries.map((entry) => toRun(entry, "snake")),
    tetris: tetrisLiteEntries.map((entry) => toRun(entry, "tetris")),
    breakout: breakoutEntries.map((entry) => toRun(entry, "breakout"))
  };
}

export function getAllRuns(): Run[] {
  const byGame = getRunsByGame();
  return gameDefinitions.flatMap((game) => byGame[game.slug]);
}

export type RunStats = {
  costMin: number;
  costMax: number;
  tokenMin: number;
  tokenMax: number;
};

export function getRunStats(runs: Run[]): RunStats {
  const costs = runs
    .map((run) => run.generationCostUsd)
    .filter((value): value is number => value != null);
  const tokens = runs
    .map((run) => run.totalTokens)
    .filter((value): value is number => value != null);

  return {
    costMin: costs.length ? Math.min(...costs) : 0,
    costMax: costs.length ? Math.max(...costs) : 0,
    tokenMin: tokens.length ? Math.min(...tokens) : 0,
    tokenMax: tokens.length ? Math.max(...tokens) : 0
  };
}

export type RunLeaders = {
  cheapest?: Run;
  priciest?: Run;
  mostTokens?: Run;
  costSpread?: number;
};

export function getRunLeaders(runs: Run[]): RunLeaders {
  const priced = runs.filter((run) => run.generationCostUsd != null);
  const tokened = runs.filter((run) => run.totalTokens != null);

  const cheapest = [...priced].sort(
    (a, b) => (a.generationCostUsd ?? 0) - (b.generationCostUsd ?? 0)
  )[0];
  const priciest = [...priced].sort(
    (a, b) => (b.generationCostUsd ?? 0) - (a.generationCostUsd ?? 0)
  )[0];
  const mostTokens = [...tokened].sort(
    (a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0)
  )[0];

  const costSpread =
    cheapest?.generationCostUsd && priciest?.generationCostUsd
      ? priciest.generationCostUsd / cheapest.generationCostUsd
      : undefined;

  return { cheapest, priciest, mostTokens, costSpread };
}

/** One row per model, aggregated across its games. Used by the hero showcase. */
export type ModelSummary = {
  label: string;
  makerId: MakerId | null;
  makerName: string;
  avgCost: number | null;
  totalTokens: number;
  games: number;
};

export function getModelSummaries(): ModelSummary[] {
  const byModel = new Map<string, Run[]>();

  for (const run of getAllRuns()) {
    const list = byModel.get(run.label) ?? [];
    list.push(run);
    byModel.set(run.label, list);
  }

  return Array.from(byModel.values())
    .map((list) => {
      const costs = list
        .map((run) => run.generationCostUsd)
        .filter((value): value is number => value != null);
      const maker = list[0].maker;

      return {
        label: list[0].label,
        makerId: maker?.id ?? null,
        makerName: maker?.name ?? "Unknown maker",
        avgCost: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
        totalTokens: list.reduce((sum, run) => sum + (run.totalTokens ?? 0), 0),
        games: list.length
      };
    })
    .sort((a, b) => (a.avgCost ?? Infinity) - (b.avgCost ?? Infinity));
}
