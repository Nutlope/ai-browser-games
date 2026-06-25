import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { getGeneratedHtmlSyntaxError } from "../../lib/game-html";
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
  const trimmed = value.trim();

  // Some models prepend conversational prose (e.g. "Here is the HTML
  // code...") before the document/fence despite being told to return only
  // HTML. Find where the real document starts and drop everything before it,
  // so leading commentary never ends up baked into the stored HTML.
  const docStart = trimmed.search(/<!doctype\s+html|<html[\s>]/i);
  const sliced = docStart > 0 ? trimmed.slice(docStart) : trimmed;

  return sliced
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
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

  // Looking complete isn't enough: the embedded JS can still fail to parse
  // (e.g. a mismatched brace), which would otherwise get stored as a
  // "success" and only show up as a live crash when someone opens it on the
  // site. Catch that here so it retries like any other failure instead.
  const syntaxError = getGeneratedHtmlSyntaxError(html);
  if (syntaxError) {
    throw new Error(`Model returned HTML with a JavaScript syntax error: ${syntaxError}`);
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

/** Reads one game's entry array from its own file, e.g. generated/together/doom.json. */
export async function loadGameFile(filePath: string): Promise<GameEntry[]> {
  try {
    const file = await readFile(filePath, "utf8");
    const parsed = JSON.parse(file) as unknown;
    return Array.isArray(parsed) ? (parsed as GameEntry[]) : [];
  } catch {
    return [];
  }
}

async function loadExistingReport(
  reportPath: string,
): Promise<{ successes: GenerationSuccess[]; failures: GenerationFailure[] }> {
  try {
    const file = await readFile(reportPath, "utf8");
    const parsed = JSON.parse(file) as {
      successes?: GenerationSuccess[];
      failures?: GenerationFailure[];
    };

    return { successes: parsed.successes ?? [], failures: parsed.failures ?? [] };
  } catch {
    return { successes: [], failures: [] };
  }
}

export function mergeEntries(existingEntries: GameEntry[], nextEntries: GameEntry[]): GameEntry[] {
  const byId = new Map(existingEntries.map((entry) => [entry.id, entry]));

  for (const entry of nextEntries) {
    byId.set(entry.id, entry);
  }

  // Every file is now scoped to one provider, so a plain label sort is enough.
  return Array.from(byId.values()).sort((left, right) => left.label.localeCompare(right.label));
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
            "You write concise, production-ready single-file browser games. Respond with the raw HTML document only: no lead-in sentence, no explanation, no markdown code fences. Your entire response must start with \"<!DOCTYPE html>\" and end with \"</html>\".",
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

function elapsedSeconds(start: number): string {
  return ((Date.now() - start) / 1000).toFixed(1);
}

async function attemptCreateGame(
  model: ModelConfig,
  gamePrompt: GamePromptConfig,
  createGame: (model: ModelConfig, gamePrompt: GamePromptConfig) => Promise<GameEntry>,
  retries: number,
  label: string,
): Promise<GameEntry> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await createGame(model, gamePrompt);
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        const message = error instanceof Error ? error.message : String(error);
        const delayMs = 1200 * (attempt + 1);
        process.stdout.write(
          `  … ${label} attempt ${attempt + 1}/${retries + 1} failed (${message}); retrying in ${delayMs}ms\n`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/** Serializes writes within this process so concurrent completions never race
 * each other, and re-reads each game's own file from disk immediately before
 * writing it — since every game now has its own file (generated/<provider>/
 * <slug>.json), a sibling process generating a different game can never
 * clobber this one's write at all, not just "unlikely to". */
function createPersister(outputDir: string) {
  let writeQueue: Promise<void> = Promise.resolve();

  return function persistEntry(gamePrompt: GamePromptConfig, entry: GameEntry): Promise<string> {
    const filePath = path.join(outputDir, `${gamePrompt.slug}.json`);

    writeQueue = writeQueue.then(async () => {
      const existing = await loadGameFile(filePath);
      const merged = mergeEntries(existing, [entry]);

      await mkdir(outputDir, { recursive: true });
      await writeFile(filePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
    });

    return writeQueue.then(() => filePath);
  };
}

export type GenerationRunConfig = {
  providerName: string;
  apiKey: string | undefined;
  missingKeyMessage: string;
  models: ModelConfig[];
  outputDir: string;
  reportPath: string;
  createGame: (model: ModelConfig, gamePrompt: GamePromptConfig) => Promise<GameEntry>;
};

/** Shared orchestration: runs every (game, model) pair concurrently, logging
 * each request's start/finish/retry with elapsed time, and persists each
 * successful entry to disk as soon as it lands instead of waiting for the
 * whole batch — so a single slow/stuck request never hides or blocks the
 * results that already finished. */
export async function runGeneration(config: GenerationRunConfig): Promise<void> {
  if (!config.apiKey) {
    console.error(config.missingKeyMessage);
    process.exit(1);
  }

  // Optional comma-separated list of game slugs (e.g. "doom,minecraft") to
  // regenerate only a subset. Games left out keep whatever is already on disk.
  const onlySlugs = process.env.GENERATE_GAMES?.split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const targetGamePrompts = onlySlugs?.length
    ? gamePrompts.filter((gamePrompt) => onlySlugs.includes(gamePrompt.slug))
    : gamePrompts;

  // Optional comma-separated list of model ids or labels (e.g. "DeepSeek V4
  // Pro") to regenerate only those models, e.g. to cheaply re-run a single
  // model that produced a bad entry without re-paying for every other model.
  const onlyModels = process.env.GENERATE_MODELS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const targetModels = onlyModels?.length
    ? config.models.filter(
        (model) => onlyModels.includes(model.id) || onlyModels.includes(model.label),
      )
    : config.models;

  const tasks = targetGamePrompts.flatMap((gamePrompt) =>
    targetModels.map((model) => ({ gamePrompt, model })),
  );

  process.stdout.write(
    `Generating ${targetGamePrompts.length} games for ${targetModels.length} models (${tasks.length} requests) all in parallel...\n`,
  );

  const persistEntry = createPersister(config.outputDir);
  const failures: GenerationFailure[] = [];
  const successes: GenerationSuccess[] = [];
  const runStart = Date.now();

  await Promise.all(
    tasks.map(async ({ model, gamePrompt }) => {
      const label = `${gamePrompt.slug}/${model.label}`;
      const taskStart = Date.now();
      process.stdout.write(`→ ${label} started\n`);

      try {
        const entry = await attemptCreateGame(model, gamePrompt, config.createGame, 3, label);
        process.stdout.write(
          `✓ ${label} finished in ${elapsedSeconds(taskStart)}s (${entry.outputTokens ?? "?"} output tokens)\n`,
        );
        const filePath = await persistEntry(gamePrompt, entry);
        process.stdout.write(`  saved → ${filePath}\n`);
        successes.push({
          model: model.id,
          game: gamePrompt.game,
          outputTokens: entry.outputTokens ?? null,
          totalTokens: entry.totalTokens ?? null,
          costUsd: entry.generationCostUsd ?? null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(`✗ ${label} failed after ${elapsedSeconds(taskStart)}s: ${message}\n`);
        failures.push({ model: model.id, game: gamePrompt.game, error: message });
      }
    }),
  );

  // Only replace report rows for the games this run targeted; carry the rest
  // forward so a per-game process (see generate-per-game.ts) doesn't clobber
  // sibling processes' report entries for the games they're generating.
  const targetGameNames = new Set(targetGamePrompts.map((gamePrompt) => gamePrompt.game));
  const existingReport = await loadExistingReport(config.reportPath);
  const allSuccesses = [
    ...existingReport.successes.filter((success) => !targetGameNames.has(success.game)),
    ...successes,
  ];
  const allFailures = [
    ...existingReport.failures.filter((failure) => !targetGameNames.has(failure.game)),
    ...failures,
  ];

  await mkdir(path.dirname(config.reportPath), { recursive: true });
  await writeFile(
    config.reportPath,
    JSON.stringify(
      {
        provider: config.providerName,
        generatedAt: new Date().toISOString(),
        successCount: allSuccesses.length,
        failureCount: allFailures.length,
        successes: allSuccesses,
        failures: allFailures,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  if (successes.length === 0) {
    throw new Error(`No generations succeeded; nothing was written to ${config.outputDir}.`);
  }

  process.stdout.write(`Done in ${elapsedSeconds(runStart)}s total.\n`);

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
