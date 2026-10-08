// Code Lab puzzles: a tiny grid-robot language. Pure functions so they can
// be unit tested and reused by the UI for step-by-step animation.

export type Dir = 0 | 1 | 2 | 3; // 0 = up, 1 = right, 2 = down, 3 = left
export type Cmd = "F" | "L" | "R";

export interface Step {
  cmd: Cmd;
  times: number; // 1-5 (loop count)
}

export interface Puzzle {
  id: string;
  /** Rows of: '.' floor, '#' wall, 'S' start, 'G' goal, 'c' coin. */
  grid: string[];
  startDir: Dir;
  maxSteps: number;
}

export const PUZZLES: Puzzle[] = [
  { id: "p1", grid: ["S...G"], startDir: 1, maxSteps: 4 },
  { id: "p2", grid: ["S..#", "##.#", "##.G"], startDir: 1, maxSteps: 6 },
  { id: "p3", grid: ["S....G"], startDir: 1, maxSteps: 1 },
  { id: "p4", grid: ["S.c.", "###.", "G.c."], startDir: 1, maxSteps: 5 },
  { id: "p5", grid: ["S.#....", ".##.##.", "....#c.", "##.##.#", "G.....#"], startDir: 2, maxSteps: 16 },
  { id: "p6", grid: ["S...c", "####.", "c...c", ".####", "c...G"], startDir: 1, maxSteps: 9 },
  { id: "p7", grid: ["S..#G", "##.#.", "##c#.", "##.#.", "##.c."], startDir: 1, maxSteps: 7 },
  { id: "p8", grid: ["S.....c", "######.", "G.c...."], startDir: 1, maxSteps: 7 },
];

export interface Frame {
  x: number;
  y: number;
  dir: Dir;
  coins: string[]; // collected coin keys "x,y"
}

export interface RunResult {
  frames: Frame[];
  outcome: "win" | "crash" | "missed_coins" | "not_reached" | "too_long";
  message: string;
}

export function parsePuzzle(p: Puzzle) {
  let start = { x: 0, y: 0 };
  let goal = { x: 0, y: 0 };
  const coins: string[] = [];
  p.grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === "S") start = { x, y };
      if (ch === "G") goal = { x, y };
      if (ch === "c") coins.push(`${x},${y}`);
    }),
  );
  return { start, goal, coins, width: p.grid[0].length, height: p.grid.length };
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export function runProgram(p: Puzzle, program: Step[]): RunResult {
  const { start, goal, coins } = parsePuzzle(p);
  if (program.length > p.maxSteps) {
    return { frames: [], outcome: "too_long", message: `Too many blocks! Use at most ${p.maxSteps}. Try loops (×2, ×3).` };
  }
  let x = start.x;
  let y = start.y;
  let dir = p.startDir;
  const got: string[] = [];
  const frames: Frame[] = [{ x, y, dir, coins: [] }];

  for (const step of program) {
    for (let i = 0; i < step.times; i++) {
      if (step.cmd === "L") dir = ((dir + 3) % 4) as Dir;
      else if (step.cmd === "R") dir = ((dir + 1) % 4) as Dir;
      else {
        const nx = x + DX[dir];
        const ny = y + DY[dir];
        const cell = p.grid[ny]?.[nx];
        if (cell === undefined || cell === "#") {
          frames.push({ x, y, dir, coins: [...got] });
          return { frames, outcome: "crash", message: "💥 ByteBot hit a wall! Check which step went wrong." };
        }
        x = nx;
        y = ny;
        const key = `${x},${y}`;
        if (coins.includes(key) && !got.includes(key)) got.push(key);
      }
      frames.push({ x, y, dir, coins: [...got] });
    }
  }

  if (x !== goal.x || y !== goal.y) {
    return { frames, outcome: "not_reached", message: "ByteBot stopped before the ⭐. Add more steps." };
  }
  if (got.length < coins.length) {
    return { frames, outcome: "missed_coins", message: `Reached the ⭐ but missed ${coins.length - got.length} coin(s).` };
  }
  return { frames, outcome: "win", message: "✅ Program complete! ByteBot made it." };
}

export const getPuzzle = (id: string) => PUZZLES.find((p) => p.id === id)!;
