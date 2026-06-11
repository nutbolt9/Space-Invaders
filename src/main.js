const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

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
  invaders = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      invaders.push(new Invader(col * 50 + 30, row * 30 + 30));
    }
  }
}

function resetGame() {
  bullets = [];
  invaderDirection = 1;
  invaderSpeed = 1;
  score = 0;
  wave = 1;
  gameOver = false;
  player.x = canvas.width / 2 - 25;
  createInvaders();
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
  // The whole formation marches together and drops when any invader
  // touches an edge - flipping invaders individually smears the grid apart.
  const hitEdge = invaders.some(
    (inv) =>
      (invaderDirection > 0 && inv.x + inv.width >= canvas.width) ||
      (invaderDirection < 0 && inv.x <= 0)
  );
  if (hitEdge) {
    invaderDirection *= -1;
    invaders.forEach((inv) => (inv.y += 20));
  }
  invaders.forEach((inv) => (inv.x += invaderSpeed * invaderDirection));

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
    bullets = [];
    createInvaders();
  }
}

function update() {
  if (gameOver) return;

  if (keysDown.has('ArrowLeft')) player.moveLeft();
  if (keysDown.has('ArrowRight')) player.moveRight();

  bullets = bullets.filter((bullet) => bullet.y + bullet.height > 0);
  bullets.forEach((bullet) => bullet.update());

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

function gameLoop() {
  update();
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

createInvaders();
gameLoop();
