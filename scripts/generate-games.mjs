import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "generated");
const outputPath = path.join(outputDir, "games.json");
const reportPath = path.join(outputDir, "together-report.json");
const MAX_OUTPUT_TOKENS = 10000;

const apiKey = process.env.TOGETHER_API_KEY;

const models = [
  {
    id: "MiniMaxAI/MiniMax-M2.5",
    label: "MiniMax M2.5",
    provider: "Together",
    inputPricePerMillion: 0.3,
    outputPricePerMillion: 1.2,
  },
  {
    id: "moonshotai/Kimi-K2.5",
    label: "Kimi K2.5",
    provider: "Together",
    inputPricePerMillion: 0.5,
    outputPricePerMillion: 2.8,
  },
  {
    id: "zai-org/GLM-5.1",
    label: "GLM 5.1",
    provider: "Together",
    inputPricePerMillion: 1.4,
    outputPricePerMillion: 4.4,
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "Together",
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
  },
  {
    id: "google/gemma-4-31B-it",
    label: "Gemma 4 31B",
    provider: "Together",
    inputPricePerMillion: 0.2,
    outputPricePerMillion: 0.5,
  },
];

const promptVersion = "v2";

const gamePrompts = [
  {
    key: "snakeEntries",
    game: "Snake",
    slug: "snake",
    prompt: [
      "Build a polished browser snake game as a single self-contained HTML document.",
      "Requirements:",
      "- Return only HTML, with inline CSS and JavaScript. No markdown fences.",
      "- The game must fit cleanly inside a square 480x480 iframe.",
      "- Make the game immediately playable after the user clicks into the iframe.",
      "- Support arrow keys and WASD.",
      "- Include score, restart handling, and clear visual feedback.",
      "- Keep the design tasteful and minimal.",
      "- Keep the implementation compact and avoid unnecessary code or commentary.",
      "- Do not depend on any external assets, fonts, libraries, or network requests.",
    ].join("\n"),
  },
  {
    key: "flappyEntries",
    game: "Flappy",
    slug: "flappy",
    prompt: [
      "Build a polished browser flappy-bird-style game as a single self-contained HTML document.",
      "Requirements:",
      "- Return only HTML, with inline CSS and JavaScript. No markdown fences.",
      "- The game must fit cleanly inside a square 480x480 iframe.",
      "- Make the game playable with click/tap and spacebar.",
      "- Include score, restart handling, and clear visual feedback.",
      "- Keep the design tasteful and minimal.",
      "- Keep the implementation compact and avoid unnecessary code or commentary.",
      "- Do not depend on any external assets, fonts, libraries, or network requests.",
    ].join("\n"),
  },
];

async function loadExistingOutput() {
  try {
    const file = await readFile(outputPath, "utf8");
    const parsed = JSON.parse(file);

    return {
      snakeEntries: Array.isArray(parsed.snakeEntries)
        ? parsed.snakeEntries
        : [],
      flappyEntries: Array.isArray(parsed.flappyEntries)
        ? parsed.flappyEntries
        : [],
    };
  } catch {
    return {
      snakeEntries: [],
      flappyEntries: [],
    };
  }
}

function mergeEntries(existingEntries, nextEntries) {
  const byId = new Map(existingEntries.map((entry) => [entry.id, entry]));

  for (const entry of nextEntries) {
    byId.set(entry.id, entry);
  }

  return Array.from(byId.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .join("");
  }

  return "";
}

function stripCodeFences(value) {
  return value
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function looksLikeCompleteHtml(value) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.includes("<html") && trimmed.includes("</html>");
}

function assertValidHtml(html, usage) {
  if (!looksLikeCompleteHtml(html)) {
    const tokenNote =
      usage?.completion_tokens === MAX_OUTPUT_TOKENS
        ? " The response also hit the max token limit, so it was likely truncated."
        : "";

    throw new Error(`Model returned incomplete HTML.${tokenNote}`);
  }
}

function computeCostUsd(usage, model) {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const cost =
    (promptTokens * model.inputPricePerMillion) / 1_000_000 +
    (completionTokens * model.outputPricePerMillion) / 1_000_000;

  return Number(cost.toFixed(6));
}

async function createGame(model, gamePrompt) {
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
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

  const payload = await response.json();
  const choice = payload.choices?.[0];
  const html = stripCodeFences(extractTextContent(choice?.message?.content));
  const usage = payload.usage ?? {};

  if (!html) {
    throw new Error("Model returned an empty response.");
  }

  assertValidHtml(html, usage);

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
    description: `Generated via Together using ${model.id} (${promptVersion}).`,
    html,
  };
}

async function attemptCreateGame(model, gamePrompt, retries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await createGame(model, gamePrompt);
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1200 * (attempt + 1)),
        );
      }
    }
  }

  throw lastError;
}

async function main() {
  if (!apiKey) {
    console.error(
      "Missing TOGETHER_API_KEY. Add it to your environment before running pnpm generate:games.",
    );
    process.exit(1);
  }

  const output = {
    snakeEntries: [],
    flappyEntries: [],
  };
  const failures = [];
  const successes = [];
  let successCount = 0;

  for (const gamePrompt of gamePrompts) {
    process.stdout.write(
      `Generating ${gamePrompt.game} for ${models.length} models in parallel...\n`,
    );

    const results = await Promise.allSettled(
      models.map(async (model) => {
        const entry = await attemptCreateGame(model, gamePrompt, 3);
        return { entry, model };
      }),
    );

    results.forEach((result, index) => {
      const model = models[index];

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
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    });
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        provider: "Together",
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
      "No generations succeeded, so generated/games.json was left unchanged.",
    );
  }

  const existing = await loadExistingOutput();
  const merged = {
    snakeEntries: mergeEntries(existing.snakeEntries, output.snakeEntries),
    flappyEntries: mergeEntries(existing.flappyEntries, output.flappyEntries),
  };

  await writeFile(outputPath, JSON.stringify(merged, null, 2) + "\n", "utf8");

  process.stdout.write(`Wrote ${outputPath}\n`);

  if (failures.length > 0) {
    process.stderr.write("Failed generations:\n");
    failures.forEach((failure) => {
      process.stderr.write(
        `- ${failure.model} / ${failure.game}: ${failure.error}\n`,
      );
    });
    process.exitCode = 1;
  } else {
    process.stdout.write("All generations succeeded.\n");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
