import React, { useState, useEffect } from "react";
import { AppUser, SystemPromptConfig } from "./types";
import { getCurrentUser, startGoogleLogin, backendLogout } from "./lib/backendAuth";
import Header from "./components/Header";
import RunModeView from "./components/RunModeView";
import SetupModeView from "./components/SetupModeView";
import LoginView from "./components/LoginView";
import { Scale } from "lucide-react";

const MOCK_ACCOUNTS = [
  { uid: "mock_attorney_adnan", displayName: "Adnan Kagalwalla, Esq.", email: "adnan@kagalwallalaw.com", role: "Managing Partner" },
  { uid: "mock_paralegal_sarah", displayName: "Sarah Jenkins", email: "sarah.jenkins@kagalwallalaw.com", role: "Senior Paralegal" },
  { uid: "mock_attorney_marcus", displayName: "Marcus Vance, Esq.", email: "marcus@kagalwallalaw.com", role: "Closing Counsel" },
];

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<"run" | "setup">("run");
  const [config, setConfig] = useState<SystemPromptConfig | null>(null);

  // Mock Account Selector Modal States
  const [showAccountChooser, setShowAccountChooser] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [useCustomAccount, setUseCustomAccount] = useState<boolean>(false);

  // Initialize backend-owned Google OAuth session on app load
  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((currentUser) => {
        if (cancelled) return;
        setUser(currentUser);
        setAccessToken(currentUser ? "backend_session" : null);
        setNeedsAuth(!currentUser);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load user configuration from localStorage. Backend owns auth/tokens.
  useEffect(() => {
    const defaultConfig: SystemPromptConfig = {
        role: "Real Estate Law & Closing Partner",
        volume: "Medium (30 - 100 emails/day)",
        emailMix: [
          "Client inquiries, escrow files, and closing disclosures",
          "Official title objections, surveys, and deed filings",
          "Commercial lease negotiations, NNN redlines, and contract releases"
        ],
        painPoints: [
          "Missing critical closing deadlines or contractual contingency windows",
          "Failing to identify and isolate attorney-client privileged strings"
        ],
        responsiveness: "Same-Day Business Closure (< 8 Hours)"
      };

    if (!user) {
      setConfig(defaultConfig);
      return;
    }

    const cachedConfig = localStorage.getItem(`systemConfig_${user.uid}`);
    if (cachedConfig) {
      try {
        setConfig(JSON.parse(cachedConfig) as SystemPromptConfig);
        return;
      } catch (e) {
        console.warn("Invalid cached config in localStorage", e);
      }
    }

    setConfig(defaultConfig);
    localStorage.setItem(`systemConfig_${user.uid}`, JSON.stringify(defaultConfig));
  }, [user]);

  const handleLogin = async (customUser?: { uid?: string; displayName: string; email: string }) => {
    setIsLoggingIn(true);

    if (customUser) {
      const mockUser: AppUser = {
        uid: customUser.uid || `mock_${Date.now()}`,
        displayName: customUser.displayName,
        email: customUser.email,
        photoURL: null,
      };
      setUser(mockUser);
      setAccessToken("mock_access_token_kagalwalla");
      setNeedsAuth(false);
      setIsLoggingIn(false);
      return;
    }

    startGoogleLogin();
  };

  const triggerLoginFlow = async () => {
    await handleLogin();
  };

  const handleLogout = async () => {
    try {
      await backendLogout();
    } catch (err: any) {
      console.log("Logout status info:", err?.message || err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
    }
  };

  const handleConfigSaved = (newConfig: SystemPromptConfig) => {
    setConfig(newConfig);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0a1e36] text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <Scale className="h-10 w-10 text-blue-400 animate-spin" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Kagalwalla Law Offices</h2>
          <p className="text-xs text-slate-400">Verifying secure compliance tokens & credentials...</p>
        </div>
      </div>
    );
  }

  if (needsAuth || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <LoginView onLogin={handleLogin} isLoggingIn={isLoggingIn} />
        
        <footer className="bg-slate-50 border-t border-slate-200 py-8 text-center text-slate-500 text-xs shadow-inner">
          <p className="font-sans font-medium text-slate-600">
            &copy; 2026 Kagalwalla Law Offices LLC. All rights reserved. Real Estate Transaction and Legacy Counsel.
          </p>
          <p className="mt-1.5 text-[11px] font-sans text-slate-400">
            All client files, documents, and disclosures comply with the Federal Rules of Evidence and privilege-preservation standards.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        user={user}
        accessToken={accessToken}
        needsAuth={needsAuth}
        isLoggingIn={isLoggingIn}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        onLogin={triggerLoginFlow}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activeMode === "run" ? (
          <RunModeView
            user={user}
            accessToken={accessToken}
            config={config}
            needsAuth={needsAuth}
            onTriggerLogin={triggerLoginFlow}
            onTriggerLogout={handleLogout}
          />
        ) : (
          <SetupModeView
            user={user}
            config={config}
            onConfigSaved={handleConfigSaved}
          />
        )}
      </main>

      {/* Google Account Selector Dialog (Sandbox Mode Only) */}
      {showAccountChooser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full animate-in fade-in duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-[#0057A4] uppercase tracking-wider flex items-center space-x-1.5">
                  <span>Google Sandbox Connection</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Select a practice mailbox to simulate live compliance triage, or connect a custom testing account.
                </p>
              </div>
              <button
                onClick={() => setShowAccountChooser(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-md transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 mt-4">
              {MOCK_ACCOUNTS.map((account) => (
                <button
                  key={account.uid}
                  onClick={() => {
                    handleLogin(account);
                    setShowAccountChooser(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#0057A4] hover:bg-slate-50 transition text-left"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-[#0057A4]/10 text-[#0057A4] flex items-center justify-center font-extrabold text-xs shrink-0 uppercase">
                      {account.displayName.slice(0, 2)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800">{account.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{account.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                    {account.role.split(" ")[0]}
                  </span>
                </button>
              ))}

              <div className="border-t border-slate-100 pt-3">
                <button
                  onClick={() => {
                    setUseCustomAccount(!useCustomAccount);
                  }}
                  className="text-xs font-semibold text-[#0057A4] hover:underline flex items-center space-x-1"
                >
                  <span>{useCustomAccount ? "← Back to presets" : "+ Connect another testing account"}</span>
                </button>

                {useCustomAccount && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold uppercase block">Attorney / Associate Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Marcus Vance, Esq."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold uppercase block">Google Workspace Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. marcus@firm.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-mono"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!customName.trim() || !customEmail.trim()) {
                          alert("Please fill in both name and email for the custom account.");
                          return;
                        }
                        handleLogin({
                          uid: `mock_${customName.replace(/\s+/g, "_").toLowerCase()}`,
                          displayName: customName.trim(),
                          email: customEmail.trim(),
                        });
                        setShowAccountChooser(false);
                      }}
                      className="w-full bg-[#0057A4] hover:bg-[#004685] text-white py-2 rounded-lg text-xs font-semibold transition"
                    >
                      Connect Custom Mailbox
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-slate-50 border-t border-slate-200 py-8 text-center text-slate-500 text-xs shadow-inner">
        <p className="font-sans font-medium text-slate-600">
          &copy; 2026 Kagalwalla Law Offices LLC. All rights reserved. Real Estate Transaction and Legacy Counsel.
        </p>
        <p className="mt-1.5 text-[11px] font-sans text-slate-400">
          All client files, documents, and disclosures comply with the Federal Rules of Evidence and privilege-preservation standards.
        </p>
      </footer>
    </div>
  );
}
