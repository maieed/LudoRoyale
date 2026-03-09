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
    <div className="panel">
      <h2>Admin Panel</h2>
      <div className="row">
        <input value={adminUserId} onChange={(e) => setAdminUserId(e.target.value)} placeholder="Admin user id" />
        <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Admin API key" />
        <button onClick={load}>Load Dashboard</button>
      </div>

      <div className="panel">
        <h3>Pending Transactions</h3>
        {pending.map((tx) => (
          <div className="row" key={tx._id}>
            <span>{tx.type} | {tx.amount} | {tx.reference}</span>
            <button onClick={() => approve(tx._id, true)}>Approve</button>
            <button onClick={() => approve(tx._id, false)}>Reject</button>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Users</h3>
        {users.map((u) => (
          <div className="row" key={u._id}>
            <span>{u.username || u._id} | balance: {u.walletBalance}</span>
            <button onClick={() => banToggle(u._id, u.banned)}>{u.banned ? "Unban" : "Ban"}</button>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Game History</h3>
        {games.map((g) => (
          <p key={g._id}>{g.roomId} | entry: {g.entryFee} | winner: {g.winner || "-"}</p>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;