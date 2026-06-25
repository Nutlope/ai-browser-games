import {
  getGeneratedHtmlSyntaxError,
  prepareEmbeddedGameHtml,
  snakeGameHtml
} from "@/lib/game-html";
import { makerFromSourceId, type Maker, type MakerId } from "@/lib/makers";
import type { GameEntry } from "@/types/game";

// Each game gets its own file per provider (generated/<provider>/<slug>.json)
// instead of one shared blob, so a single game's data never makes every
// other game's git diff or every generation run's write touch one giant file.
// Next.js requires statically analyzable import paths, so these are listed
// individually rather than loaded by a runtime glob.
import snakeTogether from "@/generated/together/snake.json";
import snakeOpenRouter from "@/generated/openrouter/snake.json";
import tetrisLiteTogether from "@/generated/together/tetris-lite.json";
import tetrisLiteOpenRouter from "@/generated/openrouter/tetris-lite.json";
import breakoutTogether from "@/generated/together/breakout.json";
import breakoutOpenRouter from "@/generated/openrouter/breakout.json";
import twoZeroFourEightTogether from "@/generated/together/2048.json";
import twoZeroFourEightOpenRouter from "@/generated/openrouter/2048.json";
import asteroidsTogether from "@/generated/together/asteroids.json";
import asteroidsOpenRouter from "@/generated/openrouter/asteroids.json";
import pacmanTogether from "@/generated/together/pacman.json";
import pacmanOpenRouter from "@/generated/openrouter/pacman.json";
import doomTogether from "@/generated/together/doom.json";
import doomOpenRouter from "@/generated/openrouter/doom.json";
import minecraftTogether from "@/generated/together/minecraft.json";
import minecraftOpenRouter from "@/generated/openrouter/minecraft.json";
import quakeTogether from "@/generated/together/quake.json";
import quakeOpenRouter from "@/generated/openrouter/quake.json";

export type GameSlug =
  | "snake"
  | "tetris"
  | "breakout"
  | "2048"
  | "asteroids"
  | "pacman"
  | "doom"
  | "minecraft"
  | "quake";

export type GameDefinition = {
  slug: GameSlug;
  /** Filename (without extension) under generated/<provider>/, e.g. "tetris-lite" for the "tetris" route. */
  dataSlug: string;
  name: string;
  title: string;
  description: string;
  cardText: string;
};

const togetherBySlug: Record<string, GameEntry[]> = {
  snake: snakeTogether as GameEntry[],
  "tetris-lite": tetrisLiteTogether as GameEntry[],
  breakout: breakoutTogether as GameEntry[],
  "2048": twoZeroFourEightTogether as GameEntry[],
  asteroids: asteroidsTogether as GameEntry[],
  pacman: pacmanTogether as GameEntry[],
  doom: doomTogether as GameEntry[],
  minecraft: minecraftTogether as GameEntry[],
  quake: quakeTogether as GameEntry[]
};

const openrouterBySlug: Record<string, GameEntry[]> = {
  snake: snakeOpenRouter as GameEntry[],
  "tetris-lite": tetrisLiteOpenRouter as GameEntry[],
  breakout: breakoutOpenRouter as GameEntry[],
  "2048": twoZeroFourEightOpenRouter as GameEntry[],
  asteroids: asteroidsOpenRouter as GameEntry[],
  pacman: pacmanOpenRouter as GameEntry[],
  doom: doomOpenRouter as GameEntry[],
  minecraft: minecraftOpenRouter as GameEntry[],
  quake: quakeOpenRouter as GameEntry[]
};

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

function entriesForDataSlug(dataSlug: string) {
  return mergeGameEntries(togetherBySlug[dataSlug], openrouterBySlug[dataSlug]);
}

export const gameDefinitions: GameDefinition[] = [
  {
    slug: "snake",
    dataSlug: "snake",
    name: "Snake",
    title: "Snake",
    description:
      "A comparison wall for model-generated snake experiments. Click into any tile, play in place, and compare how different models approach the same browser game.",
    cardText: "Grid movement, collision logic, scoring, and keyboard feel."
  },
  {
    slug: "tetris",
    dataSlug: "tetris-lite",
    name: "Tetris",
    title: "Tetris",
    description:
      "A compact falling-block benchmark for comparing rotation, collision handling, line clears, scoring, and speed ramping.",
    cardText: "Piece rotation, line clears, board state, and pacing."
  },
  {
    slug: "breakout",
    dataSlug: "breakout",
    name: "Breakout",
    title: "Breakout",
    description:
      "A paddle-and-ball benchmark for comparing physics, brick collision, scoring, levels, and visual feedback.",
    cardText: "Ball physics, paddle control, brick hits, and polish."
  },
  {
    slug: "2048",
    dataSlug: "2048",
    name: "2048",
    title: "2048",
    description:
      "A sliding-tile puzzle benchmark for grid state, merge logic, spawn probabilities, game-over detection, and animation polish.",
    cardText: "Grid state, merge rules, spawn logic, and game-over flow."
  },
  {
    slug: "asteroids",
    dataSlug: "asteroids",
    name: "Asteroids",
    title: "Asteroids",
    description:
      "A vector-graphics arcade benchmark for thrust physics, screen wrap, asteroid splitting, bullet lifecycles, and lives.",
    cardText: "Vector physics, rotation, splitting, screen wrap, and timing."
  },
  {
    slug: "pacman",
    dataSlug: "pacman",
    name: "Pac-Man",
    title: "Pac-Man",
    description:
      "A maze-chase benchmark for tile-based movement, ghost AI with distinct targeting strategies, power-dot state, and round flow.",
    cardText: "Maze pathfinding, ghost AI, power dots, and round logic."
  },
  {
    slug: "doom",
    dataSlug: "doom",
    name: "Doom",
    title: "Doom",
    description:
      "A first-person raycaster benchmark for per-column depth math, procedural wall textures, billboard sprites, and projectile combat in raw Canvas2D.",
    cardText: "Raycasting depth, sprite z-sorting, collision, and shooting."
  },
  {
    slug: "minecraft",
    dataSlug: "minecraft",
    name: "Minecraft",
    title: "Minecraft",
    description:
      "A voxel-sandbox benchmark for procedural terrain, raw-WebGL rendering, first-person movement/collision, and block place/break.",
    cardText: "Procedural terrain, voxel meshing, FPS movement, and block edits."
  },
  {
    slug: "quake",
    dataSlug: "quake",
    name: "Quake",
    title: "Quake",
    description:
      "A first-person-shooter benchmark for hand-authored WebGL geometry, a small vertex/fragment shader pipeline, enemy AI, and combat.",
    cardText: "Hand-authored WebGL geometry, shaders, enemy AI, and combat."
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

const mergedSnakeEntries = entriesForDataSlug("snake");

export const snakeEntries: GameEntry[] =
  mergedSnakeEntries.length > 0 ? mergedSnakeEntries : fallbackSnakeEntries;

export const tetrisLiteEntries: GameEntry[] = entriesForDataSlug("tetris-lite");
export const breakoutEntries: GameEntry[] = entriesForDataSlug("breakout");
export const twoZeroFourEightEntries: GameEntry[] = entriesForDataSlug("2048");
export const asteroidsEntries: GameEntry[] = entriesForDataSlug("asteroids");
export const pacmanEntries: GameEntry[] = entriesForDataSlug("pacman");
export const doomEntries: GameEntry[] = entriesForDataSlug("doom");
export const minecraftEntries: GameEntry[] = entriesForDataSlug("minecraft");
export const quakeEntries: GameEntry[] = entriesForDataSlug("quake");

export const entriesByGame: Record<GameSlug, GameEntry[]> = {
  snake: snakeEntries,
  tetris: tetrisLiteEntries,
  breakout: breakoutEntries,
  2048: twoZeroFourEightEntries,
  asteroids: asteroidsEntries,
  pacman: pacmanEntries,
  doom: doomEntries,
  minecraft: minecraftEntries,
  quake: quakeEntries
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

function toRun(entry: GameEntry, gameSlug: GameSlug): Run {
  return {
    ...entry,
    gameSlug,
    maker: makerFromSourceId(entry.sourceModelId)
  };
}

export function getRunsByGame(): Record<GameSlug, Run[]> {
  return Object.fromEntries(
    gameDefinitions.map((game) => [
      game.slug,
      entriesByGame[game.slug].map((entry) => toRun(entry, game.slug))
    ])
  ) as Record<GameSlug, Run[]>;
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
  // Leaders represent working builds only; a build that failed to run should
  // never be crowned cheapest/priciest or used as a comparison baseline.
  const working = runs.filter((run) => !run.broken);
  const priced = working.filter((run) => run.generationCostUsd != null);
  const tokened = working.filter((run) => run.totalTokens != null);

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
      // Average cost over working builds only, so a failed build can't make a
      // model look artificially cheap on the leaderboard.
      const costs = list
        .filter((run) => !run.broken)
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