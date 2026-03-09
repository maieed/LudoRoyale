import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setSession } from "../react-ui/auth";

const LoginPage = () => {
  const [whatsapp, setWhatsapp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const sendOtp = () => {
    const code = String(1000 + Math.floor(Math.random() * 9000));
    setSentOtp(code);
    setMessage(`OTP sent. Demo OTP: ${code}`);
  };

  const verify = () => {
    if (otp !== sentOtp) {
      setMessage("Invalid OTP");
      return;
    }

    setSession({ userId: whatsapp, name: whatsapp });
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" placeholder="WhatsApp Number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <button className="btn-primary w-full" onClick={sendOtp} disabled={!whatsapp}>Send OTP</button>
          <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button className="w-full rounded-xl border border-brandWin/60 bg-brandWin/20 px-4 py-2 font-semibold text-brandWin transition hover:bg-brandWin/30" onClick={verify}>Verify & Login</button>
          <p className="text-sm text-slate-300">{message}</p>
        </div>
        <p className="mt-4 text-sm text-slate-400">New user? <Link to="/signup" className="text-brandYellow">Create account</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;