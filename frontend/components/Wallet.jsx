import React, { useEffect, useState } from "react";
import { api, setHeaders } from "../react-ui/api";
import { getSession } from "../react-ui/auth";

const Wallet = () => {
  const session = getSession();
  const [userId, setUserId] = useState(session?.userId || "demo-user-id");
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(100);
  const [reference, setReference] = useState("");
  const [upiId, setUpiId] = useState("");
  const [history, setHistory] = useState([]);

  const load = async () => {
    setHeaders(userId);
    const [{ data: bal }, { data: txs }] = await Promise.all([
      api.get("/wallet/balance"),
      api.get("/wallet/transactions")
    ]);
    setBalance(bal.balance);
    setHistory(txs);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const deposit = async () => {
    setHeaders(userId);
    await api.post("/wallet/deposit", { amount: Number(amount), utr: reference });
    await load();
  };

  const withdraw = async () => {
    setHeaders(userId);
    await api.post("/wallet/withdraw", { amount: Number(amount), upiId });
    await load();
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="card p-5">
          <h2 className="text-2xl font-bold">Wallet</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
            <button className="btn-primary" onClick={load}>Load</button>
          </div>
          <p className="mt-3 text-xl font-semibold text-brandYellow">Balance: Rs {balance}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-lg font-bold">Deposit</h3>
            <p className="mt-1 text-sm text-slate-400">Pay via UPI, submit UTR, wait for approval.</p>
            <div className="mt-3 space-y-2">
              <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR" />
              <button className="btn-primary w-full" onClick={deposit}>Submit Deposit</button>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-lg font-bold">Withdrawal</h3>
            <div className="mt-3 space-y-2">
              <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID" />
              <button className="w-full rounded-xl border border-brandWin/60 bg-brandWin/20 px-4 py-2 font-semibold text-brandWin transition hover:bg-brandWin/30" onClick={withdraw}>Submit Withdrawal</button>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold">Transaction History</h3>
          <div className="mt-3 space-y-2">
            {history.map((h) => (
              <p key={h._id} className="rounded-lg border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-sm">{h.type} | Rs {h.amount} | {h.status} | {new Date(h.createdAt).toLocaleString()}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;