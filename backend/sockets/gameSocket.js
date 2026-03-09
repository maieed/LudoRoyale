const { MatchmakingService } = require("../matchmaking/matchmakingService");
const { GameStateService } = require("../services/gameStateService");
const { AntiCheatService } = require("../services/antiCheatService");
const { rollDice, getPossibleMoves, moveToken } = require("../game-engine/ludoEngine");
const { chooseBotMove } = require("../bot-engine/botEngine");
const { WalletService } = require("../wallet/walletService");

const bindGameSocket = (io, redis) => {
  const matchmaking = new MatchmakingService(redis);
  const gameStateService = new GameStateService(redis);
  const walletService = new WalletService();
  const antiCheat = new AntiCheatService(redis);

  io.on("connection", (socket) => {
    socket.on("joinQueue", async ({ userId, entryFee, botDifficulty = "medium" }) => {
      try {
        await matchmaking.joinQueue({ userId, entryFee, socketId: socket.id, botDifficulty });
        const match = await matchmaking.findOrCreateMatch({ userId, entryFee, waitSeconds: Number(process.env.MATCH_WAIT_SECONDS || 8) });

        const roomState = await matchmaking.createRoomState(match.players, entryFee, match.roomId);

        for (const p of match.players) {
          if (p.type === "human") {
            await walletService.deductEntryFee(p.id, entryFee, roomState.roomId);
          }
        }

        socket.join(roomState.roomId);
        io.to(socket.id).emit("matchFound", { roomId: roomState.roomId, players: roomState.players, botAssigned: !match.found });
        io.to(socket.id).emit("startGame", roomState);

        const otherHuman = match.players.find((p) => p.type === "human" && p.id !== userId);
        if (otherHuman?.socketId) {
          io.sockets.sockets.get(otherHuman.socketId)?.join(roomState.roomId);
          io.to(otherHuman.socketId).emit("matchFound", { roomId: roomState.roomId, players: roomState.players, botAssigned: !match.found });
          io.to(otherHuman.socketId).emit("startGame", roomState);
        }
      } catch (err) {
        socket.emit("gameEnd", { reason: err.message });
      }
    });

    socket.on("rollDice", async ({ roomId, playerId }) => {
      await antiCheat.recordEvent(playerId, "rollDice");
      if (await antiCheat.isSuspicious(playerId)) {
        socket.emit("gameEnd", { reason: "Suspicious activity detected" });
        return;
      }

      const state = await gameStateService.getState(roomId);
      if (!state || state.turn !== playerId || state.winner) return;

      const diceValue = rollDice();
      state.diceValue = diceValue;
      await gameStateService.saveState(roomId, state);

      const possibleMoves = getPossibleMoves(state, playerId, diceValue);
      io.to(roomId).emit("diceResult", { roomId, playerId, diceValue, possibleMoves });

      if (!possibleMoves.length) {
        const next = state.players.find((p) => p.id !== playerId);
        state.turn = next?.id || playerId;
        state.diceValue = null;
        await gameStateService.saveState(roomId, state);
        io.to(roomId).emit("turnChange", { roomId, turn: state.turn, state });
      }

      await runBotTurnIfNeeded(io, gameStateService, roomId, walletService);
    });

    socket.on("moveToken", async ({ roomId, playerId, tokenIndex }) => {
      await antiCheat.recordEvent(playerId, "moveToken");
      if (await antiCheat.isSuspicious(playerId)) {
        socket.emit("gameEnd", { reason: "Suspicious activity detected" });
        return;
      }

      const state = await gameStateService.getState(roomId);
      if (!state || state.winner || state.turn !== playerId || !state.diceValue) return;

      const result = moveToken(state, playerId, tokenIndex, state.diceValue);
      if (!result.ok) {
        socket.emit("boardUpdate", { error: result.reason });
        return;
      }

      state.diceValue = null;
      await gameStateService.saveState(roomId, state);

      io.to(roomId).emit("boardUpdate", {
        roomId,
        state,
        move: result.move,
        kill: result.kill,
        winner: result.winner
      });
      io.to(roomId).emit("turnChange", { roomId, turn: state.turn });

      if (result.winner) {
        const prize = state.entryFee * 1.8;
        await walletService.awardPrize(result.winner, prize, roomId);
        await gameStateService.persistGameResult(state);
        io.to(roomId).emit("gameEnd", { roomId, winner: result.winner, prize });
        return;
      }

      await runBotTurnIfNeeded(io, gameStateService, roomId, walletService);
    });
  });
};

const runBotTurnIfNeeded = async (io, gameStateService, roomId, walletService) => {
  const state = await gameStateService.getState(roomId);
  if (!state || state.winner) return;

  const current = state.players.find((p) => p.id === state.turn);
  if (!current || current.type !== "bot") return;

  const delay = 1000 + Math.floor(Math.random() * 2000);
  setTimeout(async () => {
    const latest = await gameStateService.getState(roomId);
    if (!latest || latest.winner || latest.turn !== current.id) return;

    const diceValue = rollDice();
    latest.diceValue = diceValue;
    await gameStateService.saveState(roomId, latest);
    io.to(roomId).emit("diceResult", { roomId, playerId: current.id, diceValue, possibleMoves: getPossibleMoves(latest, current.id, diceValue) });

    const decision = chooseBotMove(latest, current, current.difficulty || "medium");
    if (!decision.move) {
      const next = latest.players.find((p) => p.id !== current.id);
      latest.turn = next?.id || current.id;
      latest.diceValue = null;
      await gameStateService.saveState(roomId, latest);
      io.to(roomId).emit("turnChange", { roomId, turn: latest.turn, state: latest });
      return;
    }

    setTimeout(async () => {
      const again = await gameStateService.getState(roomId);
      if (!again || again.winner || again.turn !== current.id) return;

      const result = moveToken(again, current.id, decision.move.tokenIndex, again.diceValue);
      again.diceValue = null;
      await gameStateService.saveState(roomId, again);

      io.to(roomId).emit("boardUpdate", {
        roomId,
        state: again,
        move: result.move,
        kill: result.kill,
        winner: result.winner,
        botStyle: decision.style
      });
      io.to(roomId).emit("turnChange", { roomId, turn: again.turn, state: again });

      if (result.winner) {
        const prize = again.entryFee * 1.8;
        await walletService.awardPrize(result.winner, prize, roomId);
        await gameStateService.persistGameResult(again);
        io.to(roomId).emit("gameEnd", { roomId, winner: result.winner, prize });
        return;
      }

      await runBotTurnIfNeeded(io, gameStateService, roomId, walletService);
    }, decision.delayMs);
  }, delay);
};

module.exports = { bindGameSocket };