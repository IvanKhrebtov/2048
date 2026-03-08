const size = 4;
let board = [];
let score = 0;
let bestScore = Number(localStorage.getItem("best-score-2048") || 0);
let hasWon = false;

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const newGameBtn = document.getElementById("new-game-btn");
const overlayEl = document.getElementById("overlay");
const overlayTextEl = document.getElementById("overlay-text");
const overlayBtn = document.getElementById("overlay-btn");

function createEmptyBoard() {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function getEmptyCells() {
  const cells = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (board[row][col] === 0) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

function addRandomTile() {
  const emptyCells = getEmptyCells();
  if (emptyCells.length === 0) {
    return;
  }
  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[row][col] = Math.random() < 0.9 ? 2 : 4;
}

function updateScores() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
}

function renderBoard() {
  boardEl.innerHTML = "";
  board.forEach((row) => {
    row.forEach((value) => {
      const tile = document.createElement("div");
      tile.className = `tile ${value ? `v${value}` : "empty"}`;
      tile.textContent = value || "";
      boardEl.appendChild(tile);
    });
  });
  updateScores();
}

function resetGame() {
  board = createEmptyBoard();
  score = 0;
  hasWon = false;
  hideOverlay();
  addRandomTile();
  addRandomTile();
  renderBoard();
}

function slideAndMerge(line) {
  const compact = line.filter((value) => value !== 0);
  const merged = [];

  for (let i = 0; i < compact.length; i += 1) {
    if (compact[i] === compact[i + 1]) {
      const newValue = compact[i] * 2;
      merged.push(newValue);
      score += newValue;
      if (newValue === 2048) {
        hasWon = true;
      }
      i += 1;
    } else {
      merged.push(compact[i]);
    }
  }

  while (merged.length < size) {
    merged.push(0);
  }

  return merged;
}

function moveLeft() {
  let changed = false;
  for (let row = 0; row < size; row += 1) {
    const original = [...board[row]];
    const moved = slideAndMerge(original);
    board[row] = moved;
    if (!changed && original.some((value, idx) => value !== moved[idx])) {
      changed = true;
    }
  }
  return changed;
}

function rotateClockwise(matrix) {
  return matrix[0].map((_, col) => matrix.map((row) => row[col]).reverse());
}

function rotateTimes(times) {
  const steps = ((times % 4) + 4) % 4;
  for (let i = 0; i < steps; i += 1) {
    board = rotateClockwise(board);
  }
}

function hasMovesLeft() {
  if (getEmptyCells().length > 0) {
    return true;
  }

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const value = board[row][col];
      if (board[row + 1]?.[col] === value || board[row][col + 1] === value) {
        return true;
      }
    }
  }
  return false;
}

function showOverlay(text) {
  overlayTextEl.textContent = text;
  overlayEl.classList.remove("hidden");
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
}

function handleMove(direction) {
  const rotations = {
    left: 0,
    up: 3,
    right: 2,
    down: 1,
  };

  if (!(direction in rotations)) {
    return;
  }

  rotateTimes(rotations[direction]);
  const changed = moveLeft();
  rotateTimes(4 - rotations[direction]);

  if (!changed) {
    return;
  }

  addRandomTile();

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("best-score-2048", String(bestScore));
  }

  renderBoard();

  if (hasWon) {
    hasWon = false;
    showOverlay("Ты собрал 2048! Продолжай или начни заново.");
  } else if (!hasMovesLeft()) {
    showOverlay("Ходов не осталось. Попробуй ещё раз!");
  }
}

function onKeyDown(event) {
  const map = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    a: "left",
    d: "right",
    w: "up",
    s: "down",
  };

  const direction = map[event.key];
  if (!direction) {
    return;
  }

  event.preventDefault();
  hideOverlay();
  handleMove(direction);
}

let touchStartX = 0;
let touchStartY = 0;

boardEl.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

boardEl.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) {
    return;
  }

  hideOverlay();
  if (Math.abs(dx) > Math.abs(dy)) {
    handleMove(dx > 0 ? "right" : "left");
  } else {
    handleMove(dy > 0 ? "down" : "up");
  }
});

newGameBtn.addEventListener("click", resetGame);
overlayBtn.addEventListener("click", resetGame);
document.addEventListener("keydown", onKeyDown);

bestScoreEl.textContent = bestScore;
resetGame();
