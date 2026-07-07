import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "generated");
const outputPath = path.join(outputDir, "games.json");
const MAX_OUTPUT_TOKENS = 20000;
const REQUEST_TIMEOUT_MS = 250000;

const apiKey = process.env.TOGETHER_API_KEY;

// Models to add to generated/games.json. Unlike generate-games.mjs, this script
// is additive: it only generates the models listed here and merges them into the
// existing data by entry id, so every other model's committed results are kept.
// Pricing is per million tokens and mirrors Together's published model pricing.
const MODELS_TO_ADD = [
  {
    id: "zai-org/GLM-5.2",
    label: "GLM 5.2",
    provider: "Together",
    inputPricePerMillion: 1.4,
    outputPricePerMillion: 4.4,
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

async function loadExistingOutput() {
  try {
    const file = await readFile(outputPath, "utf8");
    const parsed = JSON.parse(file);

    return Object.fromEntries(
      gamePrompts.map((gamePrompt) => [
        gamePrompt.key,
        Array.isArray(parsed[gamePrompt.key]) ? parsed[gamePrompt.key] : [],
      ]),
    );
  } catch {
    return Object.fromEntries(gamePrompts.map((gamePrompt) => [gamePrompt.key, []]));
  }
}

// Merge new entries into existing ones by id: an existing entry with the same id
// is replaced, everything else is preserved. This is what keeps the add additive.
function mergeEntries(existingEntries, nextEntries) {
  const byId = new Map(existingEntries.map((entry) => [entry.id, entry]));

  for (const entry of nextEntries) {
    byId.set(entry.id, entry);
  }

  return Array.from(byId.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
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
      "Missing TOGETHER_API_KEY. Add it to your environment before running pnpm add:together-model.",
    );
    process.exit(1);
  }

  if (MODELS_TO_ADD.length === 0) {
    console.error("MODELS_TO_ADD is empty. Add at least one model to generate.");
    process.exit(1);
  }

  const generated = Object.fromEntries(
    gamePrompts.map((gamePrompt) => [gamePrompt.key, []]),
  );
  const failures = [];
  let successCount = 0;

  for (const gamePrompt of gamePrompts) {
    process.stdout.write(
      `Generating ${gamePrompt.game} for ${MODELS_TO_ADD.length} model(s) to add...\n`,
    );

    const results = await Promise.allSettled(
      MODELS_TO_ADD.map(async (model) => {
        const entry = await attemptCreateGame(model, gamePrompt, 3);
        return { entry, model };
      }),
    );

    results.forEach((result, index) => {
      const model = MODELS_TO_ADD[index];

      if (result.status === "fulfilled") {
        generated[gamePrompt.key].push(result.value.entry);
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

  if (successCount === 0) {
    throw new Error(
      "No generations succeeded, so generated/games.json was left unchanged.",
    );
  }

  // Merge the freshly generated entries into whatever is already committed, so
  // existing models keep their results and only the added models are written.
  const existing = await loadExistingOutput();
  const merged = Object.fromEntries(
    gamePrompts.map((gamePrompt) => [
      gamePrompt.key,
      mergeEntries(existing[gamePrompt.key], generated[gamePrompt.key]),
    ]),
  );

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(merged, null, 2) + "\n", "utf8");

  process.stdout.write(
    `Added ${successCount} generation(s) for ${MODELS_TO_ADD.map((m) => m.label).join(", ")} to ${outputPath}\n`,
  );

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
