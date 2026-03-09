import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../react-ui/socket";
import { createGame } from "../phaser-game/LudoScene";
import { getSession } from "../react-ui/auth";

const Lobby = () => {
  const boardRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const session = getSession();
  const userId = session?.userId;
  const entryFee = Number(location.state?.entryFee || 10);

  const [difficulty, setDifficulty] = useState("medium");
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("Ready");
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    gameRef.current = createGame(boardRef.current, {
      getState: () => state,
      onEmit: (event, payload) => socket.emit(event, payload)
    });

    const waitForScene = setInterval(() => {
      const scene = gameRef.current.scene.getScene("LudoScene");
      if (scene) {
        sceneRef.current = scene;
        clearInterval(waitForScene);
      }
    }, 100);

    return () => {
      clearInterval(waitForScene);
      gameRef.current?.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current && state) {
      sceneRef.current.renderState(state);
    }
  }, [state]);

  useEffect(() => {
    const onMatch = (payload) => {
      setRoomId(payload.roomId);
      setStatus(payload.botAssigned ? "Matched with bot" : "Match found");
    };

    const onStart = (data) => {
      setState(data);
      setStatus("Game started");
    };

    const onDice = ({ diceValue, possibleMoves }) => {
      sceneRef.current?.animateDice(diceValue);
      setStatus(`Dice: ${diceValue} | Valid moves: ${possibleMoves.length}`);
    };

    const onBoard = ({ state: nextState, winner }) => {
      if (nextState) setState(nextState);
      if (winner) setStatus(`Winner: ${winner}`);
    };

    const onTurn = ({ turn }) => setStatus(`Turn: ${turn}`);
    const onEnd = ({ winner, reason }) => setStatus(winner ? `Game ended: ${winner}` : reason || "Game ended");

    socket.on("matchFound", onMatch);
    socket.on("startGame", onStart);
    socket.on("diceResult", onDice);
    socket.on("boardUpdate", onBoard);
    socket.on("turnChange", onTurn);
    socket.on("gameEnd", onEnd);

    return () => {
      socket.off("matchFound", onMatch);
      socket.off("startGame", onStart);
      socket.off("diceResult", onDice);
      socket.off("boardUpdate", onBoard);
      socket.off("turnChange", onTurn);
      socket.off("gameEnd", onEnd);
    };
  }, []);

  const play = () => {
    setStatus("Searching for opponent...");
    socket.emit("joinQueue", { userId, entryFee, botDifficulty: difficulty });
  };

  const roll = () => {
    if (!roomId) return;
    socket.emit("rollDice", { roomId, playerId: userId });
  };

  const move = (tokenIndex) => {
    if (!roomId) return;
    socket.emit("moveToken", { roomId, playerId: userId, tokenIndex });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a2137,#080b14_55%)] px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="card mb-5 flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Game Room</p>
            <p className="text-2xl font-black text-brandYellow">Entry Fee Rs {entryFee}</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy Bot</option>
              <option value="medium">Medium Bot</option>
              <option value="hard">Hard Bot</option>
            </select>
            <button className="btn-primary" onClick={play}>Play Match</button>
            <button className="rounded-xl border border-slate-600 px-4 py-2 text-sm hover:border-brandYellow" onClick={() => navigate("/dashboard")}>Back</button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="card p-4">
            <div ref={boardRef} className="aspect-square w-full overflow-hidden rounded-xl border border-slate-700" />
          </div>

          <aside className="card p-4">
            <p className="text-sm text-slate-300">{status}</p>
            <p className="mt-2 text-xs text-slate-500">Room: {roomId || "-"}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-brandYellow px-3 py-2 font-semibold text-slate-900 transition hover:brightness-110" onClick={roll}>Roll Dice</button>
              <button className="rounded-xl border border-brandWin/50 bg-brandWin/10 px-3 py-2 font-semibold text-brandWin transition hover:bg-brandWin/20" onClick={() => move(0)}>Move T1</button>
              <button className="rounded-xl border border-brandWin/50 bg-brandWin/10 px-3 py-2 font-semibold text-brandWin transition hover:bg-brandWin/20" onClick={() => move(1)}>Move T2</button>
              <button className="rounded-xl border border-brandWin/50 bg-brandWin/10 px-3 py-2 font-semibold text-brandWin transition hover:bg-brandWin/20" onClick={() => move(2)}>Move T3</button>
              <button className="col-span-2 rounded-xl border border-brandWin/50 bg-brandWin/10 px-3 py-2 font-semibold text-brandWin transition hover:bg-brandWin/20" onClick={() => move(3)}>Move T4</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Lobby;