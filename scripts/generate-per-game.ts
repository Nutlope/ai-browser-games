import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { gamePrompts } from "./shared/game-prompts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const provider = process.argv[2];

if (provider !== "together" && provider !== "openrouter") {
  console.error("Usage: tsx scripts/generate-per-game.ts <together|openrouter>");
  process.exit(1);
}

const scriptPath = path.join(
  __dirname,
  provider === "together" ? "generate-games.ts" : "generate-openrouter-games.ts",
);

const onlySlugs = process.env.GENERATE_GAMES?.split(",")
  .map((slug) => slug.trim())
  .filter(Boolean);
const targetSlugs = onlySlugs?.length ? onlySlugs : gamePrompts.map((gamePrompt) => gamePrompt.slug);

type ChildResult = {
  slug: string;
  code: number | null;
  elapsedSec: number;
};

/** Pipes a child's output line-by-line, tagging every line with the game slug
 * so output from several concurrent processes stays readable when interleaved. */
function pipeTagged(tag: string, stream: NodeJS.ReadableStream, out: NodeJS.WritableStream): void {
  let buffer = "";
  stream.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      out.write(`${tag} ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buffer) {
      out.write(`${tag} ${buffer}\n`);
    }
  });
}

/** Runs one game's generation as its own OS process (GENERATE_GAMES scoped to
 * a single slug), so a hang or repeated failure in one game can never block,
 * delay, or hide the results of the others. */
function runChild(slug: string): Promise<ChildResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tag = `[${slug}]`;

    const child = spawn("pnpm", ["exec", "tsx", scriptPath], {
      env: { ...process.env, GENERATE_GAMES: slug },
      stdio: ["ignore", "pipe", "pipe"],
    });

    pipeTagged(tag, child.stdout, process.stdout);
    pipeTagged(tag, child.stderr, process.stderr);

    child.on("close", (code) => {
      const elapsedSec = (Date.now() - start) / 1000;
      process.stdout.write(`${tag} exited with code ${code} after ${elapsedSec.toFixed(1)}s\n`);
      resolve({ slug, code, elapsedSec });
    });
  });
}

async function main(): Promise<void> {
  process.stdout.write(
    `Spawning ${targetSlugs.length} parallel process(es) (one per game) for ${provider}: ${targetSlugs.join(", ")}\n`,
  );

  const start = Date.now();
  const results = await Promise.all(targetSlugs.map(runChild));
  const totalSec = (Date.now() - start) / 1000;

  const failed = results.filter((result) => result.code !== 0);

  process.stdout.write(
    `\nDone in ${totalSec.toFixed(1)}s total. ${results.length - failed.length}/${results.length} game processes exited cleanly.\n`,
  );

  if (failed.length > 0) {
    process.stdout.write(
      `Games with at least one failed model (see per-game report for detail): ${failed.map((result) => result.slug).join(", ")}\n`,
    );
    process.exitCode = 1;
  }
}

main();
