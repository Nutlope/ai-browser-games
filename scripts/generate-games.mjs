import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "generated");
const outputPath = path.join(outputDir, "games.json");
const reportPath = path.join(outputDir, "together-report.json");
const MAX_OUTPUT_TOKENS = 20000;
const REQUEST_TIMEOUT_MS = 250000;

const apiKey = process.env.TOGETHER_API_KEY;

const models = [
  {
    id: "deepseek-ai/DeepSeek-V4-Pro",
    label: "DeepSeek V4 Pro",
    provider: "Together",
    inputPricePerMillion: 2.1,
    outputPricePerMillion: 4.4,
  },
  {
    id: "moonshotai/Kimi-K2.6",
    label: "Kimi K2.6",
    provider: "Together",
    inputPricePerMillion: 1.2,
    outputPricePerMillion: 4.5,
  },
  {
    id: "MiniMaxAI/MiniMax-M2.7",
    label: "MiniMax M2.7",
    provider: "Together",
    inputPricePerMillion: 0.3,
    outputPricePerMillion: 1.2,
  },
  {
    id: "zai-org/GLM-5.1",
    label: "GLM 5.1",
    provider: "Together",
    inputPricePerMillion: 1.4,
    outputPricePerMillion: 4.4,
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    label: "Nemotron 3 Ultra 550B",
    provider: "Together",
    inputPricePerMillion: 0.60,
    outputPricePerMillion: 3.60,
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
    key: "tetrisLiteEntries",
    game: "Tetris-lite",
    slug: "tetris-lite",
    prompt: [
      "Build a polished browser Tetris-lite falling-block game as a single self-contained HTML document.",
      "Requirements:",
      "- Return only HTML, with inline CSS and JavaScript. No markdown fences.",
      "- The game must fit cleanly inside a square 480x480 iframe.",
      "- Support keyboard controls for moving, rotating, soft drop, and hard drop.",
      "- Include falling tetromino-like pieces, collision handling, line clears, scoring, restart handling, and clear visual feedback.",
      "- Keep the design tasteful and minimal.",
      "- Keep the implementation compact and avoid unnecessary code or commentary.",
      "- Do not depend on any external assets, fonts, libraries, or network requests.",
    ].join("\n"),
  },
  {
    key: "breakoutEntries",
    game: "Breakout",
    slug: "breakout",
    prompt: [
      "Build a polished browser Breakout game as a single self-contained HTML document.",
      "Requirements:",
      "- Return only HTML, with inline CSS and JavaScript. No markdown fences.",
      "- The game must fit cleanly inside a square 480x480 iframe.",
      "- Support keyboard and pointer controls for the paddle.",
      "- Include ball physics, brick collision, score, lives or restart handling, and clear visual feedback.",
      "- Keep the design tasteful and minimal.",
      "- Keep the implementation compact and avoid unnecessary code or commentary.",
      "- Do not depend on any external assets, fonts, libraries, or network requests.",
    ].join("\n"),
  },
];

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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

  const output = Object.fromEntries(
    gamePrompts.map((gamePrompt) => [gamePrompt.key, []]),
  );
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

  const nextOutput = Object.fromEntries(
    gamePrompts.map((gamePrompt) => [
      gamePrompt.key,
      output[gamePrompt.key].sort((left, right) =>
        left.label.localeCompare(right.label),
      ),
    ]),
  );

  await writeFile(outputPath, JSON.stringify(nextOutput, null, 2) + "\n", "utf8");

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
