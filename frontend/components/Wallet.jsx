import React, { useEffect, useState } from "react";
import { api, setHeaders } from "../react-ui/api";

const Wallet = () => {
  const [userId, setUserId] = useState("demo-user-id");
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
    <div className="panel">
      <h2>Wallet</h2>
      <div className="row">
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
        <button onClick={load}>Load</button>
      </div>
      <p>Balance: {balance}</p>
      <div className="grid-2">
        <div className="panel">
          <h3>Deposit</h3>
          <p className="small">UPI QR flow: user pays and submits UTR, admin approves request.</p>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR" />
          <button onClick={deposit}>Submit Deposit</button>
        </div>
        <div className="panel">
          <h3>Withdrawal</h3>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID" />
          <button onClick={withdraw}>Submit Withdrawal</button>
        </div>
      </div>
      <div className="panel">
        <h3>Transactions</h3>
        {history.map((h) => (
          <p key={h._id}>{h.type} | {h.amount} | {h.status} | {new Date(h.createdAt).toLocaleString()}</p>
        ))}
      </div>
    </div>
  );
};

export default Wallet;