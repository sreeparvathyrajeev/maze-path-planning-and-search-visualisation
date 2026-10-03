// ---------- Maze basics ----------
const ROWS = DATA.maze.length;
const COLS = DATA.maze[0].length;
const DELTAS = [[-1, 0], [0, 1], [1, 0], [0, -1]];  // top, right, bottom, left (same order as Python)

// Each cell gets one number, so we can use simple arrays instead of dictionaries
const key = (r, c) => r * COLS + c;

// Cells you can step into from (r, c): a side with flag 0 means no wall
function neighbors(r, c) {
  const result = [];
  for (let s = 0; s < 4; s++) {
    if (DATA.maze[r][c][s] === 0) {
      result.push([r + DELTAS[s][0], c + DELTAS[s][1]]);
    }
  }
  return result;
}

// ---------- Dijkstra on cells ----------
function dijkstra(start, goal) {
  const dist = new Array(ROWS * COLS).fill(Infinity);   // cheapest known cost to each cell
  const prev = new Array(ROWS * COLS).fill(null);       // where we came from (to rebuild the path)
  const done = new Array(ROWS * COLS).fill(false);      // finalized cells
  const frontier = [key(...start)];                     // cells discovered but not finalized
  dist[key(...start)] = 0;
  let explored = 0;

  while (frontier.length > 0) {
    // 1. pick the frontier cell with the smallest cost so far
    let best = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (dist[frontier[i]] < dist[frontier[best]]) best = i;
    }
    const cur = frontier.splice(best, 1)[0];            // remove it from the frontier
    done[cur] = true;                                   // its cost is now final
    explored++;

    const r = Math.floor(cur / COLS), c = cur % COLS;
    if (r === goal[0] && c === goal[1]) break;          // reached the chosen exit

    // 2. try to improve each neighbor
    for (const [nr, nc] of neighbors(r, c)) {
      const nk = key(nr, nc);
      if (done[nk]) continue;
      const newDist = dist[cur] + DATA.weights[nr][nc]; // pay the cost of the cell you enter
      if (newDist < dist[nk]) {
        if (dist[nk] === Infinity) frontier.push(nk);   // first time we see it
        dist[nk] = newDist;
        prev[nk] = cur;
      }
    }
  }

  const goalKey = key(...goal);
  if (dist[goalKey] === Infinity) return null;          // exit cannot be reached

  // 3. walk backwards from the exit to the start to build the path
  const path = [];
  for (let k = goalKey; k !== null; k = prev[k]) {
    path.push([Math.floor(k / COLS), k % COLS]);
  }
  path.reverse();
  return { path: path, cost: dist[goalKey], explored: explored };
}

// ---------- Clicking an exit ----------
for (const [r, c] of DATA.exits) {
  const cell = document.getElementById(`c-${r}-${c}`);
  cell.style.cursor = "pointer";
  cell.onclick = () => {
    const result = dijkstra(DATA.start, [r, c]);
    if (result === null) {
      alert("This exit cannot be reached.");
      return;
    }
    for (const [pr, pc] of result.path) {
      document.getElementById(`c-${pr}-${pc}`).style.background = "yellow";
    }
    console.log("cost:", result.cost, "path length:", result.path.length, "explored:", result.explored);
  };
}