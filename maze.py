import numpy as np

rows, cols = 10, 10

# consistent random maze: closed borders, shared walls set on both sides
maze = np.ones((rows, cols, 4), dtype=int)   # (top, right, bottom, left)
for r in range(rows):
    for c in range(cols):
        if c < cols - 1 and np.random.rand() < 0.5:
            maze[r, c, 1] = 0
            maze[r, c + 1, 3] = 0
        if r < rows - 1 and np.random.rand() < 0.5:
            maze[r, c, 2] = 0
            maze[r + 1, c, 0] = 0

weights = np.random.randint(1, 6, size=(rows, cols))

start, end = (0, 0), (rows - 1, cols - 1)

nodes = {start, end}
for r in range(rows):
    for c in range(cols):
        s = maze[r, c].sum()
        if s <= 1 or s == 3:          # junction (3+ exits) or dead end (1 exit)
            nodes.add((r, c))

# number nodes in row-major order (sorted tuples = top-to-bottom, left-to-right)
node_ids = {cell: i + 1 for i, cell in enumerate(sorted(nodes))}

def open_neighbors(maze, cell):
    r, c = cell
    top, right, bottom, left = maze[r, c]
    result = []
    if not top:    result.append((r - 1, c))
    if not right:  result.append((r, c + 1))
    if not bottom: result.append((r + 1, c))
    if not left:   result.append((r, c - 1))
    return result

def walk(maze, weights, nodes, start, first_step):
    prev, cur = start, first_step
    total = int(weights[cur])                      # entering first_step
    while cur not in nodes:
        (nxt,) = [n for n in open_neighbors(maze, cur) if n != prev]
        prev, cur = cur, nxt
        total += int(weights[cur])                 # entering the next cell
    return cur, total

def build_graph(maze, weights, nodes):
    graph = {}
    for node in nodes:
        graph[node] = [walk(maze, weights, nodes, node, nb)
                       for nb in open_neighbors(maze, node)]
    return graph

graph = build_graph(maze, weights, nodes)

for cell in sorted(nodes):
    edges = [(node_ids[n], w) for n, w in graph[cell]]
    print(f"Node {node_ids[cell]} at {cell}: {edges}")