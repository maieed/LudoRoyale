import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Board from "./components/Board.jsx";
import Dice from "./components/Dice.jsx";
import Token from "./components/Token.jsx";
import PlayerHUD from "./components/PlayerHUD.jsx";
import { getMovableTokenIndexes } from "./game/GameLogic";
import { bindGameEvents, gameSocket } from "./services/socket";
import { api, setHeaders } from "../react-ui/api";
import { getSession } from "../react-ui/auth";

const LudoMultiplayerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();

  const userId = session?.userId || `guest-${Math.floor(Math.random() * 10000)}`;
  const entryFee = Number(location.state?.entryFee || 10);
  const tournamentName = location.state?.tournamentName || "Ludo Classic";
  const autoQueue = Boolean(location.state?.autoQueue);

  const [walletBalance, setWalletBalance] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [roomId, setRoomId] = useState("");
  const [queued, setQueued] = useState(false);
  const [diceValue, setDiceValue] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [timer, setTimer] = useState(15);

  const autoQueuedRef = useRef(false);

  const loadWallet = async () => {
    setHeaders(userId);
    const { data } = await api.get("/wallet/balance");
    setWalletBalance(data.balance || 0);
  };

  useEffect(() => {
    loadWallet().catch(() => {
      setStatus("Could not load wallet. Check backend /api and x-user-id");
    });
  }, [userId]);

  const joinMatch = async () => {
    if (queued) return;

    if (walletBalance < entryFee) {
      setStatus("Insufficient wallet balance");
      return;
    }

    setQueued(true);
    setStatus("Searching opponent...");
    gameSocket.emit("joinQueue", { userId, entryFee, botDifficulty: "hard" });
  };

  useEffect(() => {
    if (!autoQueue || autoQueuedRef.current) return;
    autoQueuedRef.current = true;
    joinMatch();
  }, [autoQueue, walletBalance, entryFee]);

  useEffect(() => {
    const off = bindGameEvents({
      matchFound: (payload) => {
        setRoomId(payload.roomId);
        setStatus(payload.botAssigned ? "No opponent found. Bot assigned." : "Opponent found. Match starting...");
      },
      startGame: (state) => {
        setGameState(state);
        setStatus("Game started");
        setQueued(false);
      },
      diceResult: ({ playerId, diceValue: value, possibleMoves: moves }) => {
        setDiceValue(value);
        setPossibleMoves(moves || []);
        setRolling(false);
        if (playerId === userId) {
          setStatus(`You rolled ${value}`);
        }
      },
      tokenMove: (payload) => {
        setLastMove({
          playerId: payload.playerId,
          move: payload.move,
          kill: payload.kill,
          winner: payload.state?.winner,
          stateVersion: payload.state?.lastActionAt || Date.now()
        });
      },
      boardUpdate: (payload) => {
        if (payload.error) {
          setStatus(payload.error);
          return;
        }
        setGameState(payload.state || null);
        if (payload.winner) {
          setStatus(`Winner: ${payload.winner}`);
          loadWallet().catch(() => {});
        }
      },
      turnChange: ({ turn }) => {
        setTimer(15);
        setPossibleMoves([]);
        if (turn === userId) {
          setStatus("Your turn");
        } else {
          setStatus(`Turn: ${turn}`);
        }
      },
      gameEnd: ({ winner, reason, prize }) => {
        setQueued(false);
        setPossibleMoves([]);
        setStatus(winner ? `Game Ended. Winner: ${winner}${prize ? ` | Prize: Rs ${prize}` : ""}` : reason || "Game ended");
        loadWallet().catch(() => {});
      }
    });

    return off;
  }, [entryFee, roomId, userId, walletBalance]);

  useEffect(() => {
    if (!gameState?.turn) return undefined;
    const intv = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(intv);
  }, [gameState?.turn]);

  const canRoll = Boolean(gameState && gameState.turn === userId && !gameState.winner && !gameState.diceValue && roomId);
  const movableTokenIndexes = useMemo(() => getMovableTokenIndexes(possibleMoves), [possibleMoves]);
  const highlightedTokenKeys = useMemo(() => movableTokenIndexes.map((idx) => `${userId}_${idx}`), [movableTokenIndexes, userId]);

  const onRollDice = () => {
    if (!canRoll) return;
    setRolling(true);
    gameSocket.emit("rollDice", { roomId, playerId: userId });
  };

  const onMoveToken = (tokenIndex) => {
    if (!roomId) return;
    if (!movableTokenIndexes.includes(tokenIndex)) return;
    gameSocket.emit("moveToken", { roomId, playerId: userId, tokenIndex });
    setPossibleMoves([]);
  };

  const onTokenClick = (playerId, tokenIndex) => {
    if (playerId !== userId) return;
    onMoveToken(tokenIndex);
  };

  const players = gameState?.players || [{ id: userId, type: "human" }];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a,#020617_60%)] px-4 py-5 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tournament</p>
            <h1 className="text-2xl font-black text-yellow-400">{tournamentName}</h1>
          </div>
          <button className="rounded-xl border border-slate-600 px-4 py-2 text-sm hover:border-yellow-400" onClick={() => navigate("/dashboard")}>Back</button>
        </div>

        <PlayerHUD
          players={players}
          turn={gameState?.turn}
          timer={timer}
          walletBalance={walletBalance}
          entryFee={entryFee}
          you={userId}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Board
            gameState={gameState}
            lastMove={lastMove}
            highlightedTokenKeys={highlightedTokenKeys}
            onTokenClick={onTokenClick}
            diceValue={diceValue}
          />

          <aside className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-1 text-sm">{status}</p>
              <p className="mt-1 text-xs text-slate-500">Room: {roomId || "Waiting"}</p>
            </div>

            <Dice value={diceValue} onRoll={onRollDice} disabled={!canRoll} rolling={rolling} />

            <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Your Tokens</p>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <Token
                    key={idx}
                    tokenIndex={idx}
                    enabled={movableTokenIndexes.includes(idx)}
                    active={movableTokenIndexes.includes(idx)}
                    onClick={onMoveToken}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={joinMatch}
              disabled={queued || Boolean(roomId)}
              className={`w-full rounded-xl px-4 py-3 font-semibold transition ${queued || roomId ? "bg-slate-700 text-slate-400" : "bg-yellow-400 text-slate-900 hover:scale-105"}`}
            >
              {queued ? "Matching..." : roomId ? "Match Active" : `Join Match - Rs ${entryFee}`}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LudoMultiplayerPage;