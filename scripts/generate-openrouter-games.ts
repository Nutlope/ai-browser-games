import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import type { GameEntry } from "../types/game";
import {
  type GamePromptConfig,
  type ModelConfig,
  buildGameEntry,
  requestGameHtml,
  runGeneration,
} from "./shared/generation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "generated");

const apiKey = process.env.OPENROUTER_API_KEY;

const models: ModelConfig[] = [
  {
    id: "anthropic/claude-opus-4.8",
    label: "Opus 4.8",
    provider: "OpenRouter",
    inputPricePerMillion: 15,
    outputPricePerMillion: 75,
  },
  {
    id: "openai/gpt-5.5",
    label: "GPT 5.5",
    provider: "OpenRouter",
    inputPricePerMillion: 5,
    outputPricePerMillion: 30,
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    label: "Sonnet 4.6",
    provider: "OpenRouter",
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
  },
  // {
  //   id: "google/gemini-3.1-pro-preview",
  //   label: "Gemini 3.1 Pro Preview",
  //   provider: "OpenRouter",
  //   inputPricePerMillion: 2,
  //   outputPricePerMillion: 12
  // }
];

async function createGame(model: ModelConfig, gamePrompt: GamePromptConfig): Promise<GameEntry> {
  const { html, usage } = await requestGameHtml(
    {
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey,
      extraHeaders: {
        "HTTP-Referer": "https://localhost",
        "X-Title": "AI Browser Games",
      },
    },
    model,
    gamePrompt,
  );

  return buildGameEntry(model, gamePrompt, html, usage, "OpenRouter");
}

runGeneration({
  providerName: "OpenRouter",
  apiKey,
  missingKeyMessage:
    "Missing OPENROUTER_API_KEY. Add it to your environment before running pnpm generate:games-other.",
  models,
  outputPath: path.join(outputDir, "openrouter-games.json"),
  reportPath: path.join(outputDir, "openrouter-report.json"),
  createGame,
}).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
