/**
 * Maps a generated run to the company that actually MADE the model.
 *
 * The maker is derived from the sourceModelId namespace (e.g. "anthropic/..."),
 * never from the `provider` field, which is only the routing platform
 * (Together / OpenRouter) and is intentionally never shown in the UI.
 */
export type MakerId =
  | "openai"
  | "anthropic"
  | "deepseek"
  | "moonshot"
  | "minimax"
  | "nvidia"
  | "zai";

export type Maker = {
  id: MakerId;
  name: string;
};

export const MAKERS: Record<MakerId, Maker> = {
  openai: { id: "openai", name: "OpenAI" },
  anthropic: { id: "anthropic", name: "Anthropic" },
  deepseek: { id: "deepseek", name: "DeepSeek" },
  moonshot: { id: "moonshot", name: "Moonshot AI" },
  minimax: { id: "minimax", name: "MiniMax" },
  nvidia: { id: "nvidia", name: "NVIDIA" },
  zai: { id: "zai", name: "Z.ai" }
};

const NAMESPACE_TO_MAKER: Record<string, MakerId> = {
  openai: "openai",
  anthropic: "anthropic",
  "deepseek-ai": "deepseek",
  moonshotai: "moonshot",
  minimaxai: "minimax",
  nvidia: "nvidia",
  "zai-org": "zai"
};

export function makerFromSourceId(sourceModelId?: string): Maker | null {
  if (!sourceModelId) {
    return null;
  }

  const namespace = sourceModelId.split("/")[0]?.toLowerCase();
  const makerId = namespace ? NAMESPACE_TO_MAKER[namespace] : undefined;

  return makerId ? MAKERS[makerId] : null;
}

export const MAKER_ORDER: MakerId[] = [
  "openai",
  "anthropic",
  "deepseek",
  "moonshot",
  "minimax",
  "nvidia",
  "zai"
];
