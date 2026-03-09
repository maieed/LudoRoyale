const { v4: uuidv4 } = require("uuid");

const BOARD_LENGTH = 52;
const HOME_LENGTH = 6;
const TOKENS_PER_PLAYER = 4;
const SAFE_TILES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const playerStartBySeat = [0, 26];

const createInitialState = (players, entryFee = 0) => ({
  roomId: uuidv4(),
  players,
  entryFee,
  turn: players[0].id,
  diceValue: null,
  tokens: players.reduce((acc, player, index) => {
    acc[player.id] = Array(TOKENS_PER_PLAYER).fill(-1);
    acc[`${player.id}_seat`] = index;
    return acc;
  }, {}),
  winner: null,
  createdAt: new Date().toISOString(),
  lastActionAt: Date.now()
});

const rollDice = () => Math.floor(Math.random() * 6) + 1;

const getProgress = (state, playerId, tokenPos) => {
  if (tokenPos < 0) {
    return -1;
  }
  if (tokenPos >= BOARD_LENGTH) {
    return BOARD_LENGTH + (tokenPos - BOARD_LENGTH);
  }

  const seat = state.tokens[`${playerId}_seat`];
  const start = playerStartBySeat[seat];
  return (tokenPos - start + BOARD_LENGTH) % BOARD_LENGTH;
};

const toWorldPosition = (state, playerId, progress) => {
  const seat = state.tokens[`${playerId}_seat`];
  if (progress < BOARD_LENGTH) {
    return (playerStartBySeat[seat] + progress) % BOARD_LENGTH;
  }
  return BOARD_LENGTH + (progress - BOARD_LENGTH);
};

const getPossibleMoves = (state, playerId, diceValue) => {
  const tokens = state.tokens[playerId] || [];
  const possible = [];

  tokens.forEach((pos, tokenIndex) => {
    if (pos === -1) {
      if (diceValue === 6) {
        possible.push({ tokenIndex, from: pos, to: playerStartBySeat[state.tokens[`${playerId}_seat`]] });
      }
      return;
    }

    const progress = getProgress(state, playerId, pos);
    const nextProgress = progress + diceValue;
    if (nextProgress > BOARD_LENGTH + HOME_LENGTH - 1) {
      return;
    }

    const to = toWorldPosition(state, playerId, nextProgress);
    possible.push({ tokenIndex, from: pos, to });
  });

  return possible;
};

const validateMove = (state, playerId, tokenIndex, diceValue) => {
  if (state.winner) {
    return { ok: false, reason: "Game ended" };
  }
  if (state.turn !== playerId) {
    return { ok: false, reason: "Not your turn" };
  }
  const moves = getPossibleMoves(state, playerId, diceValue);
  const found = moves.find((m) => m.tokenIndex === tokenIndex);
  if (!found) {
    return { ok: false, reason: "Invalid token move" };
  }
  return { ok: true, move: found };
};

const isSafeTile = (pos) => pos >= BOARD_LENGTH || SAFE_TILES.has(pos);

const checkKill = (state, playerId, toPosition) => {
  if (isSafeTile(toPosition)) {
    return null;
  }

  const opponent = state.players.find((p) => p.id !== playerId);
  if (!opponent) {
    return null;
  }

  const tokens = state.tokens[opponent.id];
  const tokenIndex = tokens.findIndex((pos) => pos === toPosition);
  if (tokenIndex === -1) {
    return null;
  }

  state.tokens[opponent.id][tokenIndex] = -1;
  return { playerId: opponent.id, tokenIndex };
};

const checkWinner = (state, playerId) => {
  const allHome = state.tokens[playerId].every((pos) => pos === BOARD_LENGTH + HOME_LENGTH - 1);
  if (allHome) {
    state.winner = playerId;
    return true;
  }
  return false;
};

const moveToken = (state, playerId, tokenIndex, diceValue) => {
  const validation = validateMove(state, playerId, tokenIndex, diceValue);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  const { move } = validation;
  state.tokens[playerId][tokenIndex] = move.to;
  const kill = checkKill(state, playerId, move.to);
  const win = checkWinner(state, playerId);

  const retainTurn = diceValue === 6 && !win;
  if (!retainTurn) {
    const next = state.players.find((p) => p.id !== playerId);
    state.turn = next?.id || playerId;
  }

  state.lastActionAt = Date.now();
  return {
    ok: true,
    move,
    kill,
    winner: state.winner,
    turn: state.turn,
    retainTurn
  };
};

module.exports = {
  BOARD_LENGTH,
  HOME_LENGTH,
  SAFE_TILES,
  createInitialState,
  rollDice,
  getPossibleMoves,
  validateMove,
  moveToken,
  checkKill,
  checkWinner,
  getProgress
};