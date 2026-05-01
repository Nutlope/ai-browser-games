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

export const flappyGameHtml = sharedShell(
  "GPT 5.4 Flappy",
  `
    <canvas id="board" width="480" height="480" aria-label="Flappy game board"></canvas>
    <script>
      const canvas = document.getElementById("board");
      const ctx = canvas.getContext("2d");
      const frameEl = document.createElement("div");
      const panelEl = document.createElement("div");
      const scoreEl = document.createElement("div");
      const hintEl = document.createElement("div");
      const overlayEl = document.createElement("div");
      const boardWrap = document.createElement("div");

      document.body.style.display = "grid";
      document.body.style.placeItems = "center";

      frameEl.style.width = "100%";
      frameEl.style.height = "100%";
      frameEl.style.display = "grid";
      frameEl.style.placeItems = "center";
      frameEl.style.padding = "18px";
      frameEl.style.background = "radial-gradient(circle at top, rgba(158, 214, 255, 0.25), transparent 42%), linear-gradient(180deg, #132033 0%, #0d1424 100%)";

      panelEl.style.width = "min(100%, 480px)";
      panelEl.style.aspectRatio = "1 / 1";
      panelEl.style.padding = "12px";
      panelEl.style.borderRadius = "28px";
      panelEl.style.background = "rgba(10, 16, 28, 0.88)";
      panelEl.style.border = "1px solid rgba(181, 220, 255, 0.18)";
      panelEl.style.boxShadow = "0 24px 60px rgba(0, 0, 0, 0.34)";
      panelEl.style.display = "grid";
      panelEl.style.gridTemplateRows = "auto 1fr auto";
      panelEl.style.gap = "10px";

      scoreEl.style.color = "#d8efff";
      scoreEl.style.fontSize = "13px";
      scoreEl.style.letterSpacing = "0.08em";
      scoreEl.style.textTransform = "uppercase";
      scoreEl.style.display = "flex";
      scoreEl.style.justifyContent = "space-between";

      hintEl.style.color = "rgba(216, 239, 255, 0.72)";
      hintEl.style.fontSize = "12px";
      hintEl.style.textAlign = "center";

      boardWrap.style.position = "relative";
      boardWrap.style.borderRadius = "20px";
      boardWrap.style.overflow = "hidden";
      boardWrap.style.border = "1px solid rgba(216, 239, 255, 0.16)";

      overlayEl.style.position = "absolute";
      overlayEl.style.inset = "0";
      overlayEl.style.display = "grid";
      overlayEl.style.placeItems = "center";
      overlayEl.style.background = "linear-gradient(180deg, rgba(8, 11, 20, 0.04), rgba(8, 11, 20, 0.48))";
      overlayEl.style.color = "#f2f8ff";
      overlayEl.style.fontSize = "14px";
      overlayEl.style.letterSpacing = "0.06em";
      overlayEl.style.textTransform = "uppercase";
      overlayEl.style.pointerEvents = "none";
      overlayEl.textContent = "Click to focus, space to flap";

      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvas.tabIndex = 0;

      boardWrap.append(canvas, overlayEl);
      panelEl.append(scoreEl, boardWrap, hintEl);
      frameEl.append(panelEl);
      document.body.append(frameEl);

      const gravity = 0.42;
      const flap = -6.9;
      const pipeWidth = 58;
      const gap = 120;
      const pipeSpacing = 190;
      let bird;
      let pipes;
      let score;
      let running;
      let animationId;
      let lastSpawnX;

      const reset = () => {
        bird = { x: 120, y: 210, velocity: 0, radius: 15 };
        pipes = [];
        score = 0;
        running = true;
        lastSpawnX = canvas.width + 120;
        overlayEl.style.opacity = "0";

        for (let index = 0; index < 4; index += 1) {
          spawnPipe(lastSpawnX + index * pipeSpacing);
        }
      };

      const spawnPipe = (x) => {
        const minTop = 64;
        const maxTop = canvas.height - gap - 64;
        const topHeight = minTop + Math.random() * (maxTop - minTop);
        pipes.push({ x, topHeight, passed: false });
      };

      const drawBackground = () => {
        const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, "#8fd0ff");
        sky.addColorStop(1, "#e7f5ff");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.beginPath();
        ctx.arc(90, 90, 28, 0, Math.PI * 2);
        ctx.arc(118, 92, 22, 0, Math.PI * 2);
        ctx.arc(144, 90, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(300, 130, 22, 0, Math.PI * 2);
        ctx.arc(322, 132, 18, 0, Math.PI * 2);
        ctx.arc(342, 130, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#d8c88f";
        ctx.fillRect(0, canvas.height - 34, canvas.width, 34);
        ctx.fillStyle = "#6faa57";
        ctx.fillRect(0, canvas.height - 42, canvas.width, 12);
      };

      const drawBird = () => {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(Math.max(-0.4, Math.min(0.8, bird.velocity * 0.06)));
        ctx.fillStyle = "#ffd34d";
        ctx.beginPath();
        ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f28f16";
        ctx.beginPath();
        ctx.moveTo(11, 1);
        ctx.lineTo(26, 6);
        ctx.lineTo(11, 11);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(4, -5, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1f2430";
        ctx.beginPath();
        ctx.arc(6, -5, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffb938";
        ctx.beginPath();
        ctx.ellipse(-4, 8, 9, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const drawPipes = () => {
        pipes.forEach((pipe) => {
          ctx.fillStyle = "#57af5d";
          ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
          ctx.fillRect(pipe.x, pipe.topHeight + gap, pipeWidth, canvas.height - pipe.topHeight - gap);
          ctx.fillStyle = "#438949";
          ctx.fillRect(pipe.x - 4, pipe.topHeight - 16, pipeWidth + 8, 16);
          ctx.fillRect(pipe.x - 4, pipe.topHeight + gap, pipeWidth + 8, 16);
        });
      };

      const collide = (pipe) => {
        const inPipeX = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeWidth;
        const hitsTop = bird.y - bird.radius < pipe.topHeight;
        const hitsBottom = bird.y + bird.radius > pipe.topHeight + gap;
        return inPipeX && (hitsTop || hitsBottom);
      };

      const end = () => {
        running = false;
        overlayEl.textContent = "Crashed. Press space to restart";
        overlayEl.style.opacity = "1";
      };

      const draw = () => {
        drawBackground();
        drawPipes();
        drawBird();
        scoreEl.innerHTML = "<span>GPT 5.4</span><span>Score " + score + "</span>";
        hintEl.textContent = "Tap or press space to keep flying.";
      };

      const step = () => {
        if (!running) {
          draw();
          animationId = requestAnimationFrame(step);
          return;
        }

        bird.velocity += gravity;
        bird.y += bird.velocity;

        pipes.forEach((pipe) => {
          pipe.x -= 2.2;

          if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
            pipe.passed = true;
            score += 1;
          }
        });

        pipes = pipes.filter((pipe) => pipe.x + pipeWidth > -10);

        const furthestPipe = pipes[pipes.length - 1];
        if (!furthestPipe || furthestPipe.x < canvas.width - pipeSpacing) {
          spawnPipe((furthestPipe ? furthestPipe.x : canvas.width) + pipeSpacing);
        }

        if (bird.y + bird.radius > canvas.height - 42 || bird.y - bird.radius < 0) {
          end();
        }

        if (pipes.some(collide)) {
          end();
        }

        draw();
        animationId = requestAnimationFrame(step);
      };

      const jump = () => {
        if (!running) {
          reset();
        }
        bird.velocity = flap;
        overlayEl.style.opacity = "0";
      };

      window.addEventListener("keydown", (event) => {
        if (event.key === " ") {
          event.preventDefault();
          jump();
        }
      }, { passive: false });

      window.addEventListener("pointerdown", () => {
        canvas.focus();
        jump();
      });

      reset();
      draw();
      animationId = requestAnimationFrame(step);
    <\/script>
  `
);
