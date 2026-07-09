import React, { useState, useEffect } from "react";
import { SystemPromptConfig } from "../types";
import { AppUser } from "../types";
import { 
  ShieldAlert, Sparkles, AlertCircle, ArrowRight, ArrowLeft, 
  Check, CheckSquare, Square, Volume2, Briefcase, FileText, Clock,
  Home, FileLock, UserCheck, Inbox
} from "lucide-react";

interface SetupModeViewProps {
  user: AppUser | null;
  config: SystemPromptConfig | null;
  onConfigSaved: (newConfig: SystemPromptConfig) => void;
}

export default function SetupModeView({ user, config, onConfigSaved }: SetupModeViewProps) {
  const [step, setStep] = useState<number>(1);
  const [role, setRole] = useState<string>("");
  const [volume, setVolume] = useState<string>("");
  const [emailMix, setEmailMix] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [responsiveness, setResponsiveness] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Load existing configuration when the component mounts or config changes
  useEffect(() => {
    if (config) {
      setRole(config.role || "");
      setVolume(config.volume || "");
      setEmailMix(config.emailMix || []);
      setPainPoints(config.painPoints || []);
      setResponsiveness(config.responsiveness || "");
    }
  }, [config]);

  const toggleEmailMix = (item: string) => {
    setEmailMix(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const togglePainPoint = (item: string) => {
    setPainPoints(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    if (!user) {
      // Offline/sandbox local save
      const sandboxConfig: SystemPromptConfig = {
        role: role || "Real Estate & Estate Closing Attorney",
        volume: volume || "Medium (30 - 100 emails/day)",
        emailMix,
        painPoints,
        responsiveness,
        createdAt: new Date().toISOString()
      };
      onConfigSaved(sandboxConfig);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(6);
      }, 1500);
      return;
    }
    
    setIsSaving(true);
    const newConfig: SystemPromptConfig = {
      role,
      volume,
      emailMix,
      painPoints,
      responsiveness,
      createdAt: new Date().toISOString()
    };

    // Always persist to localStorage first so it's instantly available even offline
    try {
      localStorage.setItem(`systemConfig_${user.uid}`, JSON.stringify(newConfig));
    } catch (e) {
      console.warn("Could not save config to localStorage:", e);
    }


    // Call success handlers regardless of Firestore offline status (since local save succeeded)
    onConfigSaved(newConfig);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setStep(6); // System Design Proposal screen
    }, 1500);
    setIsSaving(false);
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return !!role;
      case 2: return !!volume;
      case 3: return emailMix.length > 0;
      case 4: return painPoints.length > 0;
      case 5: return !!responsiveness;
      default: return true;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0057A4] to-[#7F9498] px-6 py-10 text-white relative">
          <div className="absolute right-6 top-6 text-white opacity-10">
            <Sparkles className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <span className="text-slate-100 font-mono text-xs uppercase tracking-wider font-semibold bg-white/10 px-2.5 py-1 rounded-full">
              System Configuration
            </span>
            <h1 className="text-2xl font-sans font-bold mt-3 text-white">
              Practice Calibration & Guardrails
            </h1>
            <p className="text-slate-100 text-sm mt-2 max-w-xl font-sans leading-relaxed">
              Answer 5 professional questions to calibrate Kagalwalla Law Offices LLC systems for your estate planning client matters, title reviews, and transaction priorities.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {step <= 5 && (
          <div className="w-full bg-slate-100 h-1.5 flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-full flex-1 transition-all duration-300 ${
                  s <= step ? "bg-[#0057A4]" : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        )}

        <div className="p-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
              <h2 className="text-xl font-sans font-bold text-slate-900">Practice Calibrated!</h2>
              <p className="text-slate-500 text-sm mt-2">Saving configuration to local workspace preferences...</p>
            </div>
          ) : (
            <>
              {/* Question 1: Practice Area */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center space-x-2">
                      <Briefcase className="h-5 w-5 text-[#0057A4]" />
                      <span>Step 1 of 5: What is your primary legal practice or partner role?</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">This tunes the classification vocabulary and real estate matter detection patterns.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {[
                      { id: "realestate", title: "Real Estate Law & Closing Partner", desc: "Escrow deadlines, TRID disclosures, contractual contingencies, title objections" },
                      { id: "estateplanning", title: "Estate Planning & Probate Advisor", desc: "Wills, trusts, estate administration, legacy preservation files, healthcare directives" },
                      { id: "commercialre", title: "Commercial Property & Zoning Counsel", desc: "Commercial leases, NNN redlines, development variances, municipal permits" },
                      { id: "generalpractice", title: "General Practice (Real Estate Focus)", desc: "Mixed estate filings, title commitment summaries, trust asset assignments" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setRole(item.title)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          role === item.title
                            ? "bg-[#0057A4]/5 border-[#0057A4] shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <h3 className="font-sans font-bold text-sm text-slate-800">{item.title}</h3>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Or Custom Role/Practice Definition:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Residential Settlement Officer, Trust & Wealth Counsel..."
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0057A4]"
                    />
                  </div>
                </div>
              )}

              {/* Question 2: Inbox Volume */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-[#0057A4]" />
                      <span>Step 2 of 5: What is your typical transaction and caseload volume?</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">This sets noise-filtering sensitivities for MLS emails and real estate notifications.</p>
                  </div>

                  <div className="space-y-2 mt-4">
                    {[
                      { label: "Low Volume Portfolio", desc: "0 - 30 emails per day. Highly targeted estate legacy files.", value: "Low (< 30 emails/day)" },
                      { label: "Moderate Caseload", desc: "30 - 100 emails per day. Standard local closings, requires diligent oversight.", value: "Medium (30 - 100 emails/day)" },
                      { label: "High Volume Pipeline", desc: "100 - 300 emails per day. Rapid real estate closings, MLS sweeps, and multiple transactions.", value: "High (100 - 300 emails/day)" }
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setVolume(item.value)}
                        className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-all ${
                          volume === item.value
                            ? "bg-[#0057A4]/5 border-[#0057A4] shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <h3 className="font-sans font-bold text-sm text-slate-800">{item.label}</h3>
                          <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                        </div>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                          {item.value.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 3: Email Mix */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-[#0057A4]" />
                      <span>Step 3 of 5: What is your primary incoming document and mail mix?</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">Select all that apply to calibrate real estate matter rules.</p>
                  </div>

                  <div className="space-y-2 mt-4">
                    {[
                      "Client inquiries, estate assets, and inheritance charts",
                      "Official title commitments, ALTA surveys, and deed filings",
                      "Purchase and sale contracts, escrow deposit slips, and TRID disclosures",
                      "MLS bulletins, market valuations, and local zoning updates",
                      "Trustee assignments, health proxies, and final will codicils"
                    ].map((item) => {
                      const isSelected = emailMix.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleEmailMix(item)}
                          className={`w-full text-left p-3.5 rounded-xl border flex items-center space-x-3 transition-all ${
                            isSelected
                              ? "bg-[#0057A4]/10 border-[#0057A4] shadow-sm"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-[#0057A4] shrink-0" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-300 shrink-0" />
                          )}
                          <span className="text-sm text-slate-700">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question 4: Pain Points */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center space-x-2">
                      <ShieldAlert className="h-5 w-5 text-[#0057A4]" />
                      <span>Step 4 of 5: What are your primary operational risk areas?</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">We optimize critical warnings and flags around these high-risk areas.</p>
                  </div>

                  <div className="space-y-2 mt-4">
                    {[
                      "Missing critical contract contingency dates or closing escrow deadlines",
                      "Failing to identify and isolate attorney-client privileged communications",
                      "Drowning in realtor newsletters, title spam, and MLS updates",
                      "Losing track of earnest money deposits and mortgage contingency terms",
                      "Overlooking changes to family estates, trusts, or probate filings",
                      "Delays in executing critical healthcare directives or power of attorney"
                    ].map((item) => {
                      const isSelected = painPoints.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => togglePainPoint(item)}
                          className={`w-full text-left p-3.5 rounded-xl border flex items-center space-x-3 transition-all ${
                            isSelected
                              ? "bg-[#0057A4]/10 border-[#0057A4] shadow-sm"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-[#0057A4] shrink-0" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-300 shrink-0" />
                          )}
                          <span className="text-sm text-slate-700">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question 5: Responsiveness */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-[#0057A4]" />
                      <span>Step 5 of 5: What are your firm's client responsiveness standards?</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">This sets the timer benchmarks and reminders for your transaction drafting workflows.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 mt-4">
                    {[
                      { title: "Immediate Partner Response", val: "Immediate Response Required (< 2 Hours)", desc: "Requires instant alerts and rapid draft generations for active closing files." },
                      { title: "Same-Day Business Closure", val: "Same-Day Business Closure (< 8 Hours)", desc: "All title and escrow files must have a draft response prepared by evening closure." },
                      { title: "Standard Turnaround", val: "Standard Professional Turnaround (24 - 48 Hours)", desc: "Balanced cadence. Estate planning files and drafts generated within 24 hours." },
                      { title: "Flexible Cadence", val: "Flexible / Client-Paced", desc: "No severe timers. System functions primarily to summarize case developments." }
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => setResponsiveness(item.val)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          responsiveness === item.val
                            ? "bg-[#0057A4]/5 border-[#0057A4] shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <h3 className="font-sans font-bold text-sm text-slate-800">{item.title}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: System Design Summary */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-xs bg-[#0057A4]/10 text-[#0057A4] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Active Calibration System Design
                    </span>
                    <h2 className="text-xl font-sans font-bold text-slate-900 mt-2">
                      Kagalwalla LLC System Design Proposal
                    </h2>
                    <p className="text-slate-500 text-xs">
                      Below is your customized real estate and estate planning workspace architectural framework.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Block 1: Labels */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                      <h3 className="text-sm font-bold text-[#0057A4] uppercase tracking-wider font-sans">
                        1. Active Classification Labels
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 text-xs text-slate-600 font-mono">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>Matter: [Client/Case]</span>
                          <span className="text-[10px] text-[#0057A4] font-semibold">Client Matter</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>Kagalwalla/Closing-Deadlines</span>
                          <span className="text-[10px] text-red-600 font-semibold">Strict Escrow</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>Kagalwalla/Estate-Planning</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">Trust & Wills</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>Kagalwalla/MLS-Archive</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Archived Market</span>
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Filters */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                      <h3 className="text-sm font-bold text-[#0057A4] uppercase tracking-wider font-sans">
                        2. AI Filter & Triage Rules
                      </h3>
                      <ul className="list-disc list-inside text-xs text-slate-600 mt-2 space-y-1.5 leading-relaxed font-sans">
                        <li>
                          <strong>Auto-Archive</strong>: Incoming items tagged as MLS advertisements or generic real estate listings bypass the Inbox and route directly to <code>Kagalwalla/MLS-Archive</code>.
                        </li>
                        <li>
                          <strong>Estate & Trust Privilege</strong>: Any email exchange referencing estate planning drafts, asset assignments, or containing client-sensitive asset statements receives the <code>Kagalwalla/Estate-Planning</code> label automatically.
                        </li>
                        <li>
                          <strong>Escrow Deadline Alarm</strong>: Closing files and notices from bank domains or escrow officers containing date expressions acquire high-visibility alerts.
                        </li>
                      </ul>
                    </div>

                    {/* Block 3: Timing */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                      <h3 className="text-sm font-bold text-[#0057A4] uppercase tracking-wider font-sans">
                        3. Response Timers & Tasks Integration
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans mt-2">
                        Based on your standard preference (<strong>{responsiveness || "Same-Day Business Closure"}</strong>), 
                        the real estate dashboard countdowns hours for escrow responses, pre-populates task forms with calculated due-dates, and proposes structured docket entries for calendar imports.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#0057A4]/10 p-2 rounded-lg text-[#0057A4] border border-[#0057A4]/20">
                        <ShieldAlert className="h-5 w-5 text-[#0057A4]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0057A4]">Professional Guard Active</h4>
                        <p className="text-[10px] text-slate-400">All responses and actions are vetted to protect client confidentiality and escrow compliance.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-8">
                {step > 1 && step <= 5 ? (
                  <button
                    onClick={() => setStep(prev => prev - 1)}
                    className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-sm font-sans font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <button
                    disabled={!isStepValid()}
                    onClick={() => setStep(prev => prev + 1)}
                    className={`flex items-center space-x-1 px-5 py-2.5 rounded-lg text-sm font-sans font-semibold transition ${
                      isStepValid()
                        ? "bg-[#0057A4] text-white hover:bg-[#004685]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : step === 5 ? (
                  <button
                    disabled={isSaving || !isStepValid()}
                    onClick={handleSave}
                    className="bg-[#0057A4] text-white font-sans font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#004685] transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <span>{isSaving ? "Saving Config..." : "Calibrate & Save"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(1)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-xs font-semibold border border-slate-200 transition"
                  >
                    Re-tune Calibration Questionnaire
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
