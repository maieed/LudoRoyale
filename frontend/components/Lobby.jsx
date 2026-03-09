import React, { useEffect, useRef, useState } from "react";
import { socket } from "../react-ui/socket";
import { createGame } from "../phaser-game/LudoScene";

const Lobby = () => {
  const boardRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);

  const [userId, setUserId] = useState(`u-${Math.floor(Math.random() * 100000)}`);
  const [entryFee, setEntryFee] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("Idle");
  const [state, setState] = useState(null);

  useEffect(() => {
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
      setStatus(`Dice: ${diceValue} | moves: ${possibleMoves.length}`);
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
    socket.emit("joinQueue", { userId, entryFee: Number(entryFee), botDifficulty: difficulty });
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
    <div className="panel">
      <div className="row">
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
        <input type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} min="1" />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
        <button onClick={play}>Play</button>
        <button onClick={roll}>Roll Dice</button>
        <button onClick={() => move(0)}>Move T1</button>
        <button onClick={() => move(1)}>Move T2</button>
        <button onClick={() => move(2)}>Move T3</button>
        <button onClick={() => move(3)}>Move T4</button>
      </div>
      <p>{status}</p>
      <div ref={boardRef} className="board-wrap" />
      <p className="small">Room: {roomId || "-"}</p>
    </div>
  );
};

export default Lobby;