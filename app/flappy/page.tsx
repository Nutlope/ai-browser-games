import { ComparisonPage } from "@/components/comparison-page";
import { flappyEntries } from "@/lib/games";

export default function FlappyPage() {
  return (
    <ComparisonPage
      eyebrow="AI Browser Games"
      title="Flappy"
      description="The same comparison shell for flappy-style generations, keeping the format fixed so differences in model output are easier to spot."
      note="As the gallery grows, each playable iframe can show the model used, output tokens, and generation cost right next to the game."
      entries={flappyEntries}
    />
  );
}
