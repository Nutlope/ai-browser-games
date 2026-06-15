export function formatCost(value: number | null | undefined) {
  if (value == null) {
    return "--";
  }

  return `$${value.toFixed(4)}`;
}

export function formatTokens(value: number | null | undefined) {
  if (value == null) {
    return "--";
  }

  if (value < 1000) {
    return String(value);
  }

  return `${(value / 1000).toFixed(1)}k`;
}

export function formatTokensFull(value: number | null | undefined) {
  if (value == null) {
    return "Not recorded";
  }

  return `${value.toLocaleString()} tokens`;
}

/** Position of a value inside [min, max], clamped to 0..1, for magnitude bars. */
export function normalize(value: number | null | undefined, min: number, max: number) {
  if (value == null || max <= min) {
    return 0;
  }

  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** Ratio of a value to a baseline, formatted as a multiple (e.g. "53x"). */
export function formatMultiple(value: number, baseline: number) {
  if (!baseline) {
    return "--";
  }

  const multiple = value / baseline;

  return multiple >= 10 ? `${Math.round(multiple)}x` : `${multiple.toFixed(1)}x`;
}
