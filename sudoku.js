const SIZE = 9;
const CELL_COUNT = 81;
const ALL = 0x3fe;

function emptyBoard() {
  return Array(CELL_COUNT).fill(0);
}

function getConflicts(board) {
  const conflicts = new Set();
  const groups = [];
  for (let i = 0; i < SIZE; i++) {
    groups.push(Array.from({ length: SIZE }, (_, j) => i * SIZE + j));
    groups.push(Array.from({ length: SIZE }, (_, j) => j * SIZE + i));
    groups.push(Array.from({ length: SIZE }, (_, j) =>
      (Math.floor(i / 3) * 3 + Math.floor(j / 3)) * SIZE + (i % 3) * 3 + (j % 3)
    ));
  }
  for (const group of groups) {
    const seen = new Map();
    for (const index of group) {
      const value = board[index];
      if (!value) continue;
      if (seen.has(value)) {
        conflicts.add(index);
        conflicts.add(seen.get(value));
      } else seen.set(value, index);
    }
  }
  return conflicts;
}

function makeMasks(board) {
  const rows = Array(SIZE).fill(0);
  const cols = Array(SIZE).fill(0);
  const boxes = Array(SIZE).fill(0);
  for (let index = 0; index < CELL_COUNT; index++) {
    const value = board[index];
    if (!Number.isInteger(value) || value < 0 || value > 9) return null;
    if (!value) continue;
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    const bit = 1 << value;
    if ((rows[row] | cols[col] | boxes[box]) & bit) return null;
    rows[row] |= bit;
    cols[col] |= bit;
    boxes[box] |= bit;
  }
  return { rows, cols, boxes };
}

function countSolutions(board, limit = 2) {
  if (!Array.isArray(board) || board.length !== CELL_COUNT) return { count: 0, solution: null };
  const masks = makeMasks(board);
  if (!masks) return { count: 0, solution: null };
  const current = board.slice();
  let count = 0;
  let solution = null;

  function search() {
    if (count >= limit) return;
    let chosen = -1;
    let chosenBits = 0;
    let fewest = 10;
    for (let index = 0; index < CELL_COUNT; index++) {
      if (current[index]) continue;
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const bits = ALL & ~(masks.rows[row] | masks.cols[col] | masks.boxes[box]);
      let options = 0;
      for (let n = 1; n <= 9; n++) if (bits & (1 << n)) options++;
      if (options === 0) return;
      if (options < fewest) {
        chosen = index;
        chosenBits = bits;
        fewest = options;
        if (options === 1) break;
      }
    }
    if (chosen === -1) {
      count++;
      if (!solution) solution = current.slice();
      return;
    }
    const row = Math.floor(chosen / SIZE);
    const col = chosen % SIZE;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    for (let n = 1; n <= 9; n++) {
      const bit = 1 << n;
      if (!(chosenBits & bit)) continue;
      current[chosen] = n;
      masks.rows[row] |= bit;
      masks.cols[col] |= bit;
      masks.boxes[box] |= bit;
      search();
      current[chosen] = 0;
      masks.rows[row] ^= bit;
      masks.cols[col] ^= bit;
      masks.boxes[box] ^= bit;
      if (count >= limit) return;
    }
  }

  search();
  return { count, solution };
}

function solve(board) {
  return countSolutions(board, 1).solution;
}

function shuffle(values, random) {
  const result = values.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffledAxis(random) {
  return shuffle([0, 1, 2], random).flatMap((band) =>
    shuffle([0, 1, 2], random).map((inside) => band * 3 + inside)
  );
}

function generatePuzzle(difficulty = "medium", random = Math.random) {
  const clues = { easy: 40, medium: 32, hard: 26 }[difficulty] ?? 32;
  const rows = shuffledAxis(random);
  const cols = shuffledAxis(random);
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
  const completed = Array.from({ length: CELL_COUNT }, (_, index) => {
    const row = rows[Math.floor(index / SIZE)];
    const col = cols[index % SIZE];
    return digits[(row * 3 + Math.floor(row / 3) + col) % SIZE];
  });
  const puzzle = completed.slice();
  for (const index of shuffle(Array.from({ length: CELL_COUNT }, (_, i) => i), random)) {
    if (puzzle.filter(Boolean).length <= clues) break;
    const saved = puzzle[index];
    puzzle[index] = 0;
    if (countSolutions(puzzle, 2).count !== 1) puzzle[index] = saved;
  }
  return puzzle;
}

window.Sudoku = { emptyBoard, getConflicts, countSolutions, solve, generatePuzzle };
