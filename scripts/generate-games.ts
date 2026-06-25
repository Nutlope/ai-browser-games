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
const generatedDir = path.join(rootDir, "generated");
const REQUEST_TIMEOUT_MS = 250000;

const apiKey = process.env.TOGETHER_API_KEY;

const models: ModelConfig[] = [
  {
    id: "deepseek-ai/DeepSeek-V4-Pro",
    label: "DeepSeek V4 Pro",
    provider: "Together",
    inputPricePerMillion: 2.1,
    outputPricePerMillion: 4.4,
  },
  {
    id: "moonshotai/Kimi-K2.7-Code",
    label: "Kimi K2.7 Code",
    provider: "Together",
    inputPricePerMillion: 0.95,
    outputPricePerMillion: 4,
  },
  {
    id: "MiniMaxAI/MiniMax-M3",
    label: "MiniMax M3",
    provider: "Together",
    inputPricePerMillion: 0.3,
    outputPricePerMillion: 1.2,
  },
  {
    id: "zai-org/GLM-5.2",
    label: "GLM 5.2",
    provider: "Together",
    inputPricePerMillion: 1.4,
    outputPricePerMillion: 4.4,
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    label: "Nemotron 3 Ultra 550B",
    provider: "Together",
    inputPricePerMillion: 0.6,
    outputPricePerMillion: 3.6,
  },
];

async function createGame(model: ModelConfig, gamePrompt: GamePromptConfig): Promise<GameEntry> {
  const { html, usage } = await requestGameHtml(
    {
      url: "https://api.together.xyz/v1/chat/completions",
      apiKey,
      timeoutMs: REQUEST_TIMEOUT_MS,
    },
    model,
    gamePrompt,
  );

  return buildGameEntry(model, gamePrompt, html, usage, "Together");
}

runGeneration({
  providerName: "Together",
  apiKey,
  missingKeyMessage:
    "Missing TOGETHER_API_KEY. Add it to your environment before running pnpm generate:games-together.",
  models,
  outputDir: path.join(generatedDir, "together"),
  reportPath: path.join(generatedDir, "together-report.json"),
  createGame,
}).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
