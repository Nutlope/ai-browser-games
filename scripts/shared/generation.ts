import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { GameEntry } from "../../types/game";
import { type GamePromptConfig, gamePrompts, promptVersion } from "./game-prompts";

export { gamePrompts, promptVersion };
export type { GamePromptConfig };

export type ModelConfig = {
  id: string;
  label: string;
  provider: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
};

export type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type ChatCompletionContentPart = string | { text?: string; [key: string]: unknown };

export type ChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: string | ChatCompletionContentPart[];
    };
  }>;
  usage?: Usage;
};

export type GenerationSuccess = {
  model: string;
  game: string;
  outputTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
};

export type GenerationFailure = {
  model: string;
  game: string;
  error: string;
};

export const MAX_OUTPUT_TOKENS = 20000;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extractTextContent(
  content: string | ChatCompletionContentPart[] | undefined,
): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }

        return "";
      })
      .join("");
  }

  return "";
}

export function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function looksLikeCompleteHtml(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return trimmed.includes("<html") && trimmed.includes("</html>");
}

export function assertValidHtml(html: string, usage: Usage | undefined): void {
  if (!looksLikeCompleteHtml(html)) {
    const tokenNote =
      usage?.completion_tokens === MAX_OUTPUT_TOKENS
        ? " The response also hit the max token limit, so it was likely truncated."
        : "";

    throw new Error(`Model returned incomplete HTML.${tokenNote}`);
  }
}

export function computeCostUsd(usage: Usage | undefined, model: ModelConfig): number {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const cost =
    (promptTokens * model.inputPricePerMillion) / 1_000_000 +
    (completionTokens * model.outputPricePerMillion) / 1_000_000;

  return Number(cost.toFixed(6));
}

export async function loadExistingOutput(outputPath: string): Promise<Record<string, GameEntry[]>> {
  try {
    const file = await readFile(outputPath, "utf8");
    const parsed = JSON.parse(file) as Record<string, unknown>;

    return Object.fromEntries(
      gamePrompts.map((gamePrompt) => [
        gamePrompt.key,
        Array.isArray(parsed[gamePrompt.key]) ? (parsed[gamePrompt.key] as GameEntry[]) : [],
      ]),
    );
  } catch {
    return Object.fromEntries(gamePrompts.map((gamePrompt) => [gamePrompt.key, []]));
  }
}

export function mergeEntries(existingEntries: GameEntry[], nextEntries: GameEntry[]): GameEntry[] {
  const byId = new Map(existingEntries.map((entry) => [entry.id, entry]));

  for (const entry of nextEntries) {
    byId.set(entry.id, entry);
  }

  return Array.from(byId.values()).sort((left, right) => {
    const providerDiff =
      (left.provider === "OpenRouter" ? 1 : 0) - (right.provider === "OpenRouter" ? 1 : 0);
    if (providerDiff !== 0) {
      return providerDiff;
    }

    return left.label.localeCompare(right.label);
  });
}

export function buildGameEntry(
  model: ModelConfig,
  gamePrompt: GamePromptConfig,
  html: string,
  usage: Usage,
  providerName: string,
): GameEntry {
  return {
    id: `${slugify(model.label)}-${gamePrompt.slug}`,
    label: model.label,
    game: gamePrompt.game,
    model: model.label,
    provider: model.provider,
    sourceModelId: model.id,
    inputTokens: usage.prompt_tokens ?? undefined,
    outputTokens: usage.completion_tokens ?? undefined,
    totalTokens: usage.total_tokens ?? undefined,
    generationCostUsd: computeCostUsd(usage, model),
    generatedAt: new Date().toISOString(),
    description: `Generated via ${providerName} using ${model.id} (${promptVersion}).`,
    html,
  };
}

export type ChatCompletionRequestConfig = {
  url: string;
  apiKey: string | undefined;
  extraHeaders?: Record<string, string>;
  timeoutMs?: number;
};

/** Sends the shared game-generation chat completion request and returns the raw HTML + usage. */
export async function requestGameHtml(
  config: ChatCompletionRequestConfig,
  model: ModelConfig,
  gamePrompt: GamePromptConfig,
): Promise<{ html: string; usage: Usage }> {
  const response = await fetch(config.url, {
    method: "POST",
    ...(config.timeoutMs ? { signal: AbortSignal.timeout(config.timeoutMs) } : {}),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...config.extraHeaders,
    },
    body: JSON.stringify({
      model: model.id,
      temperature: 0.4,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        {
          role: "system",
          content:
            "You write concise, production-ready single-file browser games. Return only the HTML document.",
        },
        {
          role: "user",
          content: gamePrompt.prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
  }

  const payload = (await response.json()) as ChatCompletionPayload;
  const choice = payload.choices?.[0];
  const html = stripCodeFences(extractTextContent(choice?.message?.content));
  const usage = payload.usage ?? {};

  if (!html) {
    throw new Error("Model returned an empty response.");
  }

  assertValidHtml(html, usage);

  return { html, usage };
}

async function attemptCreateGame(
  model: ModelConfig,
  gamePrompt: GamePromptConfig,
  createGame: (model: ModelConfig, gamePrompt: GamePromptConfig) => Promise<GameEntry>,
  retries = 3,
): Promise<GameEntry> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await createGame(model, gamePrompt);
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export type GenerationRunConfig = {
  providerName: string;
  apiKey: string | undefined;
  missingKeyMessage: string;
  models: ModelConfig[];
  outputPath: string;
  reportPath: string;
  createGame: (model: ModelConfig, gamePrompt: GamePromptConfig) => Promise<GameEntry>;
};

/** Shared orchestration: runs every (game, model) pair concurrently, merges with
 * existing output so previously generated entries for other games are kept,
 * and writes the data + report files. */
export async function runGeneration(config: GenerationRunConfig): Promise<void> {
  if (!config.apiKey) {
    console.error(config.missingKeyMessage);
    process.exit(1);
  }

  const output: Record<string, GameEntry[]> = Object.fromEntries(
    gamePrompts.map((gamePrompt) => [gamePrompt.key, []]),
  );
  const failures: GenerationFailure[] = [];
  const successes: GenerationSuccess[] = [];
  let successCount = 0;

  const tasks = gamePrompts.flatMap((gamePrompt) =>
    config.models.map((model) => ({ gamePrompt, model })),
  );

  process.stdout.write(
    `Generating ${gamePrompts.length} games for ${config.models.length} models (${tasks.length} requests) all in parallel...\n`,
  );

  const results = await Promise.allSettled(
    tasks.map(async ({ model, gamePrompt }) => {
      const entry = await attemptCreateGame(model, gamePrompt, config.createGame, 3);
      return { entry, model, gamePrompt };
    }),
  );

  results.forEach((result, index) => {
    const { model, gamePrompt } = tasks[index];

    if (result.status === "fulfilled") {
      const { entry } = result.value;
      output[gamePrompt.key].push(entry);
      successes.push({
        model: model.id,
        game: gamePrompt.game,
        outputTokens: entry.outputTokens ?? null,
        totalTokens: entry.totalTokens ?? null,
        costUsd: entry.generationCostUsd ?? null,
      });
      successCount += 1;
      return;
    }

    failures.push({
      model: model.id,
      game: gamePrompt.game,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  });

  await mkdir(path.dirname(config.reportPath), { recursive: true });
  await writeFile(
    config.reportPath,
    JSON.stringify(
      {
        provider: config.providerName,
        generatedAt: new Date().toISOString(),
        successCount,
        failureCount: failures.length,
        successes,
        failures,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  if (successCount === 0) {
    throw new Error(
      `No generations succeeded, so ${path.basename(config.outputPath)} was left unchanged.`,
    );
  }

  const existing = await loadExistingOutput(config.outputPath);
  const merged = Object.fromEntries(
    gamePrompts.map((gamePrompt) => [
      gamePrompt.key,
      mergeEntries(existing[gamePrompt.key], output[gamePrompt.key]),
    ]),
  );

  await mkdir(path.dirname(config.outputPath), { recursive: true });
  await writeFile(config.outputPath, JSON.stringify(merged, null, 2) + "\n", "utf8");

  process.stdout.write(`Wrote ${config.outputPath}\n`);

  if (failures.length > 0) {
    process.stderr.write("Failed generations:\n");
    failures.forEach((failure) => {
      process.stderr.write(`- ${failure.model} / ${failure.game}: ${failure.error}\n`);
    });
    process.exitCode = 1;
  } else {
    process.stdout.write("All generations succeeded.\n");
  }
}
