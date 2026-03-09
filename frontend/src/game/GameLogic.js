export const SAFE_TILE_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];

// 52-tile outer ring represented on a 15x15 grid.
export const BOARD_PATH = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]
];

export const HOME_PATHS = {
  0: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  1: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  2: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  3: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]]
};

export const BASE_POSITIONS = {
  0: [[2, 2], [4, 2], [2, 4], [4, 4]],
  1: [[10, 2], [12, 2], [10, 4], [12, 4]],
  2: [[10, 10], [12, 10], [10, 12], [12, 12]],
  3: [[2, 10], [4, 10], [2, 12], [4, 12]]
};

export const ENTRY_TILE_BY_SEAT = {
  0: 51,
  1: 12,
  2: 25,
  3: 38
};

export const seatToColorName = (seat) => ["red", "green", "blue", "yellow"][seat] || "red";

export const getSeatForPlayer = (state, playerId) => {
  const key = `${playerId}_seat`;
  if (typeof state?.tokens?.[key] === "number") return state.tokens[key];
  const found = state?.players?.findIndex((p) => p.id === playerId);
  return found >= 0 ? found : 0;
};

export const gridToPixel = (gx, gy, boardRect) => {
  const tile = boardRect.size / 15;
  return {
    x: boardRect.x + gx * tile + tile * 0.5,
    y: boardRect.y + gy * tile + tile * 0.5
  };
};

export const getTokenGrid = (state, playerId, tokenIndex) => {
  const seat = getSeatForPlayer(state, playerId);
  const tokenPos = state?.tokens?.[playerId]?.[tokenIndex] ?? -1;

  if (tokenPos < 0) {
    const [x, y] = BASE_POSITIONS[seat][tokenIndex];
    return { x, y, kind: "base", tileKey: `b-${seat}-${tokenIndex}` };
  }

  if (tokenPos < 52) {
    const [x, y] = BOARD_PATH[tokenPos];
    return { x, y, kind: "path", tileKey: `p-${tokenPos}` };
  }

  const homeIndex = Math.min(5, tokenPos - 52);
  const [x, y] = HOME_PATHS[seat][homeIndex];
  return { x, y, kind: "home", tileKey: `h-${seat}-${homeIndex}` };
};

export const getStackedOffsets = (count) => {
  if (count <= 1) return [{ x: 0, y: 0 }];
  const radius = 8;
  return Array.from({ length: count }).map((_, idx) => {
    const angle = (Math.PI * 2 * idx) / count;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
};

const boardStepsBetween = (from, to) => {
  const steps = [];
  let cursor = from;
  let guard = 0;
  while (cursor !== to && guard < 70) {
    cursor = (cursor + 1) % 52;
    steps.push(cursor);
    guard += 1;
  }
  return steps;
};

export const buildMovePath = (seat, from, to) => {
  if (from < 0 && to < 52) {
    return [to];
  }

  if (from >= 0 && from < 52 && to < 52) {
    return boardStepsBetween(from, to);
  }

  if (to >= 52) {
    const toHome = Math.max(0, to - 52);

    if (from >= 52) {
      const fromHome = Math.max(0, from - 52);
      const path = [];
      for (let i = fromHome + 1; i <= toHome; i += 1) path.push(52 + i);
      return path;
    }

    const entryTile = ENTRY_TILE_BY_SEAT[seat] ?? 51;
    const boardPart = from >= 0 ? boardStepsBetween(from, entryTile) : [];
    const homePart = Array.from({ length: toHome + 1 }).map((_, i) => 52 + i);
    return [...boardPart, ...homePart];
  }

  return [to];
};

export const getMovableTokenIndexes = (possibleMoves = []) => possibleMoves.map((m) => m.tokenIndex);