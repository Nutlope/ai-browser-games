export type GamePromptConfig = {
  key: string;
  game: string;
  slug: string;
  prompt: string;
};

export const promptVersion = "v3";

// Some models (notably DeepSeek) like to narrate before the code ("Here is
// the HTML code for..."), even when told to "return only HTML". Restating
// the constraint unambiguously, twice — once as the first requirement and
// once as the very last thing the model reads — heads that off at the
// prompt level instead of trying to strip it back out after the fact.
const outputFormatRules = [
  "- Return ONLY the raw HTML document. No introduction, no explanation, no commentary, and no markdown code fences before or after it.",
];

const noPreambleReminder = [
  "Output format reminder: respond with nothing but the HTML document itself.",
  'Do not write any lead-in sentence (e.g. "Here is the HTML code for..."), and do not wrap the document in markdown code fences.',
  "The very first characters of your response must be \"<!DOCTYPE html>\" and the very last characters must be \"</html>\".",
].join(" ");

function buildPrompt(intro: string, requirements: string[]): string {
  return [intro, "Requirements:", ...outputFormatRules, ...requirements, "", noPreambleReminder].join(
    "\n",
  );
}

export const gamePrompts: GamePromptConfig[] = [
  {
    key: "snakeEntries",
    game: "Snake",
    slug: "snake",
    prompt: buildPrompt("Build a polished browser snake game as a single self-contained HTML document.", [
      "- The game must fit cleanly inside a square 480x480 iframe.",
      "- Make the game immediately playable after the user clicks into the iframe.",
      "- Support arrow keys and WASD.",
      "- Include score, restart handling, and clear visual feedback.",
      "- Keep the design tasteful and minimal.",
      "- Keep the implementation compact and avoid unnecessary code or commentary.",
      "- Do not depend on any external assets, fonts, libraries, or network requests.",
    ]),
  },
  {
    key: "tetrisLiteEntries",
    game: "Tetris-lite",
    slug: "tetris-lite",
    prompt: buildPrompt(
      "Build a polished browser Tetris-lite falling-block game as a single self-contained HTML document.",
      [
        "- The game must fit cleanly inside a square 480x480 iframe.",
        "- Support keyboard controls for moving, rotating, soft drop, and hard drop.",
        "- Include falling tetromino-like pieces, collision handling, line clears, scoring, restart handling, and clear visual feedback.",
        "- Keep the design tasteful and minimal.",
        "- Keep the implementation compact and avoid unnecessary code or commentary.",
        "- Do not depend on any external assets, fonts, libraries, or network requests.",
      ],
    ),
  },
  {
    key: "breakoutEntries",
    game: "Breakout",
    slug: "breakout",
    prompt: buildPrompt("Build a polished browser Breakout game as a single self-contained HTML document.", [
      "- The game must fit cleanly inside a square 480x480 iframe.",
      "- Support keyboard and pointer controls for the paddle.",
      "- Include ball physics, brick collision, score, lives or restart handling, and clear visual feedback.",
      "- Keep the design tasteful and minimal.",
      "- Keep the implementation compact and avoid unnecessary code or commentary.",
      "- Do not depend on any external assets, fonts, libraries, or network requests.",
    ]),
  },
  {
    key: "twoZeroFourEightEntries",
    game: "2048",
    slug: "2048",
    prompt: buildPrompt(
      "Build a polished browser 2048 sliding-tile puzzle as a single self-contained HTML document.",
      [
        "- The game must fit cleanly inside a square 480x480 iframe.",
        "- Render a 4x4 grid of numbered tiles on a Canvas2D (or DOM grid) with tasteful spacing and color-graded tiles up to at least 2048.",
        "- Use ArrowUp, ArrowDown, ArrowLeft, ArrowRight (and optionally W/A/S/D) to slide all tiles in that direction; tiles with the same value colliding on the leading edge must merge into a single tile with their sum.",
        "- After each successful move, spawn exactly one new tile: value 2 with 90% probability and value 4 with 10%, on a random empty cell.",
        "- Show the current score (sum of all merged values), a best-score display using an in-memory variable (no localStorage), and a clear game-over overlay when no moves are possible.",
        "- Support restart via a visible button and via pressing R or Space.",
        "- Keep the design tasteful and minimal.",
        "- Keep the implementation compact and avoid unnecessary code or commentary.",
        "- Do not depend on any external assets, fonts, libraries, or network requests.",
      ],
    ),
  },
  {
    key: "asteroidsEntries",
    game: "Asteroids",
    slug: "asteroids",
    prompt: buildPrompt(
      "Build a polished browser Asteroids arcade game as a single self-contained HTML document.",
      [
        "- The game must fit cleanly inside a square 480x480 iframe.",
        "- Use Canvas2D vector graphics: the ship, asteroids, and bullets are drawn as line segments (or simple polygons), not sprites.",
        "- Left/Right arrows (and A/D) rotate the ship; Up arrow (or W) applies forward thrust with a visible thrust flame; Space fires a bullet.",
        "- Asteroids drift and rotate at small random angular velocities; large asteroids split into two medium on hit, medium into two small; small asteroids disappear and award score.",
        "- Wrap all entities around the screen edges (top/bottom/left/right).",
        "- Bullets have a short lifespan and a per-shot limit so the screen does not fill up.",
        "- Detect ship-vs-asteroid and bullet-vs-asteroid collisions; respawn the ship a few times before game over.",
        "- Include score, remaining lives, and a clear game-over / restart flow.",
        "- Keep the design tasteful and minimal.",
        "- Keep the implementation compact and avoid unnecessary code or commentary.",
        "- Do not depend on any external assets, fonts, libraries, or network requests.",
      ],
    ),
  },
  {
    key: "pacmanEntries",
    game: "Pac-Man",
    slug: "pacman",
    prompt: buildPrompt(
      "Build a polished browser Pac-Man-style maze chase game as a single self-contained HTML document.",
      [
        "- The game must fit cleanly inside a square 480x480 iframe.",
        "- Render a tile-based maze (a hand-authored grid of walls and corridors) on Canvas2D; include small dots on every open tile and 4 larger power dots in the corners.",
        "- Arrow keys (and W/A/S/D) steer the player; queue the next direction so turns at intersections feel responsive even if the path is currently blocked.",
        "- Implement 4 ghosts that move tile-by-tile through the maze. Use BFS or A* so each ghost chooses the next tile toward a target; give the four ghosts at least two distinct target strategies (e.g. chase the player, ambush a few tiles ahead, scatter to fixed corners, or move randomly) so they feel different.",
        "- When the player eats a power dot, ghosts become vulnerable for a few seconds; eating them awards bonus score; otherwise a collision costs a life.",
        "- Show the score, remaining lives, and a clear game-over / level-clear / restart flow.",
        "- Keep the design tasteful and minimal.",
        "- Keep the implementation compact and avoid unnecessary code or commentary.",
        "- Do not depend on any external assets, fonts, libraries, or network requests.",
      ],
    ),
  },
  {
    key: "doomEntries",
    game: "Doom",
    slug: "doom",
    prompt: buildPrompt(
      "Build a polished browser Doom/Wolfenstein-style first-person raycaster as a single self-contained HTML document.",
      [
        "- The game must fit cleanly inside a square 480x480 iframe.",
        "- Render the world with a per-column raycasting algorithm using Canvas2D (no WebGL, no libraries, no images).",
        "- The level is a small 2D grid of walls; generate the wall textures procedurally on an offscreen canvas (e.g. per-tile colored brick/stone patterns) so different wall sides look distinct.",
        "- Use W/A/S/D (and ArrowUp/ArrowDown) for forward/backward/strafe and Q/E (and ArrowLeft/ArrowRight) to rotate. The player must not pass through walls.",
        "- Render enemies and pickups as billboard sprites that scale by distance and z-sort correctly against the wall columns.",
        "- Space fires a projectile straight ahead; a hit destroys a sprite and increments score.",
        "- Include a visible HUD overlay showing health, ammo (or score), and a brief instruction line.",
        "- Show a clear game-over overlay and a restart action.",
        "- Keep the design tasteful and minimal.",
        "- Keep the implementation compact and avoid unnecessary code or commentary.",
        "- Do not depend on any external assets, fonts, libraries, or network requests.",
      ],
    ),
  },
  {
    key: "minecraftEntries",
    game: "Minecraft",
    slug: "minecraft",
    prompt: buildPrompt(
      "Build a polished browser Minecraft-style voxel sandbox as a single self-contained HTML document.",
      [
        "- The game must fit cleanly inside a square 480x480 iframe.",
        "- Render a small voxel world using raw WebGL (no Three.js, no other libraries).",
        "- Generate terrain procedurally with a simple hash-based or value noise function so each session looks different; the world is a fixed-size 3D array of voxel types.",
        "- First-person camera: ArrowLeft/ArrowRight (or Q/E) rotate the view, W/A/S/D (and ArrowUp/ArrowDown) move the player with collision against solid voxels (no walking through blocks, gravity pulls the player down to the surface).",
        "- The player can place a block of the currently selected type in front of them and break the block they are looking at; use number keys 1-4 (or an on-screen selector) to choose the block type.",
        "- Use a small palette of solid-color voxel types (e.g. grass/dirt/stone/sand/water) with hand-authored per-face colors; no textures, no images.",
        "- Show a simple HUD with the current block type and a short hint, and clear visual feedback when a block is placed or broken.",
        "- Keep the design tasteful and minimal.",
        "- Keep the implementation compact and avoid unnecessary code or commentary.",
        "- Do not depend on any external assets, fonts, libraries, or network requests.",
      ],
    ),
  },
  {
    key: "quakeEntries",
    game: "Quake",
    slug: "quake",
    prompt: buildPrompt(
      "Build a polished browser Quake-style first-person shooter as a single self-contained HTML document.",
      [
        "- The game must fit cleanly inside a square 480x480 iframe.",
        "- Render a small 3D level using raw WebGL (no Three.js, no other libraries) via a small vertex/fragment shader pipeline.",
        "- Hand-author triangle geometry for at least one rectangular room, a couple of pillar/block obstacles, and one enemy type and one pickup type; do not require any external mesh files.",
        "- First-person camera: ArrowLeft/ArrowRight (or Q/E) rotate, W/A/S/D (and ArrowUp/ArrowDown) move with collision against the level geometry (no walking through walls).",
        "- Space (or mouse click, when available) fires a projectile straight ahead; hits reduce enemy health and increment score.",
        "- Include at least one enemy that chases the player and at least one pickup (health or ammo) that restores a stat on contact.",
        "- Show a HUD with health, ammo, and score, plus a clear game-over overlay and a restart action.",
        "- Keep the design tasteful and minimal.",
        "- Keep the implementation compact and avoid unnecessary code or commentary.",
        "- Do not depend on any external assets, fonts, libraries, or network requests.",
      ],
    ),
  },
];
