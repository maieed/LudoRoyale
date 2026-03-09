import React from "react";

const PlayerHUD = ({ players, turn, timer, walletBalance, entryFee, you }) => {
  return (
    <div className="mb-4 grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Wallet</p>
        <p className="text-2xl font-bold text-emerald-400">Rs {walletBalance}</p>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Entry Fee</p>
        <p className="text-2xl font-bold text-yellow-400">Rs {entryFee}</p>
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 lg:col-span-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Players</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {players.map((p) => {
            const active = turn === p.id;
            const isYou = p.id === you;
            return (
              <div
                key={p.id}
                className={`rounded-lg border px-3 py-2 text-sm ${active ? "border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,.5)]" : "border-slate-700"}`}
              >
                <span className="font-semibold">{isYou ? `${p.id} (You)` : p.id}</span>
                <span className="ml-2 text-slate-400">{p.type}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-slate-800">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, (timer / 15) * 100))}%` }} />
        </div>
      </div>
    </div>
  );
};

export default PlayerHUD;