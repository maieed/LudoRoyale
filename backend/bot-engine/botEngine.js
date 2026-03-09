const { getPossibleMoves, moveToken, BOARD_LENGTH, SAFE_TILES, getProgress } = require("../game-engine/ludoEngine");

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const scoreState = (state, playerId, lastMove, difficulty) => {
  let score = 0;
  const myTokens = state.tokens[playerId];
  const opponent = state.players.find((p) => p.id !== playerId);
  const enemyTokens = opponent ? state.tokens[opponent.id] : [];

  if (lastMove?.kill) score += 200;

  myTokens.forEach((pos) => {
    if (pos >= BOARD_LENGTH) score += 150;
    if (SAFE_TILES.has(pos)) score += 100;
    if (pos >= 0) score += 50;
  });

  myTokens.forEach((pos) => {
    if (pos < 0 || pos >= BOARD_LENGTH) return;
    const inDanger = enemyTokens.some((ePos) => {
      if (ePos < 0 || ePos >= BOARD_LENGTH) return false;
      const delta = (pos - ePos + BOARD_LENGTH) % BOARD_LENGTH;
      return delta > 0 && delta <= 6;
    });

    if (inDanger) score -= 120;
    else score += 80;
  });

  if (difficulty === "easy") {
    return score + Math.floor(Math.random() * 70);
  }
  return score;
};

const randomDelayMs = () => 1000 + Math.floor(Math.random() * 2000);

const monteCarlo = (state, playerId, move, depth) => {
  let acc = 0;
  for (let i = 0; i < depth; i += 1) {
    const sim = clone(state);
    const r = moveToken(sim, playerId, move.tokenIndex, sim.diceValue);
    acc += scoreState(sim, playerId, r, "hard");
  }
  return acc / Math.max(1, depth);
};

const chooseBotMove = (state, botPlayer, difficulty = "medium") => {
  const playerId = botPlayer.id;
  const moves = getPossibleMoves(state, playerId, state.diceValue);

  if (!moves.length) {
    return { move: null, delayMs: randomDelayMs(), style: "hesitate" };
  }

  if (difficulty === "easy") {
    return {
      move: moves[Math.floor(Math.random() * moves.length)],
      delayMs: randomDelayMs(),
      style: "casual"
    };
  }

  const depth = difficulty === "hard" ? 350 : 80;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  moves.forEach((m) => {
    const sim = clone(state);
    const result = moveToken(sim, playerId, m.tokenIndex, state.diceValue);
    let score = scoreState(sim, playerId, result, difficulty);
    score += monteCarlo(state, playerId, m, depth);

    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  });

  const style = difficulty === "hard" ? "aggressive" : "balanced";
  return {
    move: bestMove,
    delayMs: randomDelayMs(),
    style
  };
};

module.exports = { chooseBotMove };