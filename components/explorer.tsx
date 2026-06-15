"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Controls } from "@/components/controls";
import { Gallery } from "@/components/gallery";
import { CompareTable } from "@/components/compare-table";
import type { Run, RunStats } from "@/lib/games";
import {
  DEFAULT_VIEW,
  filterRuns,
  sortRuns,
  type GameFilter,
  type SortDir,
  type SortKey,
  type ViewMode,
  type ViewState
} from "@/lib/runs-view";
import { MAKER_ORDER, type MakerId } from "@/lib/makers";
import styles from "./explorer.module.css";

type ExplorerProps = {
  runs: Run[];
  stats: RunStats;
};

const GAME_VALUES = new Set(["all", "snake", "tetris", "breakout"]);

export function Explorer({ runs, stats }: ExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const state: ViewState = useMemo(() => {
    const game = params.get("game");
    const sort = params.get("sort");
    const dir = params.get("dir");
    const view = params.get("view");
    const makers = (params.get("makers") ?? "")
      .split(",")
      .filter((m): m is MakerId => MAKER_ORDER.includes(m as MakerId));

    return {
      game: (game && GAME_VALUES.has(game) ? game : DEFAULT_VIEW.game) as GameFilter,
      makers,
      sort: (sort === "tokens" ? "tokens" : "cost") as SortKey,
      dir: (dir === "desc" ? "desc" : "asc") as SortDir,
      view: (view === "table" ? "table" : "gallery") as ViewMode
    };
  }, [params]);

  const onChange = useCallback(
    (patch: Partial<ViewState>) => {
      const next: ViewState = { ...state, ...patch };
      const query = new URLSearchParams();
      if (next.game !== DEFAULT_VIEW.game) query.set("game", next.game);
      if (next.makers.length) query.set("makers", next.makers.join(","));
      if (next.sort !== DEFAULT_VIEW.sort) query.set("sort", next.sort);
      if (next.dir !== DEFAULT_VIEW.dir) query.set("dir", next.dir);
      if (next.view !== DEFAULT_VIEW.view) query.set("view", next.view);

      const qs = query.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [state, pathname, router]
  );

  const onSort = useCallback(
    (key: SortKey) => {
      if (state.sort === key) {
        onChange({ dir: state.dir === "asc" ? "desc" : "asc" });
      } else {
        onChange({ sort: key, dir: key === "cost" ? "asc" : "desc" });
      }
    },
    [state, onChange]
  );

  const availableMakers = useMemo(() => {
    const set = new Set<string>();
    for (const run of runs) {
      if (run.maker) set.add(run.maker.id);
    }
    return set;
  }, [runs]);

  const visible = useMemo(() => {
    const filtered = filterRuns(runs, state.game, state.makers);
    return sortRuns(filtered, state.sort, state.dir);
  }, [runs, state.game, state.makers, state.sort, state.dir]);

  return (
    <section id="explore" className={styles.explorer}>
      <Controls
        state={state}
        resultCount={visible.length}
        availableMakers={availableMakers}
        onChange={onChange}
      />
      <div className={styles.body}>
        {state.view === "gallery" ? (
          <Gallery runs={visible} stats={stats} />
        ) : (
          <CompareTable
            runs={visible}
            stats={stats}
            sort={state.sort}
            dir={state.dir}
            onSort={onSort}
          />
        )}
      </div>
    </section>
  );
}
