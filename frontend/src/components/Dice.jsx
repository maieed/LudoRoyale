import React, { useEffect, useRef } from "react";

const beep = (frequency = 520, duration = 120) => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = frequency;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  setTimeout(() => {
    osc.stop();
    ctx.close();
  }, duration);
};

const Dice = ({ value, onRoll, disabled, rolling }) => {
  const prevRolling = useRef(false);

  useEffect(() => {
    if (rolling && !prevRolling.current) {
      beep(340, 140);
      setTimeout(() => beep(620, 90), 110);
    }
    prevRolling.current = rolling;
  }, [rolling]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Dice</p>
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 border-yellow-300 bg-white text-3xl font-black text-slate-900 ${rolling ? "animate-bounce" : ""}`}>
          {value || "-"}
        </div>
        <button
          type="button"
          onClick={onRoll}
          disabled={disabled}
          className={`rounded-xl px-4 py-2 font-semibold transition ${disabled ? "bg-slate-700 text-slate-400" : "bg-yellow-400 text-slate-900 hover:scale-105"}`}
        >
          {rolling ? "Rolling..." : "Roll Dice"}
        </button>
      </div>
    </div>
  );
};

export default Dice;