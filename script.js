// ---------- Maze basics ----------
const ROWS = DATA.maze.length;
const COLS = DATA.maze[0].length;
const key = (r, c) => r * COLS + c;                         // cell -> single number
const rc = (k) => [Math.floor(k / COLS), k % COLS];         // number -> cell

// ---------- Load the compressed graph that Python built ----------
// GRAPH[node] = list of edges {to, cost, cells}
const GRAPH = {};
for (const [nodeKey, edges] of Object.entries(DATA.graph)) {
  const [r, c] = nodeKey.split(",").map(Number);
  GRAPH[key(r, c)] = edges.map(e => ({
    to: key(...e.to),
    cost: e.cost,
    cells: e.cells.map(([a, b]) => key(a, b))               // corridor cells, ending at the next node
  }));
}

// ---------- Painting helpers ----------
const ORIGINAL = [];                                        // remember original colors for reset
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++)
    ORIGINAL[key(r, c)] = document.getElementById(`c-${r}-${c}`).style.background;

const isSpecial = (r, c) =>                                 // start and exits keep their colors
  (r === DATA.start[0] && c === DATA.start[1]) ||
  DATA.exits.some(([er, ec]) => er === r && ec === c);

function paint(k, color) {
  const [r, c] = rc(k);
  if (isSpecial(r, c)) return;
  document.getElementById(`c-${r}-${c}`).style.background = color;
}

function resetColors() {
  for (let k = 0; k < ROWS * COLS; k++) {
    const [r, c] = rc(k);
    document.getElementById(`c-${r}-${c}`).style.background = ORIGINAL[k];
  }
}

// ---------- Dijkstra on the compressed graph ----------
function dijkstra(start, goal) {
  const s = key(...start), g = key(...goal);
  const dist = {}, prevNode = {}, prevEdge = {}, done = {};
  for (const k in GRAPH) dist[k] = Infinity;
  dist[s] = 0;
  const frontier = [s];
  const events = [];
  let nodesExplored = 0, cellsExplored = 0;

  while (frontier.length > 0) {
    // pick the frontier node with the smallest cost so far
    let best = 0;
    for (let i = 1; i < frontier.length; i++)
      if (dist[frontier[i]] < dist[frontier[best]]) best = i;
    const cur = frontier.splice(best, 1)[0];
    done[cur] = true;
    nodesExplored++;

    // replay: the corridor leading into this node (plus the node) becomes "explored"
    const cells = prevEdge[cur] ? prevEdge[cur].cells : [cur];
    cellsExplored += cells.length;
    events.push(["done", cells]);

    if (cur === g) break;

    for (const edge of GRAPH[cur]) {
      if (done[edge.to]) continue;
      const nd = dist[cur] + edge.cost;
      if (nd < dist[edge.to]) {
        if (dist[edge.to] === Infinity) {
          frontier.push(edge.to);
          events.push(["frontier", [edge.to]]);
        }
        dist[edge.to] = nd;
        prevNode[edge.to] = cur;
        prevEdge[edge.to] = edge;
      }
    }
  }

  if (dist[g] === Infinity) return null;                    // exit cannot be reached

  // rebuild the cell-by-cell path by chaining the edges' corridors
  const chain = [];
  for (let k = g; k !== s; k = prevNode[k]) chain.push(prevEdge[k]);
  chain.reverse();
  const cellPath = [s];
  for (const edge of chain) cellPath.push(...edge.cells);

  return {
    path: cellPath.map(rc),
    cost: dist[g],
    explored: cellsExplored,
    nodesExplored: nodesExplored,
    events: events
  };
}

// ---------- Replay ----------
let timer = null;
const STEPS_PER_TICK = 1;    // events per tick (higher = faster)
const TICK_MS = 60;          // milliseconds between ticks

function replay(result) {
  let i = 0;
  timer = setInterval(() => {
    for (let n = 0; n < STEPS_PER_TICK && i < result.events.length; n++, i++) {
      const [type, ks] = result.events[i];
      for (const k of ks) paint(k, type === "frontier" ? "#4fc3f7" : "#9e9e9e");
    }
    if (i >= result.events.length) {
      clearInterval(timer);
      timer = null;
      for (const [pr, pc] of result.path) paint(key(pr, pc), "#00e5ff");   // final path on top
    }
  }, TICK_MS);
}

// ---------- Clicking an exit ----------
for (const [r, c] of DATA.exits) {
  const cell = document.getElementById(`c-${r}-${c}`);
  cell.style.cursor = "pointer";
  cell.onclick = () => {
    if (timer) { clearInterval(timer); timer = null; }      // stop any replay in progress
    resetColors();
    const result = dijkstra(DATA.start, [r, c]);
    if (result === null) { alert("This exit cannot be reached."); return; }
    console.log("cost:", result.cost, "path length:", result.path.length,
                "cells explored:", result.explored, "nodes explored:", result.nodesExplored);
    replay(result);
  };
}