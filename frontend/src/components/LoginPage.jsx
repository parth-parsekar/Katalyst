import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { saveAuth } from "../utils/auth";

const LoginPage = ({ onLogin }) => {
  const [error, setError] = useState(null);

  const handleSuccess = (credentialResponse) => {
    setError(null);
    const token = credentialResponse.credential;
    const decoded = jwtDecode(token);
    const user = {
      googleId: decoded.sub,
      email:    decoded.email,
      name:     decoded.name    || decoded.email,
      picture:  decoded.picture || null,
    };
    saveAuth(token, user);
    onLogin(user);
  };

  const handleError = () => {
    setError("Google sign-in failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/12 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-10 rounded-3xl max-w-md w-full flex flex-col items-center gap-6 relative z-10 shadow-2xl border border-white/10">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.4)] mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Welcome to Katalyst
          </h1>
          <p className="text-textMuted text-sm leading-relaxed max-w-xs">
            Your unified learning tracker. Save, organise, and revisit resources from YouTube, LeetCode, and the web — all in one place.
          </p>
        </div>

        <div className="w-full flex flex-col items-center gap-3 mt-2">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
            logo_alignment="left"
          />

          {error && (
            <p className="text-danger text-xs text-center mt-1">{error}</p>
          )}
        </div>

        <p className="text-textMuted/50 text-xs text-center mt-2">
          By signing in you agree to Google''s Terms of Service.<br />
          Your data is scoped privately to your account.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
