import React from "react";
import { Link, Route, Routes } from "react-router-dom";
import Lobby from "../components/Lobby";
import Wallet from "../components/Wallet";
import AdminPanel from "../components/AdminPanel";

const App = () => {
  return (
    <div className="app-shell">
      <header>
        <h1>Realtime Ludo Arena</h1>
        <nav>
          <Link to="/">Play</Link>
          <Link to="/wallet">Wallet</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;