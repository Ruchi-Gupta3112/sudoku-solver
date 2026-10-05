(() => {
"use strict";
const { emptyBoard, generatePuzzle, getConflicts, solve } = window.Sudoku;

const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#status");
const badgeElement = document.querySelector("#board-badge");
const difficultyElement = document.querySelector("#difficulty");
const cells = [];
const gridFragment = document.createDocumentFragment();
let puzzle = emptyBoard();
let board = emptyBoard();
let selected = null;
let mode = "custom";

for (let index = 0; index < 81; index++) {
  const cell = document.createElement("input");
  cell.className = "cell";
  cell.type = "text";
  cell.inputMode = "numeric";
  cell.autocomplete = "off";
  cell.maxLength = 1;
  cell.setAttribute("role", "gridcell");
  cell.setAttribute("aria-label", `Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}`);
  cell.dataset.index = index;
  if (index % 9 === 2 || index % 9 === 5) cell.classList.add("box-right");
  if (Math.floor(index / 9) === 2 || Math.floor(index / 9) === 5) cell.classList.add("box-bottom");
  cell.addEventListener("focus", () => { selected = index; render(); });
  cell.addEventListener("input", () => {
    const value = cell.value.match(/[1-9]/)?.[0] ?? "";
    setValue(index, value ? Number(value) : 0);
  });
  cell.addEventListener("keydown", (event) => {
    const movement = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (movement !== undefined) {
      event.preventDefault();
      const next = index + movement;
      if (next >= 0 && next < 81 && !(movement === -1 && index % 9 === 0) && !(movement === 1 && index % 9 === 8)) cells[next].focus();
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      setValue(index, 0);
    } else if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      setValue(index, Number(event.key));
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  });
  gridFragment.append(cell);
  cells.push(cell);
}

function announce(message, kind = "normal") {
  statusElement.textContent = message;
  statusElement.dataset.kind = kind;
}

function render() {
  const conflicts = getConflicts(board);
  const selectedValue = selected === null ? 0 : board[selected];
  for (let index = 0; index < 81; index++) {
    const cell = cells[index];
    const value = board[index];
    if (cell.value !== (value ? String(value) : "")) cell.value = value ? String(value) : "";
    cell.readOnly = Boolean(puzzle[index]);
    cell.classList.toggle("given", Boolean(puzzle[index]));
    cell.classList.toggle("conflict", conflicts.has(index));
    cell.classList.toggle("selected", selected === index);
    cell.classList.toggle("matching", Boolean(selectedValue && selectedValue === value && selected !== index));
    cell.setAttribute("aria-invalid", conflicts.has(index) ? "true" : "false");
    cell.setAttribute("aria-readonly", puzzle[index] ? "true" : "false");
  }
}

function setValue(index, value) {
  if (puzzle[index]) return;
  board[index] = value;
  render();
  const conflicts = getConflicts(board);
  if (conflicts.size) announce("That number conflicts with another square in its row, column, or box.", "error");
  else if (board.every(Boolean)) announce("Beautifully done — you solved it!", "success");
  else announce(value ? "Looking good. Keep going!" : "Square cleared.");
}

function startPuzzle() {
  const difficulty = difficultyElement.value;
  puzzle = generatePuzzle(difficulty);
  board = puzzle.slice();
  mode = difficulty;
  selected = null;
  badgeElement.textContent = difficulty[0].toUpperCase() + difficulty.slice(1);
  render();
  announce("Fresh puzzle ready. Select any empty square to begin.");
}

document.querySelector("#new-game").addEventListener("click", startPuzzle);
document.querySelector("#solve").addEventListener("click", () => {
  if (getConflicts(board).size) {
    announce("Fix the red conflicts before solving.", "error");
    return;
  }
  const solution = solve(board);
  if (!solution) {
    announce("This board has no solution. Check your entries and try again.", "error");
    return;
  }
  board = solution;
  render();
  announce("Solved! Start a new puzzle whenever you're ready.", "success");
});
document.querySelector("#reset").addEventListener("click", () => {
  board = puzzle.slice();
  render();
  announce(mode === "custom" ? "Blank board ready for your puzzle." : "Your entries have been reset.");
});
document.querySelector("#clear").addEventListener("click", () => {
  puzzle = emptyBoard();
  board = emptyBoard();
  mode = "custom";
  selected = null;
  badgeElement.textContent = "Custom";
  render();
  announce("Blank board ready. Enter your puzzle, then choose Solve puzzle.");
});
document.querySelectorAll("[data-number]").forEach((button) => {
  button.addEventListener("click", () => {
    if (selected === null) {
      announce("Select an empty square first.");
      return;
    }
    setValue(selected, Number(button.dataset.number));
    cells[selected].focus();
  });
});

startPuzzle();
boardElement.replaceChildren(gridFragment);
document.querySelector("#script-note").remove();
})();
