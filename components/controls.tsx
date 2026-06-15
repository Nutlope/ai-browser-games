import { MakerLogo } from "@/components/logos";
import { MAKER_ORDER, MAKERS } from "@/lib/makers";
import type { GameSlug } from "@/lib/games";
import type {
  GameFilter,
  SortKey,
  ViewMode,
  ViewState
} from "@/lib/runs-view";
import styles from "./controls.module.css";

type ControlsProps = {
  state: ViewState;
  resultCount: number;
  availableMakers: Set<string>;
  onChange: (patch: Partial<ViewState>) => void;
};

const GAME_OPTIONS: { value: GameFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "snake", label: "Snake" },
  { value: "tetris", label: "Tetris" },
  { value: "breakout", label: "Breakout" }
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "cost", label: "Cost" },
  { value: "tokens", label: "Tokens" }
];

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "gallery", label: "Gallery" },
  { value: "table", label: "Table" }
];

export function Controls({ state, resultCount, availableMakers, onChange }: ControlsProps) {
  const toggleMaker = (id: (typeof MAKER_ORDER)[number]) => {
    const next = state.makers.includes(id)
      ? state.makers.filter((m) => m !== id)
      : [...state.makers, id];
    onChange({ makers: next });
  };

  const setSort = (sort: SortKey) => {
    if (state.sort === sort) {
      onChange({ dir: state.dir === "asc" ? "desc" : "asc" });
    } else {
      onChange({ sort, dir: sort === "cost" ? "asc" : "desc" });
    }
  };

  return (
    <div className={styles.bar}>
      <div className={styles.row}>
        <div className={styles.segment} role="group" aria-label="Filter by game">
          {GAME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.seg}
              data-on={state.game === option.value}
              onClick={() => onChange({ game: option.value as GameSlug | "all" })}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={styles.right}>
          <div className={styles.sortGroup} role="group" aria-label="Sort runs">
            <span className={styles.sortLabel}>Sort</span>
            {SORT_OPTIONS.map((option) => {
              const active = state.sort === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={styles.seg}
                  data-on={active}
                  onClick={() => setSort(option.value)}
                  aria-label={`Sort by ${option.label}${
                    active ? `, ${state.dir === "asc" ? "ascending" : "descending"}` : ""
                  }`}
                >
                  {option.label}
                  {active ? (
                    <span className={styles.caret} aria-hidden="true">
                      {state.dir === "asc" ? "↑" : "↓"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className={styles.segment} role="group" aria-label="View mode">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.seg}
                data-on={state.view === option.value}
                onClick={() => onChange({ view: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.makers} role="group" aria-label="Filter by maker">
          {MAKER_ORDER.filter((id) => availableMakers.has(id)).map((id) => {
            const active = state.makers.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={styles.chip}
                data-on={active}
                aria-pressed={active}
                onClick={() => toggleMaker(id)}
              >
                <span className={styles.chipLogo}>
                  <MakerLogo maker={id} size={14} />
                </span>
                {MAKERS[id].name}
              </button>
            );
          })}
        </div>
        <span className={`${styles.count} tnum`}>{resultCount} builds</span>
      </div>
    </div>
  );
}
