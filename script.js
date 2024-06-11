window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 1300;
  canvas.height = 720;
  let enemies = [];
  let score = 0;
  let gameOver = false;
  let alphabet;
  const fullScreenButton = document.getElementById('fullScreenButton');

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch(err => alert("something went wrong"));
    } else {
      document.exitFullscreen();
    }
  }

  fullScreenButton.addEventListener('click', toggleFullScreen);

  class InputHandler {
    constructor() {
      this.keys = [];
      window.addEventListener("keydown", (e) => {
        if (
          e.key === "ArrowDown" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          if (!this.keys.includes(e.key)) {
            this.keys.push(e.key);
          }
        } else if (gameOver === true && e.key === "Enter") {
          restartGame();
        }
      });
      window.addEventListener("keyup", (e) => {
        this.keys = this.keys.filter(key => key !== e.key);
      });
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 200;
      this.height = 200;
      this.x = 100;
      this.y = this.gameHeight - this.height;
      this.image = document.getElementById("playerImage");
      this.frameX = 3;
      this.frameY = 0;
      this.maxFrame = 8;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 0;
      this.vy = 0;
      this.weight = 1;
    }

    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    restart() {
      this.x = 100;
      this.y = this.gameHeight - this.height;
      this.maxFrame = 8;
      this.frameY = 0;
    }

    update(input, deltaTime, enemies) {
      enemies.forEach((enemy) => {
        const dx = (enemy.x + enemy.width / 2 - 20) - (this.x + this.width / 2);
        const dy = (enemy.y + enemy.height / 2) - (this.y + this.height / 2 + 20);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < enemy.width / 3 + this.width / 3) {
          gameOver = true;
        }
      });

      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }

      if (input.keys.indexOf("ArrowRight") > -1) {
        this.speed = 5;
      } else if (input.keys.indexOf("ArrowLeft") > -1) {
        this.speed = -5;
      } else {
        this.speed = 0;
      }

      this.x += this.speed;

      if (this.x < 0 || this.x > this.gameWidth - this.width) {
        gameOver = true;
      }

      if (input.keys.indexOf("ArrowUp") > -1 && this.onGround()) {
        this.vy = -32;
      }

      this.vy += this.weight;
      this.y += this.vy;
      if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
    }

    onGround() {
      return this.y >= this.gameHeight - this.height;
    }
  }

  class Background {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.image = document.getElementById("backgroundImage");
      this.x = 0;
      this.y = 0;
      this.width = 2400;
      this.height = 720;
      this.speed = 10;
    }

    draw(context) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
      context.drawImage(
        this.image,
        this.x + this.width - this.speed,
        this.y,
        this.width,
        this.height
      );
    }

    update() {
      this.x -= this.speed;
      if (this.x < 0 - this.width) this.x = 0;
    }

    restart() {
      this.x = 0;
    }
  }

  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 160;
      this.height = 119;
      this.image = document.getElementById("enemyImage");
      this.x = this.gameWidth;
      this.y = this.gameHeight - this.height;
      this.frameX = 0;
      this.maxFrame = 5;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 8;
      this.markedForDeletion = false;
    }

    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    update(deltaTime) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }
      this.x -= this.speed;
      if (this.x < 0 - this.width) {
        this.markedForDeletion = true;
      }
    }
  }

  class Alphabet {
    constructor(gameWidth, gameHeight, letter) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 50;
      this.height = 50;
      this.x = this.gameWidth;
      this.y = this.gameHeight / 2 - this.height; // Middle position
      this.letter = letter;
      this.img = new Image();
      this.img.src = `./images/${this.letter.toLowerCase()}.png`;
      this.img.onload = () => {
        this.loaded = true;
      };
      this.img.onerror = () => {
        console.error(`Failed to load image for letter: ${this.letter}`);
      };
      this.speed = 5;
      this.markedForDeletion = false;
      this.loaded = false;
    }

    draw(context) {
      if (this.loaded) {
        context.drawImage(this.img, this.x, this.y, this.width, this.height);
      }
    }

    update(deltaTime, player) {
      this.x -= this.speed;

      // Check for collision with player
      const dx = (this.x + this.width / 2) - (player.x + player.width / 2);
      const dy = (this.y + this.height / 2) - (player.y + player.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.width / 2 + player.width / 2) {
        this.markedForDeletion = true;
        score += 50; // Points for collecting letter
      }

      if (this.x < 0 - this.width) {
        this.markedForDeletion = true;
      }
    }
  }

  function handleEnemies(deltaTime) {
    if (enemyTimer > enemyInterval + randomEnemyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      randomEnemyInterval = Math.random() * 1000 + 500;
      enemyTimer = 0;
    } else {
      enemyTimer += deltaTime;
    }
    enemies.forEach((enemy) => {
      enemy.draw(ctx);
      enemy.update(deltaTime);
    });
    enemies = enemies.filter(enemy => !enemy.markedForDeletion);
  }

  function handleAlphabet(deltaTime, player) {
    if (!alphabet || alphabet.markedForDeletion) {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      alphabet = new Alphabet(canvas.width, canvas.height, randomLetter);
    }
    alphabet.draw(ctx);
    alphabet.update(deltaTime, player);
  }

  function displayStatusText(context) {
    context.fillStyle = 'black';
    context.textAlign = 'left';
    context.font = '40px Helvetica';
    context.fillText('Score: ' + score, 20, 30);
    if (gameOver) {
      context.textAlign = 'center';
      context.fillStyle = 'black';
      context.fillText('GAME OVER! Press Enter to Restart', canvas.width / 2, 200);
      context.fillStyle = 'white';
      context.fillText('GAME OVER! Press Enter to Restart', canvas.width / 2 + 2, 202);
    }
  }

  function restartGame() {
    player.restart();
    enemies = [];
    score = 0;
    gameOver = false;
    background.restart();
    animate(0);
  }

  const input = new InputHandler();
  const player = new Player(canvas.width, canvas.height);
  const background = new Background(canvas.width, canvas.height);

  let lastTime = 0;
  let enemyTimer = 0;
  let enemyInterval = 1000;
  let randomEnemyInterval = Math.random() * 1000 + 500;

  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.draw(ctx);
    background.update();
    player.draw(ctx);
    player.update(input, deltaTime, enemies);
    handleEnemies(deltaTime);
    handleAlphabet(deltaTime, player);
    displayStatusText(ctx);
    if (!gameOver) requestAnimationFrame(animate);
  }
  animate(0);
});
