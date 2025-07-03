const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bgCanvas = document.getElementById('backgroundGridCanvas');
const bgCtx = bgCanvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');
const playAgainButton = document.getElementById('playAgainButton');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const finalScoreDisplay = document.getElementById('finalScore');
const finalHighScoreDisplay = document.getElementById('finalHighScore');
const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

let gridSize = 20;
let tileSize;
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15, type: 'normal' };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let gameLoop;
let isPaused = false;
let lastTime = 0;
let baseSpeed = 100; // base speed in ms
let speed = baseSpeed;
let goldenFoodTimer = 0;
const GOLDEN_FOOD_INTERVAL = 10000;
let speedBoostActive = false;
let speedBoostTimer = 0;
const SPEED_BOOST_DURATION = 5000; // 5 seconds speed boost

// Background grid variables
let bgWidth, bgHeight;
let gridSpacing = 50;
let gridOffsetX = 0;
let gridOffsetY = 0;
const gridSpeedX = 0.3;
const gridSpeedY = 0.2;

function resizeCanvas() {
  const containerWidth = document.getElementById('gameContainer').offsetWidth;
  canvas.width = Math.min(containerWidth, 400);
  canvas.height = canvas.width;
  tileSize = canvas.width / gridSize;

  bgWidth = window.innerWidth;
  bgHeight = window.innerHeight;
  bgCanvas.width = bgWidth;
  bgCanvas.height = bgHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Start game setup
function startGame() {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  gameOverScreen.classList.add('hidden');
  snake = [{ x: 10, y: 10 }];
  dx = 0;
  dy = 0;
  score = 0;
  speed = baseSpeed;
  speedBoostActive = false;
  speedBoostTimer = 0;
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
  placeFood();
  isPaused = false;
  pauseButton.textContent = 'Pause';
  lastTime = performance.now();
  gameLoop = requestAnimationFrame(gameUpdate);
}

// Game update loop
function gameUpdate(timestamp) {
  if (isPaused) {
    gameLoop = requestAnimationFrame(gameUpdate);
    drawBackgroundGrid();
    return;
  }

  if (timestamp - lastTime >= speed) {
    updateSnake();
    checkCollision();
    drawGame();
    lastTime = timestamp;
    goldenFoodTimer += speed;

    if (speedBoostActive) {
      speedBoostTimer += speed;
      if (speedBoostTimer >= SPEED_BOOST_DURATION) {
        speedBoostActive = false;
        speed = baseSpeed;
      }
    }

    if (goldenFoodTimer >= GOLDEN_FOOD_INTERVAL && food.type === 'normal') {
      placeGoldenFood();
    }
  }
  drawBackgroundGrid();
  gameLoop = requestAnimationFrame(gameUpdate);
}

// Create particle effect on eating food
function createParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.width = particle.style.height = `${Math.random() * 6 + 4}px`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 30 + 10;
    particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
    document.body.appendChild(particle);
    particle.style.opacity = 1;
    setTimeout(() => {
      particle.remove();
    }, 500);
  }
}

function updateSnake() {
  if (dx === 0 && dy === 0) return;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    if (food.type === 'golden') {
      score += 5;
      speed = Math.max(50, speed - 10);
    } else if (food.type === 'speedBoost') {
      score += 3;
      speedBoostActive = true;
      speedBoostTimer = 0;
      speed = 50; // faster speed during boost
    } else {
      score += 1;
    }

    scoreDisplay.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreDisplay.textContent = highScore;
      localStorage.setItem('highScore', highScore);
    }

    goldenFoodTimer = 0;
    createParticles(head.x * tileSize + tileSize / 2, head.y * tileSize + tileSize / 2);
    placeFood();
  } else {
    snake.pop();
  }
}

function placeFood() {
  let validPosition = false;
  while (!validPosition) {
    food.x = Math.floor(Math.random() * gridSize);
    food.y = Math.floor(Math.random() * gridSize);
    validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }

  // Randomly decide if speedBoost food should appear (10% chance), else normal food
  const rand = Math.random();
  if (rand < 0.1) {
    food.type = 'speedBoost';
  } else {
    food.type = 'normal';
  }
}

function placeGoldenFood() {
  let validPosition = false;
  while (!validPosition) {
    food.x = Math.floor(Math.random() * gridSize);
    food.y = Math.floor(Math.random() * gridSize);
    validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
  food.type = 'golden';

  setTimeout(() => {
    if (food.type === 'golden') {
      placeFood();
    }
  }, 5000);
}

function checkCollision() {
  const head = snake[0];

  // Wall collision
  if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
    gameOver();
  }

  // Self collision
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver();
    }
  }
}

function gameOver() {
  isPaused = true;
  cancelAnimationFrame(gameLoop);
  finalScoreDisplay.textContent = score;
  finalHighScoreDisplay.textContent = highScore;
  gameScreen.classList.add('hidden');
  gameOverScreen.classList.remove('hidden');
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw snake
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? '#9F7AEA' : '#6B46C1';
    ctx.shadowColor = 'rgba(159, 122, 234, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillRect(snake[i].x * tileSize, snake[i].y * tileSize, tileSize, tileSize);
    ctx.shadowBlur = 0;
  }

  // Draw food
  if (food.type === 'normal') {
    ctx.fillStyle = '#D6BCFA';
    ctx.shadowColor = 'rgba(214, 188, 250, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
  } else if (food.type === 'golden') {
    const gradient = ctx.createRadialGradient(
      food.x * tileSize + tileSize / 2,
      food.y * tileSize + tileSize / 2,
      tileSize / 4,
      food.x * tileSize + tileSize / 2,
      food.y * tileSize + tileSize / 2,
      tileSize / 2
    );
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
    ctx.shadowBlur = 12;
    ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
  } else if (food.type === 'speedBoost') {
    ctx.fillStyle = '#00FFAA';
    ctx.shadowColor = 'rgba(0, 255, 170, 0.9)';
    ctx.shadowBlur = 12;
    // Draw a circle for speed boost
    ctx.beginPath();
    ctx.arc(food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2, tileSize / 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Background grid drawing with animation
function drawBackgroundGrid() {
  bgCtx.clearRect(0, 0, bgWidth, bgHeight);

  gridOffsetX += gridSpeedX;
  gridOffsetY += gridSpeedY;

  if (gridOffsetX > gridSpacing) gridOffsetX -= gridSpacing;
  if (gridOffsetY > gridSpacing) gridOffsetY -= gridSpacing;

  bgCtx.strokeStyle = 'rgba(138, 43, 226, 0.15)';
  bgCtx.lineWidth = 1;

  for (let x = -gridSpacing; x < bgWidth; x += gridSpacing) {
    for (let y = -gridSpacing; y < bgHeight; y += gridSpacing) {
      bgCtx.beginPath();
      bgCtx.moveTo(x + gridOffsetX, y);
      bgCtx.lineTo(x + gridOffsetX, y + gridSpacing);
      bgCtx.stroke();

      bgCtx.beginPath();
      bgCtx.moveTo(x, y + gridOffsetY);
      bgCtx.lineTo(x + gridSpacing, y + gridOffsetY);
      bgCtx.stroke();
    }
  }
}

// Event Listeners
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', () => {
  if (!isPaused) {
    isPaused = true;
    pauseButton.textContent = 'Resume';
  } else {
    isPaused = false;
    pauseButton.textContent = 'Pause';
    lastTime = performance.now();
    gameLoop = requestAnimationFrame(gameUpdate);
  }
});
restartButton.addEventListener('click', startGame);
playAgainButton.addEventListener('click', startGame);

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && dy !== 1) {
    dx = 0;
    dy = -1;
  } else if (e.key === 'ArrowDown' && dy !== -1) {
    dx = 0;
    dy = 1;
  } else if (e.key === 'ArrowLeft' && dx !== 1) {
    dx = -1;
    dy = 0;
  } else if (e.key === 'ArrowRight' && dx !== -1) {
    dx = 1;
    dy = 0;
  }
});

// Mobile control buttons
upButton.addEventListener('click', () => {
  if (dy !== 1) { dx = 0; dy = -1; }
});
downButton.addEventListener('click', () => {
  if (dy !== -1) { dx = 0; dy = 1; }
});
leftButton.addEventListener('click', () => {
  if (dx !== 1) { dx = -1; dy = 0; }
});
rightButton.addEventListener('click', () => {
  if (dx !== -1) { dx = 1; dy = 0; }
});
