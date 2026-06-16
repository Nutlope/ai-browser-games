const sharedShell = (title: string, body: string, options?: { background?: string }) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
      body {
        font-family: "Trebuchet MS", "Arial Rounded MT Bold", Arial, sans-serif;
        background: ${options?.background ?? "#101418"};
      }
      button { font: inherit; }
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>`;

const embeddedGamePrelude = `
<script>
(() => {
  const store = new Map();
  const storage = {
    get length() {
      return store.size;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key) {
      key = String(key);
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    }
  };

  try {
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(window, "sessionStorage", { configurable: true, value: storage });
  } catch {}

  // Keep an embedded game from scrolling the page that hosts it. Focusing an
  // element inside an iframe makes the browser scroll the parent to bring the
  // iframe into view, which yanked the gallery down to whichever preview
  // started (e.g. a snake calling canvas.focus()). Force every focus() to
  // preventScroll and neutralize scrollIntoView; focus still works for
  // keyboard input, it just never moves the host page.
  try {
    const nativeFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (options) {
      const opts = Object.assign({}, options, { preventScroll: true });
      try {
        return nativeFocus.call(this, opts);
      } catch (error) {
        return nativeFocus.call(this);
      }
    };
  } catch {}

  try {
    Element.prototype.scrollIntoView = function () {};
  } catch {}

  const gameControlKeys = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    " ",
    "Spacebar",
    "w",
    "W",
    "a",
    "A",
    "s",
    "S",
    "d",
    "D"
  ]);

  window.addEventListener(
    "keydown",
    (event) => {
      if (gameControlKeys.has(event.key)) {
        event.preventDefault();
      }
    },
    { capture: true }
  );

  let sentPointerStartKey = false;

  window.addEventListener("pointerdown", () => {
    if (sentPointerStartKey) {
      return;
    }

    sentPointerStartKey = true;
    window.focus();
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter"
      })
    );
  });

  const showError = (message) => {
    const existing = document.getElementById("__game_runtime_error__");
    if (existing) {
      existing.textContent = message;
      return;
    }

    const error = document.createElement("div");
    error.id = "__game_runtime_error__";
    error.textContent = message;
    error.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:grid",
      "place-items:center",
      "padding:24px",
      "background:#121417",
      "color:#f8fafc",
      "font:600 15px/1.4 system-ui,-apple-system,Segoe UI,sans-serif",
      "text-align:center"
    ].join(";");
    document.addEventListener("DOMContentLoaded", () => document.body.append(error), { once: true });
    if (document.body) {
      document.body.append(error);
    }
  };

  window.addEventListener("error", (event) => {
    showError("This generated game crashed: " + (event.message || "Unknown error"));
  });

  window.addEventListener("unhandledrejection", (event) => {
    showError("This generated game crashed: " + (event.reason?.message || event.reason || "Unknown error"));
  });
})();
<\/script>`;

export function prepareEmbeddedGameHtml(html: string) {
  if (html.includes("__game_runtime_error__")) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${embeddedGamePrelude}`);
  }

  return `${embeddedGamePrelude}${html}`;
}

function scriptsFromHtml(html: string) {
  return Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)).map(
    (match) => match[1]
  );
}

export function getGeneratedHtmlSyntaxError(html: string) {
  for (const script of scriptsFromHtml(html)) {
    try {
      new Function(script);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  return null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function repairedSokobanHtml(label: string, reason: string) {
  const title = escapeHtml(`${label} Sokoban`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111827;color:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
body{display:grid;place-items:center}.game{width:480px;height:480px;display:grid;grid-template-rows:auto 1fr auto;gap:12px;padding:18px;background:#111827}
header{display:flex;align-items:center;justify-content:space-between;gap:12px}.title{min-width:0}.title strong{display:block;font-size:18px}.title span{display:block;margin-top:3px;color:#9ca3af;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stats{display:flex;gap:8px;color:#d1d5db;font-size:13px}.board{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(6,1fr);gap:4px;align-self:center;aspect-ratio:8/6;padding:8px;border:1px solid #374151;border-radius:12px;background:#0b1020}
.cell{position:relative;border-radius:7px;background:#1f2937}.wall{background:#020617}.target::after{content:"";position:absolute;inset:28%;border:2px solid #facc15;border-radius:50%}.box{background:#38bdf8;box-shadow:inset 0 -5px 0 rgba(0,0,0,.18)}.box.target{background:#22c55e}.player{background:#f97316;border-radius:999px}
footer{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#9ca3af;font-size:12px}button{border:0;border-radius:999px;background:#facc15;color:#111827;padding:9px 13px;font-weight:800;cursor:pointer}.win{color:#86efac;font-weight:800}
</style>
</head>
<body>
<main class="game">
<header><div class="title"><strong>${title}</strong><span>Repaired fallback: ${escapeHtml(reason)}</span></div><div class="stats"><span>Moves <b id="moves">0</b></span></div></header>
<section id="board" class="board" tabindex="0" aria-label="Sokoban board"></section>
<footer><span id="status">Push both boxes onto the yellow targets.</span><button id="restart" type="button">Restart</button></footer>
</main>
<script>
const level=["########","#      #","# $ .  #","#  @   #","#  . $ #","########"];
const board=document.getElementById("board"),movesEl=document.getElementById("moves"),statusEl=document.getElementById("status"),restart=document.getElementById("restart");
let walls,targets,boxes,player,moves;
const key=(x,y)=>x+","+y;
function reset(){walls=new Set();targets=new Set();boxes=new Set();moves=0;statusEl.className="";statusEl.textContent="Push both boxes onto the yellow targets.";movesEl.textContent="0";for(let y=0;y<level.length;y++){for(let x=0;x<level[y].length;x++){const c=level[y][x],k=key(x,y);if(c=="#")walls.add(k);if(c==".")targets.add(k);if(c=="$")boxes.add(k);if(c=="@")player={x,y};}}draw();board.focus();}
function draw(){board.innerHTML="";for(let y=0;y<level.length;y++){for(let x=0;x<level[y].length;x++){const k=key(x,y),cell=document.createElement("div");cell.className="cell";if(walls.has(k))cell.classList.add("wall");if(targets.has(k))cell.classList.add("target");if(boxes.has(k))cell.classList.add("box");if(boxes.has(k)&&targets.has(k))cell.classList.add("target");if(player.x===x&&player.y===y)cell.classList.add("player");board.append(cell);}}}
function move(dx,dy){const next=key(player.x+dx,player.y+dy);if(walls.has(next))return;if(boxes.has(next)){const beyond=key(player.x+dx*2,player.y+dy*2);if(walls.has(beyond)||boxes.has(beyond))return;boxes.delete(next);boxes.add(beyond);}player={x:player.x+dx,y:player.y+dy};moves++;movesEl.textContent=String(moves);draw();if([...boxes].every((box)=>targets.has(box))){statusEl.className="win";statusEl.textContent="Solved. Press Restart to play again.";}}
document.addEventListener("keydown",(event)=>{const dirs={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};const dir=dirs[event.key];if(dir){event.preventDefault();move(dir[0],dir[1]);}if(event.key==="r"||event.key==="R")reset();});
restart.addEventListener("click",reset);reset();
<\/script>
</body>
</html>`;
}

export const snakeGameHtml = sharedShell(
  "GPT 5.4 Snake",
  `
    <canvas id="board" width="480" height="480" aria-label="Snake game board"></canvas>
    <script>
      const canvas = document.getElementById("board");
      const ctx = canvas.getContext("2d");
      const tileSize = 24;
      const tiles = canvas.width / tileSize;
      const scoreEl = document.createElement("div");
      const hintEl = document.createElement("div");
      const frameEl = document.createElement("div");
      const overlayEl = document.createElement("div");

      document.body.style.display = "grid";
      document.body.style.placeItems = "center";

      frameEl.style.width = "100%";
      frameEl.style.height = "100%";
      frameEl.style.display = "grid";
      frameEl.style.placeItems = "center";
      frameEl.style.padding = "18px";
      frameEl.style.background = "radial-gradient(circle at top, rgba(48, 116, 84, 0.24), transparent 40%), linear-gradient(180deg, #111a15 0%, #0b110e 100%)";

      const panelEl = document.createElement("div");
      panelEl.style.width = "min(100%, 480px)";
      panelEl.style.aspectRatio = "1 / 1";
      panelEl.style.padding = "12px";
      panelEl.style.borderRadius = "28px";
      panelEl.style.background = "rgba(9, 14, 11, 0.88)";
      panelEl.style.border = "1px solid rgba(168, 213, 189, 0.16)";
      panelEl.style.boxShadow = "0 24px 60px rgba(0, 0, 0, 0.35)";
      panelEl.style.display = "grid";
      panelEl.style.gridTemplateRows = "auto 1fr auto";
      panelEl.style.gap = "10px";

      scoreEl.style.color = "#d4f5dd";
      scoreEl.style.fontSize = "13px";
      scoreEl.style.letterSpacing = "0.08em";
      scoreEl.style.textTransform = "uppercase";
      scoreEl.style.display = "flex";
      scoreEl.style.justifyContent = "space-between";

      hintEl.style.color = "rgba(212, 245, 221, 0.7)";
      hintEl.style.fontSize = "12px";
      hintEl.style.textAlign = "center";

      overlayEl.style.position = "absolute";
      overlayEl.style.inset = "0";
      overlayEl.style.display = "grid";
      overlayEl.style.placeItems = "center";
      overlayEl.style.color = "#f2fff4";
      overlayEl.style.fontSize = "14px";
      overlayEl.style.letterSpacing = "0.06em";
      overlayEl.style.textTransform = "uppercase";
      overlayEl.style.background = "linear-gradient(180deg, rgba(6, 10, 8, 0.06), rgba(6, 10, 8, 0.52))";
      overlayEl.style.pointerEvents = "none";
      overlayEl.textContent = "Click to focus, arrows to move";

      const boardWrap = document.createElement("div");
      boardWrap.style.position = "relative";
      boardWrap.style.borderRadius = "20px";
      boardWrap.style.overflow = "hidden";
      boardWrap.style.border = "1px solid rgba(212, 245, 221, 0.12)";

      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvas.style.background = "#0f1712";
      canvas.tabIndex = 0;

      boardWrap.append(canvas, overlayEl);
      panelEl.append(scoreEl, boardWrap, hintEl);
      frameEl.append(panelEl);
      document.body.append(frameEl);

      let direction = { x: 1, y: 0 };
      let queuedDirection = { x: 1, y: 0 };
      let snake = [
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 }
      ];
      let food = { x: 14, y: 10 };
      let score = 0;
      let speed = 120;
      let loop = null;

      const placeFood = () => {
        while (true) {
          const next = {
            x: Math.floor(Math.random() * tiles),
            y: Math.floor(Math.random() * tiles)
          };

          if (!snake.some((segment) => segment.x === next.x && segment.y === next.y)) {
            food = next;
            return;
          }
        }
      };

      const drawGrid = () => {
        ctx.strokeStyle = "rgba(223, 255, 231, 0.05)";
        ctx.lineWidth = 1;

        for (let index = 1; index < tiles; index += 1) {
          const position = index * tileSize + 0.5;
          ctx.beginPath();
          ctx.moveTo(position, 0);
          ctx.lineTo(position, canvas.height);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, position);
          ctx.lineTo(canvas.width, position);
          ctx.stroke();
        }
      };

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#0e1510";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid();

        snake.forEach((segment, index) => {
          const gradient = ctx.createLinearGradient(
            segment.x * tileSize,
            segment.y * tileSize,
            segment.x * tileSize + tileSize,
            segment.y * tileSize + tileSize
          );
          gradient.addColorStop(0, index === 0 ? "#9bf6b3" : "#4ecf74");
          gradient.addColorStop(1, index === 0 ? "#5bd37c" : "#2e9450");
          ctx.fillStyle = gradient;
          ctx.fillRect(segment.x * tileSize + 2, segment.y * tileSize + 2, tileSize - 4, tileSize - 4);
        });

        ctx.fillStyle = "#ffd37e";
        ctx.beginPath();
        ctx.arc(food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2, tileSize / 2.7, 0, Math.PI * 2);
        ctx.fill();

        scoreEl.innerHTML = "<span>GPT 5.4</span><span>Score " + score + "</span>";
        hintEl.textContent = "Wrap edges. Avoid yourself.";
      };

      const endGame = () => {
        clearInterval(loop);
        loop = null;
        overlayEl.textContent = "Game over. Press space to restart";
        overlayEl.style.opacity = "1";
      };

      const tick = () => {
        direction = queuedDirection;

        const head = {
          x: (snake[0].x + direction.x + tiles) % tiles,
          y: (snake[0].y + direction.y + tiles) % tiles
        };

        if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          endGame();
          draw();
          return;
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
          score += 1;
          speed = Math.max(70, speed - 4);
          placeFood();
          clearInterval(loop);
          loop = setInterval(tick, speed);
        } else {
          snake.pop();
        }

        draw();
      };

      const restart = () => {
        snake = [
          { x: 8, y: 10 },
          { x: 7, y: 10 },
          { x: 6, y: 10 }
        ];
        direction = { x: 1, y: 0 };
        queuedDirection = { x: 1, y: 0 };
        score = 0;
        speed = 120;
        overlayEl.style.opacity = "0";
        placeFood();
        clearInterval(loop);
        loop = setInterval(tick, speed);
        draw();
      };

      const setDirection = (x, y) => {
        if (direction.x === -x && direction.y === -y) {
          return;
        }
        queuedDirection = { x, y };
      };

      window.addEventListener("keydown", (event) => {
        const key = event.key;

        if (key === "ArrowUp") setDirection(0, -1);
        if (key === "ArrowDown") setDirection(0, 1);
        if (key === "ArrowLeft") setDirection(-1, 0);
        if (key === "ArrowRight") setDirection(1, 0);
        if (key === " " && !loop) restart();

        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)) {
          event.preventDefault();
          overlayEl.style.opacity = "0";
        }
      }, { passive: false });

      window.addEventListener("pointerdown", () => {
        canvas.focus();
        overlayEl.style.opacity = "0";
      });

      restart();
    <\/script>
  `
);
