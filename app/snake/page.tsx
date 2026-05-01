import { ComparisonPage } from "@/components/comparison-page";
import { snakeEntries } from "@/lib/games";

export default function SnakePage() {
  return (
    <ComparisonPage
      eyebrow="AI Browser Games"
      title="Snake"
      description="A comparison wall for model-generated snake experiments. Click into any tile, play in place, and compare how different models approach the same browser game."
      note="Each tile can carry generation metadata alongside the playable result, so the gallery can compare quality, token count, and spend across models."
      entries={snakeEntries}
    />
  );
}
