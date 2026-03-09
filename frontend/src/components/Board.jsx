import React, { useEffect, useMemo, useRef } from "react";
import Phaser from "phaser";
import LudoScene from "../game/LudoScene";

const Board = ({ gameState, lastMove, highlightedTokenKeys, onTokenClick, diceValue }) => {
  const rootRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);

  const scene = useMemo(() => new LudoScene({ onTokenClick }), []);

  useEffect(() => {
    scene.setExternals({ onTokenClick });
  }, [onTokenClick, scene]);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const width = rootRef.current.clientWidth || 700;
    const height = rootRef.current.clientHeight || 700;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: rootRef.current,
      width,
      height,
      transparent: true,
      scene: [scene],
      fps: {
        target: 60,
        forceSetTimeOut: false
      },
      render: {
        antialias: true,
        powerPreference: "high-performance"
      }
    });

    sceneRef.current = scene;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !gameRef.current) return;
      const w = Math.max(300, entry.contentRect.width);
      const h = Math.max(300, entry.contentRect.height);
      gameRef.current.scale.resize(w, h);
    });

    ro.observe(rootRef.current);

    return () => {
      ro.disconnect();
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    if (!sceneRef.current || !gameState) return;
    sceneRef.current.syncState(gameState, {
      lastMove,
      highlightedTokenKeys
    });
  }, [gameState, lastMove, highlightedTokenKeys]);

  useEffect(() => {
    if (!sceneRef.current || !diceValue) return;
    sceneRef.current.animateDice(diceValue);
  }, [diceValue]);

  return <div ref={rootRef} className="h-[72vw] max-h-[760px] min-h-[360px] w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50" />;
};

export default Board;