import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import SignupPage from "../pages/SignupPage";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import Lobby from "../components/Lobby";
import Wallet from "../components/Wallet";
import AdminPanel from "../components/AdminPanel";
import { getSession } from "./auth";

const Protected = ({ children }) => {
  const session = getSession();
  return session ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={(
          <Protected>
            <DashboardPage />
          </Protected>
        )}
      />
      <Route
        path="/game"
        element={(
          <Protected>
            <Lobby />
          </Protected>
        )}
      />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;