import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a2137,#080b14_55%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <div className="text-2xl font-extrabold tracking-wide text-brandYellow">LudoWin</div>
        <div className="flex gap-3">
          <Link to="/login" className="rounded-xl border border-brandYellow/60 px-4 py-2 text-sm text-brandYellow transition hover:bg-brandYellow hover:text-slate-900">Login</Link>
          <Link to="/signup" className="btn-primary px-4 py-2 text-sm">Signup</Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">Play Ludo & Win Real Money</h1>
          <p className="mt-4 max-w-xl text-slate-300">Compete in skill-based realtime Ludo matches, climb leaderboards, and cash out winnings in a secure wallet flow.</p>
          <Link to="/signup" className="btn-primary mt-8">Play Now</Link>
        </div>

        <div className="card animate-floatSlow p-8 shadow-glow">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`h-16 rounded-lg ${i % 2 ? "bg-slate-700/70" : "bg-slate-600/70"}`} />
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <div className="h-6 w-6 rounded-full bg-red-500" />
            <div className="h-6 w-6 rounded-full bg-brandYellow" />
            <div className="h-6 w-6 rounded-full bg-brandWin" />
            <div className="h-6 w-6 rounded-full bg-blue-500" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {["Create account", "Join match", "Win money"].map((step, i) => (
            <div key={step} className="card p-6">
              <p className="text-xs uppercase tracking-widest text-brandYellow">Step {i + 1}</p>
              <p className="mt-2 text-xl font-bold">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-400">
        <span>Terms</span> · <span>Privacy</span> · <span>Contact</span>
      </footer>
    </div>
  );
};

export default LandingPage;