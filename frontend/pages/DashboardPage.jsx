import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setHeaders } from "../react-ui/api";
import { clearSession, getSession } from "../react-ui/auth";

const posters = [
  { id: 1, image: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=900&q=80", fee: 10 },
  { id: 2, image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=80", fee: 50 },
  { id: 3, image: "https://images.unsplash.com/photo-1523875194681-bedd468c58bf?auto=format&fit=crop&w=900&q=80", fee: 100 }
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");

  const loadWallet = async () => {
    setHeaders(session.userId);
    const { data } = await api.get("/wallet/balance");
    setBalance(data.balance || 0);
  };

  useEffect(() => {
    loadWallet().catch(() => setError("Could not load wallet"));
  }, []);

  const onPlay = (entryFee) => {
    if (balance < entryFee) {
      setError("Insufficient Balance");
      return;
    }

    setError("");
    navigate("/game", { state: { entryFee } });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#182037,#080b14_55%)] px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Wallet Balance</p>
            <p className="text-3xl font-black text-brandYellow">Rs {balance}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold">{(session.name || "U").slice(0, 1).toUpperCase()}</div>
            <button className="rounded-xl border border-slate-600 px-4 py-2 text-sm hover:border-brandYellow" onClick={() => { clearSession(); navigate("/"); }}>Logout</button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}

        <div className="grid gap-5 md:grid-cols-3">
          {posters.map((poster) => (
            <article key={poster.id} className="card overflow-hidden transition hover:-translate-y-1 hover:shadow-glow">
              <img src={poster.image} alt={`Room ${poster.id}`} className="h-48 w-full object-cover" />
              <div className="p-4">
                <p className="text-lg font-bold">Entry Fee Rs {poster.fee}</p>
                <button className="btn-primary mt-3 w-full" onClick={() => onPlay(poster.fee)}>Play</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;