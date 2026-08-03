const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const INVADER_ROWS = 4;
const INVADER_COLS = 10;
const INVADER_SPACING_X = 50;
const INVADER_SPACING_Y = 30;
const INVADER_DROP = 20;

// The simulation always advances in 1/60s steps so the game plays the same
// on a 60Hz laptop and a 144Hz monitor.
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 10;
    this.speed = 5;
  }

  draw() {
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  moveLeft() {
    this.x = Math.max(0, this.x - this.speed);
  }

  moveRight() {
    this.x = Math.min(canvas.width - this.width, this.x + this.speed);
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 3;
    this.height = 10;
    this.speed = 8;
  }

  draw() {
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.y -= this.speed;
  }
}

class Invader {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 20;
  }

  draw() {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

const player = new Player(canvas.width / 2 - 25, canvas.height - 30);
let bullets = [];
let invaders = [];
let invaderDirection = 1;
let invaderSpeed = 1;
let score = 0;
let wave = 1;
let gameOver = false;

function createInvaders() {
  // Centre the block instead of hanging it off the left edge.
  const formationWidth = (INVADER_COLS - 1) * INVADER_SPACING_X + 30;
  const originX = (canvas.width - formationWidth) / 2;

  invaders = [];
  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push(
        new Invader(originX + col * INVADER_SPACING_X, row * INVADER_SPACING_Y + 30)
      );
    }
  }
}

function startWave() {
  // Direction has to be reset with the formation, otherwise a wave cleared
  // while marching left respawns heading left and drops a row immediately.
  invaderDirection = 1;
  bullets = [];
  createInvaders();
}

function resetGame() {
  invaderSpeed = 1;
  score = 0;
  wave = 1;
  gameOver = false;
  keysDown.clear();
  player.x = canvas.width / 2 - 25;
  startWave();
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updateInvaders() {
  if (invaders.length === 0) return;

  // The whole formation marches together and drops when any invader
  // touches an edge - flipping invaders individually smears the grid apart.
  invaders.forEach((inv) => (inv.x += invaderSpeed * invaderDirection));

  // Test after moving and push the overshoot back, so a fast wave can't
  // bury its edge column outside the canvas before the flip lands.
  let overshoot = 0;
  if (invaderDirection > 0) {
    const right = Math.max(...invaders.map((inv) => inv.x + inv.width));
    if (right > canvas.width) overshoot = canvas.width - right;
  } else {
    const left = Math.min(...invaders.map((inv) => inv.x));
    if (left < 0) overshoot = -left;
  }

  if (overshoot !== 0) {
    invaderDirection *= -1;
    invaders.forEach((inv) => {
      inv.x += overshoot;
      inv.y += INVADER_DROP;
    });
  }

  if (invaders.some((inv) => inv.y + inv.height >= player.y)) {
    gameOver = true;
  }
}

function handleCollisions() {
  bullets = bullets.filter((bullet) => {
    const hitIndex = invaders.findIndex((inv) => intersects(bullet, inv));
    if (hitIndex !== -1) {
      invaders.splice(hitIndex, 1);
      score += 10;
      return false;
    }
    return true;
  });

  if (invaders.length === 0) {
    wave += 1;
    invaderSpeed += 0.5;
    startWave();
  }
}

function update() {
  if (gameOver) return;

  if (keysDown.has('ArrowLeft')) player.moveLeft();
  if (keysDown.has('ArrowRight')) player.moveRight();

  bullets.forEach((bullet) => bullet.update());
  bullets = bullets.filter((bullet) => bullet.y + bullet.height > 0);

  updateInvaders();
  handleCollisions();
}

function drawHud() {
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 22);
  ctx.textAlign = 'right';
  ctx.fillText(`Wave: ${wave}`, canvas.width - 10, 22);

  if (gameOver) {
    ctx.textAlign = 'center';
    ctx.font = '40px monospace';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '18px monospace';
    ctx.fillText(`Final score: ${score}`, canvas.width / 2, canvas.height / 2 + 24);
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.draw();
  bullets.forEach((bullet) => bullet.draw());
  invaders.forEach((invader) => invader.draw());
  drawHud();
}

let lastTime = performance.now();
let accumulator = 0;

function gameLoop(now) {
  // Cap the delta so returning to a background tab doesn't fast-forward the
  // game through every missed step at once; the floor keeps a non-monotonic
  // clock from stalling the simulation instead.
  const delta = Math.min(Math.max(now - lastTime, 0), STEP_MS * MAX_STEPS_PER_FRAME);
  lastTime = now;
  accumulator += delta;

  while (accumulator >= STEP_MS) {
    update();
    accumulator -= STEP_MS;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

const keysDown = new Set();

document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    keysDown.add(e.code);
  } else if (e.code === 'Space') {
    e.preventDefault(); // keep the page from scrolling
    if (!e.repeat && !gameOver) {
      bullets.push(new Bullet(player.x + player.width / 2 - 1.5, player.y));
    }
  } else if (e.code === 'KeyR' && gameOver) {
    resetGame();
  }
});

document.addEventListener('keyup', (e) => {
  keysDown.delete(e.code);
});

// Losing focus mid-hold means the matching keyup never arrives and the ship
// slides into the wall on its own.
window.addEventListener('blur', () => keysDown.clear());

createInvaders();
requestAnimationFrame(gameLoop);
