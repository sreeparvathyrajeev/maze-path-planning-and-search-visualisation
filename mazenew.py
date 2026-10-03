import numpy as np

rows, cols = 50,50



weights = np.random.randint(1, 6, size=(rows, cols))

start, end = (0, 0), (rows - 1, cols - 1)

import random
DELTAS = [(-1, 0), (0, 1), (1, 0), (0, -1)]
def open_wall(maze, r, c, side):
    dr, dc = DELTAS[side]
    maze[r, c, side] = 0                          # this cell's side
    maze[r + dr, c + dc, (side + 2) % 4] = 0      # neighbor's matching side

def generate_maze(rows, cols, start):
    maze = np.ones((rows, cols, 4), dtype=int)       # all walls
    visited = {start}
    stack = [start]
    while stack:
        r, c = stack[-1]
        options = [(s, r + dr, c + dc) for s, (dr, dc) in enumerate(DELTAS)
                   if 0 <= r + dr < rows and 0 <= c + dc < cols
                   and (r + dr, c + dc) not in visited]
        if options:
            s, nr, nc = random.choice(options)
            open_wall(maze, r, c, s)                  # your existing function
            visited.add((nr, nc))
            stack.append((nr, nc))
        else:
            stack.pop()                               # dead end, back up
    return maze

maze = generate_maze(rows, cols, start)
for _ in range(150):                                  # more = more loops
    r, c = random.randrange(rows), random.randrange(cols)
    s = random.choice([1, 2])                         # right or bottom
    dr, dc = DELTAS[s]
    if 0 <= r + dr < rows and 0 <= c + dc < cols:
        open_wall(maze, r, c, s)


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



#figuring out shortest path from start node to end node using dijkstras algorithm

import heapq

def dijkstra(graph, start, end):
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    previous = {}

    while pq:
        current_distance, current_node = heapq.heappop(pq)

        if current_node == end:
            break

        if current_distance > distances[current_node]:
            continue

        for neighbor, weight in graph[current_node]:
            distance = current_distance + weight

            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))

    path = []
    current = end
    while current in previous:
        path.append(current)
        current = previous[current]
    path.append(start)
    path.reverse()

    return path, distances[end]


path, cost = dijkstra(graph, start, end)
print("cost:", cost)
print("path:", [node_ids[n] for n in path])

colors = {1: "#e8f5e9", 2: "#a5d6a7", 3: "#ffe082", 4: "#ffab40", 5: "#e53935"}
rows, cols = 50, 50
html = "<style>table{border-collapse:collapse;} td{width:14px;height:14px;padding:0;}</style>\n"

# legend
html += "<p>"
for w, col in colors.items():
    html += f'<span style="background:{col};padding:2px 8px;margin-right:6px;">cost {w}</span>'
html += "</p>\n"

html += "<table>\n"
for r in range(rows):
    html += "<tr>"
    for c in range(cols):
        if (r,c)==start:
            style = "background:blue;"
        elif (r,c)==end:
            style = "background:pink;"
        else:
            style = f"background:{colors[int(weights[r, c])]};"
        top, right, bottom, left = maze[r, c]
        if top:    style += "border-top:2px solid black;"
        if right:  style += "border-right:2px solid black;"
        if bottom: style += "border-bottom:2px solid black;"
        if left:   style += "border-left:2px solid black;"
        html += f'<td style="{style}"></td>'
    html += "</tr>\n"
html += "</table>"

with open("test.html", "w") as f:
    f.write(html)