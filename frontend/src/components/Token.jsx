import React from "react";

const Token = ({ tokenIndex, enabled, onClick, active }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(tokenIndex)}
      disabled={!enabled}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-yellow-400 text-slate-900 shadow-md shadow-yellow-500/40" : "bg-slate-800 text-slate-200"} ${enabled ? "hover:scale-105" : "opacity-40"}`}
    >
      Token {tokenIndex + 1}
    </button>
  );
};

export default Token;