import React, { useState } from "react";
import { Lock, Scale, Sparkles, ChevronRight, User, ArrowRight } from "lucide-react";

interface LoginViewProps {
  onLogin: (customUser?: { uid?: string; displayName: string; email: string }) => void;
  isLoggingIn: boolean;
}

const PRESET_TEST_USERS = [
  { 
    uid: "mock_attorney_adnan", 
    displayName: "Adnan Kagalwalla, Esq.", 
    email: "adnan@kagalwallalaw.com", 
    role: "Managing Partner" 
  },
  { 
    uid: "mock_paralegal_sarah", 
    displayName: "Sarah Jenkins", 
    email: "sarah.jenkins@kagalwallalaw.com", 
    role: "Senior Paralegal" 
  },
  { 
    uid: "mock_attorney_marcus", 
    displayName: "Marcus Vance, Esq.", 
    email: "marcus@kagalwallalaw.com", 
    role: "Closing Counsel" 
  },
];

export default function LoginView({ onLogin, isLoggingIn }: LoginViewProps) {
  const [showSandboxOptions, setShowSandboxOptions] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [useCustomAccount, setUseCustomAccount] = useState<boolean>(false);

  const handleCustomLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) {
      alert("Please provide both name and email for the custom sandbox mailbox.");
      return;
    }
    onLogin({
      uid: `mock_${customName.replace(/\s+/g, "_").toLowerCase()}`,
      displayName: customName.trim(),
      email: customEmail.trim(),
    });
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-400">
        
        {/* Minimal Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 rounded-full bg-[#0057A4]/10 text-[#0057A4] items-center justify-center shadow-xs">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans uppercase">
              Kagalwalla Law
            </h1>
            <p className="text-xs font-bold text-[#0057A4] uppercase tracking-widest font-mono mt-1">
              Triage & Escrow Compliance Vault
            </p>
          </div>
        </div>

        {/* Minimalist Authenticator Card */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Secure Stream Gateway
            </h2>
            <p className="text-xs text-slate-500">
              Establish high-precision mailbox monitoring & compliance guardrails.
            </p>
          </div>

          {/* Primary Action */}
          <button
            onClick={() => onLogin()}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center space-x-3 bg-[#0057A4] hover:bg-[#004685] disabled:bg-[#0057A4]/50 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 shadow-xs hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoggingIn ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.5 1.7l2.42-2.42C17.395 1.575 14.93 1 12.24 1 6.51 1 2 5.51 2 11.24s4.51 10.24 10.24 10.24c5.98 0 9.94-4.21 9.94-10.12 0-.61-.06-1.21-.17-1.78H12.24z" />
              </svg>
            )}
            <span className="text-xs uppercase tracking-wider">
              {isLoggingIn ? "Connecting Conduit..." : "Google Workspace Auth"}
            </span>
          </button>

          {/* Sandbox Switcher Drawer */}
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                Development Environment
              </span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {!showSandboxOptions ? (
              <button
                onClick={() => setShowSandboxOptions(true)}
                className="w-full mt-2 border border-slate-200 hover:border-[#0057A4] hover:bg-slate-50 text-[#0057A4] text-[11px] font-bold py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Access Interactive Practice Mailboxes</span>
              </button>
            ) : (
              <div className="mt-3 space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  {PRESET_TEST_USERS.map((item) => (
                    <button
                      key={item.uid}
                      onClick={() => onLogin({ uid: item.uid, displayName: item.displayName, email: item.email })}
                      className="w-full flex items-center justify-between p-3 text-left border border-slate-150 hover:border-[#0057A4] hover:bg-slate-50/80 rounded-xl transition group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-[#0057A4]/10 text-[#0057A4] flex items-center justify-center font-extrabold text-[9px] shrink-0 uppercase group-hover:bg-[#0057A4] group-hover:text-white transition">
                          {item.displayName.slice(0, 2)}
                        </div>
                        <div className="min-w-0 truncate">
                          <h4 className="text-[11px] font-bold text-slate-800 truncate">{item.displayName}</h4>
                          <p className="text-[9px] text-slate-400 font-mono truncate">{item.email}</p>
                        </div>
                      </div>
                      <span className="text-[8px] bg-slate-100 text-slate-500 font-bold uppercase px-1.5 py-0.5 rounded-sm shrink-0">
                        {item.role.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Mailbox Sub-Section */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setUseCustomAccount(!useCustomAccount)}
                    className="text-[10px] text-[#0057A4] font-bold hover:underline flex items-center space-x-1"
                  >
                    <span>{useCustomAccount ? "← Back to presets" : "+ Custom practice mailbox"}</span>
                  </button>

                  {useCustomAccount && (
                    <form onSubmit={handleCustomLoginSubmit} className="mt-2.5 space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold uppercase block">Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Marcus Vance, Esq."
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-[#0057A4]"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-400 font-bold uppercase block">Google Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. marcus@firm.com"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-mono focus:outline-none focus:border-[#0057A4]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full mt-1 bg-[#0057A4] hover:bg-[#004685] text-white text-[11px] font-bold py-2 rounded-lg transition"
                      >
                        Launch Custom Sandbox
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
