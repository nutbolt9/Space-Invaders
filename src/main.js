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
        if (this.x > 0) {
          this.x -= this.speed;
        }
      }

      moveRight() {
        if (this.x < canvas.width - this.width) {
          this.x += this.speed;
        }
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
        this.speed = 1;
        this.movingRight = true;
      }

      draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }

      update() {
        if (this.movingRight) {
          this.x += this.speed;
        } else {
          this.x -= this.speed;
        }
      }

      changeDirection() {
        this.movingRight = !this.movingRight;
        this.y += 20;
      }
    }

    const player = new Player(canvas.width / 2 - 25, canvas.height - 30);
    let bullets = [];
    let invaders = [];

    function createInvaders() {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 10; col++) {
          const x = col * 50 + 30;
          const y = row * 30 + 30;
          invaders.push(new Invader(x, y));
        }
      }
    }

    createInvaders();

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      player.draw();
      bullets.forEach(bullet => bullet.draw());
      invaders.forEach(invader => invader.draw());
    }

    function update() {
      bullets = bullets.filter(bullet => bullet.y > 0);
      bullets.forEach(bullet => bullet.update());

      invaders.forEach((invader, index) => {
        if (invader.x + invader.width >= canvas.width || invader.x <= 0) {
          invaders[index].changeDirection();
        }
        invaders[index].update();
      });
    }

    function gameLoop() {
      draw();
      update();
      requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        player.moveLeft();
      } else if (e.key === 'ArrowRight') {
        player.moveRight();
      } else if (e.key === 'Space') {
        bullets.push(new Bullet(player.x + player.width / 2 - 1.5, player.y));
      }
    });

    gameLoop();
