import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setHeaders } from "../react-ui/api";
import { setSession } from "../react-ui/auth";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const sendOtp = async () => {
    const code = String(1000 + Math.floor(Math.random() * 9000));
    setGeneratedOtp(code);
    setMessage(`OTP sent. Demo OTP: ${code}`);

    // Provision user on backend using external ID flow.
    setHeaders(whatsapp);
    await api.get("/wallet/balance");
  };

  const verify = () => {
    if (otp !== generatedOtp) {
      setMessage("Invalid OTP");
      return;
    }

    setSession({
      userId: whatsapp,
      name,
      referralCode,
      createdAt: new Date().toISOString()
    });
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">Signup</h1>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" placeholder="WhatsApp Number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" placeholder="Referral Code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
          <button className="btn-primary w-full" onClick={sendOtp} disabled={!name || !whatsapp}>Send OTP</button>
          <input className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button className="w-full rounded-xl border border-brandWin/60 bg-brandWin/20 px-4 py-2 font-semibold text-brandWin transition hover:bg-brandWin/30" onClick={verify}>Verify & Continue</button>
          <p className="text-sm text-slate-300">{message}</p>
        </div>
        <p className="mt-4 text-sm text-slate-400">Already have an account? <Link to="/login" className="text-brandYellow">Login</Link></p>
      </div>
    </div>
  );
};

export default SignupPage;