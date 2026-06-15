export type GameEntry = {
  id: string;
  label: string;
  html: string;
  description?: string;
  game: string;
  model: string;
  provider?: string;
  sourceModelId?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  generationCostUsd?: number;
  generatedAt?: string;
  /** True when the generated HTML failed to parse/run (set during display prep). */
  broken?: boolean;
};
