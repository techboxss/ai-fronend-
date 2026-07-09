import React from "react";
import { AppUser } from "../types";
import { Mail, Settings, Inbox, LogOut, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface HeaderProps {
  user: AppUser | null;
  accessToken: string | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  activeMode: "run" | "setup";
  setActiveMode: (mode: "run" | "setup") => void;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({
  user,
  accessToken,
  needsAuth,
  isLoggingIn,
  activeMode,
  setActiveMode,
  onLogin,
  onLogout,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            {/* Geometric blue logo inspired by architectural forms & overlapping diamonds */}
            <div className="flex-shrink-0 relative w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200/60 shadow-inner">
              <svg className="h-9 w-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Diamond */}
                <path d="M50 8 L92 50 L50 92 L8 50 Z" stroke="#0057A4" strokeWidth="3" strokeLinejoin="round" />
                {/* Secondary Gray-Blue Diamond */}
                <path d="M50 20 L80 50 L50 80 L20 50 Z" fill="#7F9498" fillOpacity="0.2" stroke="#7F9498" strokeWidth="2" strokeLinejoin="round" />
                {/* Inner Architectural Overlapping Diamond */}
                <path d="M50 32 L68 50 L50 68 L32 50 Z" fill="#0057A4" fillOpacity="0.9" />
                {/* Core Architectural cross lines representing pillars and foundation */}
                <line x1="50" y1="8" x2="50" y2="92" stroke="#0057A4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
                <line x1="8" y1="50" x2="92" y2="50" stroke="#0057A4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-sans font-bold text-xl tracking-tight text-[#0057A4]">
                  Kagalwalla <span className="font-light text-[#7F9498]">Law Offices LLC</span>
                </span>
                <span className="text-[10px] bg-slate-100 text-[#0057A4] font-semibold font-sans px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                  REAL ESTATE & ESTATE PLANNING
                </span>
              </div>
              <p className="text-xs text-[#7F9498] font-medium font-sans">
                Trust, Integrity & Professional Advisory
              </p>
            </div>
          </div>

          {/* Navigation Modes */}
          <div className="hidden md:flex space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveMode("run")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeMode === "run"
                  ? "bg-[#0057A4] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#0057A4] hover:bg-slate-100"
              }`}
            >
              <Inbox className="h-4 w-4" />
              <span>Practice Dashboard</span>
            </button>
            <button
              onClick={() => setActiveMode("setup")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeMode === "setup"
                  ? "bg-[#0057A4] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#0057A4] hover:bg-slate-100"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Preferences & Rules</span>
            </button>
          </div>

          {/* User Profile & Auth */}
          <div className="flex items-center space-x-3">
            {/* UTC clock */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80 font-medium">
              <Clock className="h-3.5 w-3.5 text-[#0057A4]" />
              <span className="font-mono">Jun 25, 2026 - 1:02 AM</span>
            </div>

            {user ? (
              <div className="flex items-center space-x-3">
                {/* Connection Badge */}
                {accessToken === "mock_access_token_kagalwalla" || (accessToken && accessToken.startsWith("mock_")) ? (
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Demo mode using simulated legal mailboxes">
                    <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    <span>Demo Mailbox Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>Practice Connected</span>
                  </div>
                )}

                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800">{user.displayName || "Counsel Associate"}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
                </div>

                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Avatar"}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-[#0057A4]">
                    KW
                  </div>
                )}

                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-red-600 border border-slate-200 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                disabled={isLoggingIn}
                onClick={onLogin}
                className="gsi-material-button text-xs select-none transition"
                style={{ cursor: isLoggingIn ? "not-allowed" : "pointer" }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents text-slate-700 font-sans font-medium">
                    {isLoggingIn ? "Connecting..." : "Attorney Sign-In"}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Modes */}
      <div className="md:hidden flex space-x-1.5 bg-slate-50 p-2 border-t border-slate-200/80 justify-around">
        <button
          onClick={() => setActiveMode("run")}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider w-[45%] justify-center transition-all ${
            activeMode === "run"
              ? "bg-[#0057A4] text-white"
              : "text-slate-600"
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveMode("setup")}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider w-[45%] justify-center transition-all ${
            activeMode === "setup"
              ? "bg-[#0057A4] text-white"
              : "text-slate-600"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Setup</span>
        </button>
      </div>

      {/* Button styling */}
      <style>{`
        .gsi-material-button {
          -moz-user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
          -webkit-appearance: none;
          background-color: #ffffff;
          background-image: none;
          border: 1px solid #cbd5e1;
          -webkit-border-radius: 8px;
          border-radius: 8px;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
          color: #334155;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          height: 38px;
          letter-spacing: 0.15px;
          outline: none;
          overflow: hidden;
          padding: 0 16px;
          position: relative;
          text-align: center;
          transition: background-color .2s, border-color .2s;
          vertical-align: middle;
          white-space: nowrap;
          width: auto;
        }

        .gsi-material-button .gsi-material-button-icon {
          height: 18px;
          margin-right: 8px;
          min-width: 18px;
          width: 18px;
        }

        .gsi-material-button .gsi-material-button-content-wrapper {
          -webkit-align-items: center;
          align-items: center;
          display: flex;
          -webkit-flex-direction: row;
          flex-direction: row;
          -webkit-flex-wrap: nowrap;
          flex-wrap: nowrap;
          height: 100%;
          justify-content: space-between;
          position: relative;
          width: 100%;
        }

        .gsi-material-button .gsi-material-button-contents {
          -webkit-flex-grow: 1;
          flex-grow: 1;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 600;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
        }

        .gsi-material-button .gsi-material-button-state {
          -webkit-transition: opacity .15s linear;
          transition: opacity .15s linear;
          background-color: #cbd5e1;
          opacity: 0;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
        }

        .gsi-material-button:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
        }
      `}</style>
    </header>
  );
}
