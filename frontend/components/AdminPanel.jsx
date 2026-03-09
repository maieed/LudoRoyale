import React, { useState } from "react";
import { api, setHeaders } from "../react-ui/api";

const AdminPanel = () => {
  const [adminUserId, setAdminUserId] = useState("admin");
  const [adminKey, setAdminKey] = useState("replace-admin-key");
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);

  const load = async () => {
    setHeaders(adminUserId, adminKey);
    const [txs, us, gs] = await Promise.all([
      api.get("/admin/transactions/pending"),
      api.get("/admin/users"),
      api.get("/admin/games")
    ]);
    setPending(txs.data);
    setUsers(us.data);
    setGames(gs.data);
  };

  const approve = async (id, approved) => {
    setHeaders(adminUserId, adminKey);
    await api.patch(`/admin/transactions/${id}`, { approved });
    await load();
  };

  const banToggle = async (userId, banned) => {
    setHeaders(adminUserId, adminKey);
    await api.patch(`/admin/users/${userId}/ban`, { banned: !banned });
    await load();
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="card p-5">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" value={adminUserId} onChange={(e) => setAdminUserId(e.target.value)} placeholder="Admin user id" />
            <input className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Admin API key" />
            <button className="btn-primary" onClick={load}>Load Dashboard</button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold">Pending Transactions</h3>
          <div className="mt-3 space-y-2">
            {pending.map((tx) => (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/70 bg-slate-900/50 px-3 py-2" key={tx._id}>
                <span className="text-sm">{tx.type} | Rs {tx.amount} | {tx.reference}</span>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-brandWin/20 px-3 py-1 text-brandWin" onClick={() => approve(tx._id, true)}>Approve</button>
                  <button className="rounded-lg bg-red-500/20 px-3 py-1 text-red-200" onClick={() => approve(tx._id, false)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold">Users</h3>
          <div className="mt-3 space-y-2">
            {users.map((u) => (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/70 bg-slate-900/50 px-3 py-2" key={u._id}>
                <span className="text-sm">{u.username || u._id} | balance: Rs {u.walletBalance}</span>
                <button className="rounded-lg border border-brandYellow/60 px-3 py-1 text-brandYellow" onClick={() => banToggle(u._id, u.banned)}>{u.banned ? "Unban" : "Ban"}</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold">Game History</h3>
          <div className="mt-3 space-y-2">
            {games.map((g) => (
              <p key={g._id} className="rounded-lg border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-sm">{g.roomId} | entry: Rs {g.entryFee} | winner: {g.winner || "-"}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;