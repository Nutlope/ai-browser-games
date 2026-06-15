import type { GameSlug, Run } from "@/lib/games";
import type { MakerId } from "@/lib/makers";

export type SortKey = "cost" | "tokens";
export type SortDir = "asc" | "desc";
export type GameFilter = "all" | GameSlug;
export type ViewMode = "gallery" | "table";

export type ViewState = {
  game: GameFilter;
  makers: MakerId[];
  sort: SortKey;
  dir: SortDir;
  view: ViewMode;
};

export const DEFAULT_VIEW: ViewState = {
  game: "all",
  makers: [],
  sort: "cost",
  dir: "asc",
  view: "gallery"
};

export function filterRuns(runs: Run[], game: GameFilter, makers: MakerId[]) {
  return runs.filter((run) => {
    if (game !== "all" && run.gameSlug !== game) {
      return false;
    }
    if (makers.length > 0 && (!run.maker || !makers.includes(run.maker.id))) {
      return false;
    }
    return true;
  });
}

export function sortRuns(runs: Run[], sort: SortKey, dir: SortDir) {
  const value = (run: Run) =>
    sort === "cost"
      ? run.generationCostUsd ?? Number.POSITIVE_INFINITY
      : run.totalTokens ?? Number.NEGATIVE_INFINITY;

  const sorted = [...runs].sort((a, b) => {
    const diff = value(a) - value(b);
    if (diff !== 0) {
      return dir === "asc" ? diff : -diff;
    }
    return a.label.localeCompare(b.label);
  });

  return sorted;
}
