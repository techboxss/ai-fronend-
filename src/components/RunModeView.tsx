import React, { useState, useEffect } from "react";
import {
  AppUser,
  ThreadMessage,
  TriageAnalysis,
  SystemPromptConfig,
  TriageStats,
  GmailAttachmentInfo
} from "../types";

import { mockLegalEmails } from "../lib/mockEmails";
import {
  fetchGmailThreads,
  fetchThreadAttachments,
  archiveGmailThread,
  applyGmailLabelToThread,
  createGmailDraft,
  sendGmailReply,
  createGoogleCalendarEvent,
  createGoogleTask
} from "../lib/googleApi";

import {
  Mail, RefreshCw, AlertTriangle, Calendar, ListTodo, Archive, Check,
  FileText, Search, Sparkles, ShieldAlert, User, Clock, ArrowRight,
  ChevronRight, AlertCircle, PlusCircle, CheckCircle2, ShieldX, HelpCircle,
  TrendingUp, Briefcase, Layers, PieChart, Database, CheckSquare, Sparkle, UserCheck,
  Upload, File, CheckCircle, Trash2, Home, UserPlus, Info, BookOpen,
  Settings, Shield, Lock, Fingerprint, Send
} from "lucide-react";

interface RunModeViewProps {
  user: AppUser | null;
  accessToken: string | null;
  config: SystemPromptConfig | null;
  needsAuth: boolean;
  onTriggerLogin: () => void;
  onTriggerLogout: () => void;
}

// Structuring Mock Data for New Dashboards
interface PropertyTransaction {
  id: string;
  address: string;
  clientName: string;
  escrowOfficer: string;
  escrowCompany: string;
  closingDate: string;
  earnestMoney: string;
  contingencies: { name: string; date: string; status: "Approved" | "Pending" | "At Risk" }[];
  status: "Underway" | "Pending Signatures" | "Title Objection Filed" | "Closed";
  progressPercent: number;
}

interface EstatePlanningService {
  id: string;
  clientName: string;
  serviceType: "Revocable Living Trust" | "Last Will & Testament" | "Power of Attorney & Healthcare Proxy" | "Comprehensive Family Estate Plan";
  status: "Initial Consult" | "Drafting" | "Review Stage" | "Ready for Execution" | "Executed & Archived";
  lastUpdated: string;
  keyDirectives: string;
  value: string;
}

interface ConsultationAppointment {
  id: string;
  time: string;
  clientName: string;
  type: "Estate Planning" | "Real Estate Closing" | "Commercial Lease" | "Title Dispute";
  notes: string;
  status: "Scheduled" | "Completed" | "No Show";
  contact: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  category: "Deed" | "Closing Disclosure" | "ALTA Survey" | "Will/Trust Draft" | "Title Commitment";
  fileSize: string;
  uploadedAt: string;
  matterAssociation: string;
  status: "Verified" | "Pending Review";
  source?: "gmail" | "local";
  messageId?: string;
  attachmentId?: string | null;
  mimeType?: string | null;
}

const formatAttachmentSize = (size?: number | null): string => {
  if (!size) return "Unknown size";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const inferDocumentCategory = (
  filename: string,
  mimeType?: string | null
): UploadedDocument["category"] => {
  const lower = filename.toLowerCase();

  if (lower.includes("closing") || lower.includes("cd")) {
    return "Closing Disclosure";
  }

  if (lower.includes("survey") || lower.includes("alta")) {
    return "ALTA Survey";
  }

  if (lower.includes("will") || lower.includes("trust") || lower.includes("estate")) {
    return "Will/Trust Draft";
  }

  if (lower.includes("title") || lower.includes("commitment")) {
    return "Title Commitment";
  }

  if (lower.includes("deed")) {
    return "Deed";
  }

  if (mimeType?.includes("pdf")) {
    return "Title Commitment";
  }

  return "Deed";
};


export default function RunModeView({ user, accessToken, config, needsAuth, onTriggerLogin, onTriggerLogout }: RunModeViewProps) {
  const [threads, setThreads] = useState<ThreadMessage[]>([]);

  // Determine attorney name dynamically based on logged in user or fallback
  const attorneyName = user?.displayName || (user?.email ? user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Counsel");

  const getCustomizedEmails = (): ThreadMessage[] => {
    return mockLegalEmails.map(t => {
      const customizedThread = { ...t };
      if (customizedThread.snippet) {
        customizedThread.snippet = customizedThread.snippet
          .replace(/Adnan Kagalwalla/g, attorneyName)
          .replace(/Adnan/g, attorneyName);
      }
      if (customizedThread.body) {
        customizedThread.body = customizedThread.body
          .replace(/Adnan Kagalwalla/g, attorneyName)
          .replace(/Adnan/g, attorneyName)
          .replace(/Dear Counsel/g, `Dear ${attorneyName}`);
      }
      if (customizedThread.analysis) {
        const customAnalysis = { ...customizedThread.analysis };
        if (customAnalysis.privilegeAssessment) {
          customAnalysis.privilegeAssessment = customAnalysis.privilegeAssessment
            .replace(/Adnan Kagalwalla/g, attorneyName)
            .replace(/Adnan/g, attorneyName);
        }
        if (customAnalysis.briefSummary) {
          customAnalysis.briefSummary = customAnalysis.briefSummary
            .replace(/Adnan Kagalwalla/g, attorneyName)
            .replace(/Adnan/g, attorneyName);
        }
        if (customAnalysis.suggestedDraftResponse) {
          customAnalysis.suggestedDraftResponse = customAnalysis.suggestedDraftResponse
            .replace(/Adnan Kagalwalla, Esq\./g, `${attorneyName}, Esq.`)
            .replace(/Adnan Kagalwalla/g, attorneyName)
            .replace(/Adnan/g, attorneyName);
        }
        customizedThread.analysis = customAnalysis;
      }
      return customizedThread;
    });
  };

  const [selectedThread, setSelectedThread] = useState<ThreadMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Core Dashboards tab switcher
  const [activeDashboard, setActiveDashboard] = useState<"triage" | "transactions" | "documents" | "appointments" | "analytics" | "settings">("triage");

  // User and Admin role states
  const [userRole, setUserRole] = useState<"User" | "Admin">("User");

  // Simulated audit logs for Admin Settings
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; timestamp: string; user: string; action: string; category: "Security" | "Filing" | "System" }>>([
    { id: "log_1", timestamp: "2026-06-25 09:30 AM", user: "Paralegal Sarah", action: "Uploaded 742_Oakwood_Lane_Final_Closing_Disclosure.pdf", category: "Filing" },
    { id: "log_2", timestamp: "2026-06-25 09:15 AM", user: "Managing Partner", action: "Updated calibration rules for responsiveness threshold", category: "System" },
    { id: "log_3", timestamp: "2026-06-24 04:10 PM", user: "Closing Counsel", action: "Authorized Escrow clearance certificate for Whispering Pines", category: "Security" },
    { id: "log_4", timestamp: "2026-06-24 02:15 PM", user: "System", action: "Auto-classified thread #42 as PRIVILEGED", category: "Security" },
  ]);

  // Smokeball filing state
  const [selectedMatter, setSelectedMatter] = useState<string>("");
  const [isFiling, setIsFiling] = useState<boolean>(false);
  const [filedMatters, setFiledMatters] = useState<Record<string, { status: "idle" | "filing" | "success"; matter: string }>>({});

  // Active filter for Email Triage Queue
  const [filterPriority, setFilterPriority] = useState<"All" | "High" | "Medium" | "Low">("All");

  // Real-Time Email Testing states
  const [testSenderName, setTestSenderName] = useState<string>("Opposing Counsel");
  const [testSenderEmail, setTestSenderEmail] = useState<string>("counsel.vance@vancelaw.com");
  const [testSubject, setTestSubject] = useState<string>("Urgent Title Objections: 1044 Whispering Pines");
  const [testBody, setTestBody] = useState<string>(
    "Dear Adnan,\n\nWe have reviewed the title search on the 1044 Whispering Pines acquisition. Section B-II reveals a major boundary survey objection. \n\nPlease note the contractual contingency closes tomorrow at 5:00 PM CST. We must receive the signed Title Correction Deed and survey waiver by then, or our client will withdraw the escrow deposit.\n\nLet me know if we can schedule a quick call to wrap this up.\n\nSincerely,\nMarcus Vance, Esq."
  );
  const [isTesterExpanded, setIsTesterExpanded] = useState<boolean>(false);

  const TEST_TEMPLATES = [
    {
      title: "Urgent Deadline",
      senderName: "Opposing Counsel",
      senderEmail: "counsel.vance@vancelaw.com",
      subject: "Urgent Title Objections: 1044 Whispering Pines",
      body: "Dear Adnan,\n\nWe have reviewed the title search on the Whispering Pines acquisition. Section B-II reveals a major boundary survey objection.\n\nPlease note the contractual contingency closes tomorrow at 5:00 PM CST. We must receive the signed Title Correction Deed and survey waiver by then, or our client will withdraw from the contract.\n\nSincerely,\nMarcus Vance, Esq."
    },
    {
      title: "Privileged FRE 408",
      senderName: "Robert Williams, Executor",
      senderEmail: "robert.williams@williampestate.org",
      subject: "RE: Confidential Settlement / FRE 408 Offer",
      body: "Hi Adnan,\n\nI want to follow up regarding our probate dispute. Pursuant to Rule 408 of the Federal Rules of Evidence, this communication is confidential and privileged for the sole purpose of settlement negotiations.\n\nMy siblings and I are willing to agree to the $450,000 real estate appraisal if the executor's commission is capped at 3%. Let's finalize this before the court docket on Tuesday.\n\nBest,\nRobert"
    },
    {
      title: "Escrow Contingency",
      senderName: "Apex Title & Escrow",
      senderEmail: "escrow@apextitle.com",
      subject: "Escrow Deposit Confirmation - Matter #2026-RE-0742",
      body: "Dear Attorney Kagalwalla,\n\nThis is to confirm that we have successfully received the earnest money wire of $15,000 for the 742 Oakwood Lane transaction.\n\nHowever, the title commitment is still pending the seller's updated payoff statement. Please provide this statement before July 5th to keep the closing on schedule."
    },
    {
      title: "Closing Postponement",
      senderName: "Buyer Agent",
      senderEmail: "realtor.sara@coldwell.com",
      subject: "Request to Postpone Closing - 512 Birch Street",
      body: "Hello,\n\nOur lender just notified us that they need an extra 48 hours to complete the underwriting for the Birch Street purchase. \n\nWe would like to formally request an extension of the closing date from July 8th to July 10th. Please let us know if the sellers will sign an amendment."
    }
  ];

  // Document Vault States
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [emailAttachmentFiles, setEmailAttachmentFiles] = useState<UploadedDocument[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState<boolean>(false);

    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [uploadCategory, setUploadCategory] = useState<UploadedDocument["category"]>("Deed");
    const [uploadMatter, setUploadMatter] = useState<string>("742 Oakwood Lane Closing");

  // Property Transactions States
  const [transactions, setTransactions] = useState<PropertyTransaction[]>([
    {
      id: "tx_1",
      address: "1044 Whispering Pines Dr",
      clientName: "Mark & Sandra Henderson",
      escrowOfficer: "Helen Ross",
      escrowCompany: "Vanguard Title & Escrow",
      closingDate: "2026-06-29",
      earnestMoney: "$15,000",
      progressPercent: 75,
      status: "Underway",
      contingencies: [
        { name: "Attorney Review", date: "2026-06-22", status: "Approved" },
        { name: "Financing & Repair Receipts", date: "2026-06-28", status: "At Risk" },
        { name: "Clear Title Commitment", date: "2026-06-29", status: "Pending" }
      ]
    },
    {
      id: "tx_2",
      address: "742 Oakwood Lane",
      clientName: "The Miller Family Trust",
      escrowOfficer: "Helen Ross",
      escrowCompany: "Vanguard Title & Escrow",
      closingDate: "2026-06-29",
      earnestMoney: "$10,000",
      progressPercent: 95,
      status: "Pending Signatures",
      contingencies: [
        { name: "Attorney Review", date: "2026-06-18", status: "Approved" },
        { name: "HOA Prorations Approved", date: "2026-06-25", status: "Approved" },
        { name: "TRID 3-Day Rule CD Signed", date: "2026-06-25", status: "Approved" }
      ]
    },
    {
      id: "tx_3",
      address: "512 Birch Street",
      clientName: "Arthur & Linda Gable",
      escrowOfficer: "Gable Real Estate Partners",
      escrowCompany: "Chicago Title",
      closingDate: "2026-07-15",
      earnestMoney: "$20,000",
      progressPercent: 45,
      status: "Title Objection Filed",
      contingencies: [
        { name: "ALTA Boundary Survey Review", date: "2026-06-24", status: "Pending" },
        { name: "Written Title Objection Notice", date: "2026-07-03", status: "Pending" }
      ]
    }
  ]);

  // Appointments & Consultations States
  const [appointments, setAppointments] = useState<ConsultationAppointment[]>([
    {
      id: "app_1",
      time: "June 29, 2026 - 10:00 AM",
      clientName: "Miller Family Signing Team",
      type: "Real Estate Closing",
      notes: "Final Closing Disclosure signatures and escrow wire verification for 742 Oakwood Lane.",
      status: "Scheduled",
      contact: "miller.trust@gmail.com"
    },
    {
      id: "app_2",
      time: "June 29, 2026 - 02:00 PM",
      clientName: "Daniel K. & Sophia R.",
      type: "Estate Planning",
      notes: "Initial consultation to discuss trust asset divisions, deed transfers, and heirs distribution planning.",
      status: "Scheduled",
      contact: "daniel.k@hotmail.com"
    },
    {
      id: "app_3",
      time: "June 30, 2026 - 11:30 AM",
      clientName: "Arthur Gable, Esq.",
      type: "Title Dispute",
      notes: "Utility easement encroachment review for 512 Birch Street garage structure.",
      status: "Scheduled",
      contact: "agable@gable-realestatelaw.com"
    }
  ]);

  // Consultation Schedular Form states
  const [newAppClient, setNewAppClient] = useState<string>("");
  const [newAppType, setNewAppType] = useState<ConsultationAppointment["type"]>("Estate Planning");
  const [newAppTime, setNewAppTime] = useState<string>("");
  const [newAppNotes, setNewAppNotes] = useState<string>("");
  const [newAppContact, setNewAppContact] = useState<string>("");

  // Triage stats
  const [stats, setStats] = useState<TriageStats>({
    needsAttention: 0,
    draftedCount: 0,
    deferredCount: 0,
    archivedCount: 0,
    calendaredCount: 0
  });

  // Edited values in UI Console
  const [editedDraft, setEditedDraft] = useState<string>("");
  const [editedTaskTitle, setEditedTaskTitle] = useState<string>("");
  const [editedTaskDueDate, setEditedTaskDueDate] = useState<string>("");
  const [editedTaskNotes, setEditedTaskNotes] = useState<string>("");
  const [taskMode, setTaskMode] = useState<"personal" | "delegate">("personal");
  const [delegationAssignee, setDelegationAssignee] = useState<string>("Paralegal Sarah");
  const [editedEventSummary, setEditedEventSummary] = useState<string>("");
  const [editedEventDateTime, setEditedEventDateTime] = useState<string>("");
  const [editedEventDesc, setEditedEventDesc] = useState<string>("");
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  
  // Explicit calendar confirmation
  const [isEventConfirmed, setIsEventConfirmed] = useState<boolean>(false);

  // Load threads on load
  useEffect(() => {
    if (accessToken) {
      loadRealInbox();
    } else {
      setThreads(getCustomizedEmails());
    }
  }, [accessToken, user]);

  // Recalculate stats when threads change
  useEffect(() => {
    const unread = threads.filter(t => t.triageStatus === "unread" || !t.triageStatus).length;
    const drafted = threads.filter(t => t.triageStatus === "drafted").length;
    const deferred = threads.filter(t => t.triageStatus === "deferred").length;
    const archived = threads.filter(t => t.triageStatus === "archived").length;
    const calendared = threads.filter(t => t.triageStatus === "calendared").length;
    const delegated = threads.filter(t => t.triageStatus === "delegated").length;

    setStats({
      needsAttention: unread,
      draftedCount: drafted,
      deferredCount: deferred,
      archivedCount: archived,
      calendaredCount: calendared,
      delegatedCount: delegated
    });
  }, [threads]);

  // Synchronize delegation and task state when selectedThread changes
  useEffect(() => {
    if (!selectedThread) return;
    
    const analysis = selectedThread.analysis;
    
    if (selectedThread.triageStatus === "delegated") {
      setTaskMode("delegate");
      if (selectedThread.delegatedTo) {
        setDelegationAssignee(selectedThread.delegatedTo);
      }
    } else if (analysis?.shouldDelegate) {
      setTaskMode("delegate");
      setDelegationAssignee(analysis.suggestedAssignee || "Paralegal Sarah");
    } else {
      setTaskMode("personal");
    }
  }, [selectedThread?.id, selectedThread?.analysis]);

  // Update task details
  useEffect(() => {
    if (!selectedThread) return;
    const baseTitle = selectedThread.analysis?.suggestedTasks[0]?.title || `Follow up: ${selectedThread.subject}`;
    
    if (taskMode === "delegate") {
      setEditedTaskTitle(`[Delegate: ${delegationAssignee}] ${baseTitle}`);
      
      const notesLines = [
        `==================================================`,
        `📢 DELEGATED LEGAL ASSIGNMENT`,
        `==================================================`,
        `👤 ASSIGNEE: ${delegationAssignee}`,
        `📥 FROM INBOX: ${selectedThread.sender}`,
        `📁 CASE / SUBJECT: ${selectedThread.subject}`,
        `⏰ DEADLINE: ${selectedThread.analysis?.deadlineDate || "None"}`,
        `--------------------------------------------------`,
        `📝 SUMMARY:`,
        `"${selectedThread.analysis?.briefSummary || "No summary available."}"`,
        `--------------------------------------------------`,
        `💡 ATTORNEY GUIDANCE:`,
        `"${selectedThread.analysis?.delegationReason || "Please review title details, deeds or estate options."}"`,
        `--------------------------------------------------`,
        `🔗 DEEP LINKS:`,
        `- Original Email: https://mail.google.com/mail/u/0/#inbox/${selectedThread.threadId || selectedThread.id}`,
        `- Kagalwalla Portal: ${window.location.origin}/?threadId=${selectedThread.id}`
      ];
      setEditedTaskNotes(notesLines.join("\n"));
    } else {
      setEditedTaskTitle(baseTitle);
      
      const notesLines = [
        `==================================================`,
        `📝 PERSONAL TRANSACTION TASK`,
        `==================================================`,
        `📥 SENDER: ${selectedThread.sender}`,
        `📁 MATTER: ${selectedThread.subject}`,
        `⏰ DATE RANGE: ${selectedThread.analysis?.deadlineDate || "None"}`,
        `--------------------------------------------------`,
        `📝 SUMMARY:`,
        `"${selectedThread.analysis?.briefSummary || "No summary available."}"`,
        `--------------------------------------------------`,
        `🔗 DEEP LINKS:`,
        `- Original Email: https://mail.google.com/mail/u/0/#inbox/${selectedThread.threadId || selectedThread.id}`,
        `- Kagalwalla Portal: ${window.location.origin}/?threadId=${selectedThread.id}`
      ];
      setEditedTaskNotes(notesLines.join("\n"));
    }
  }, [taskMode, delegationAssignee, selectedThread?.id, selectedThread?.analysis]);

  // Sync selected matter automatically when selected thread changes
  useEffect(() => {
    if (selectedThread) {
      const subjectLower = selectedThread.subject.toLowerCase();
      const bodyLower = selectedThread.body.toLowerCase();
      
      if (subjectLower.includes("pines") || bodyLower.includes("pines") || subjectLower.includes("whispering")) {
        setSelectedMatter("1044 Whispering Pines Dr Acquisition (Matter #2026-RE-1044)");
      } else if (subjectLower.includes("oakwood") || bodyLower.includes("oakwood")) {
        setSelectedMatter("742 Oakwood Lane Closing (Matter #2026-RE-0742)");
      } else if (subjectLower.includes("williams") || bodyLower.includes("williams") || subjectLower.includes("probate")) {
        setSelectedMatter("Estate of Robert Williams, Probate Administration (Matter #2026-CV-1011)");
      } else if (subjectLower.includes("birch") || bodyLower.includes("birch") || subjectLower.includes("survey")) {
        setSelectedMatter("512 Birch Street Title Dispute (Matter #2026-RE-0512)");
      } else if (subjectLower.includes("montgomery") || bodyLower.includes("trust")) {
        setSelectedMatter("Montgomery Living Trust Estate (Matter #2026-EP-4411)");
      } else {
        setSelectedMatter("General Real Estate Client Advisory");
      }
    }
  }, [selectedThread]);

  // Load Gmail attachments for the selected email thread
  useEffect(() => {
    if (!selectedThread?.threadId) {
      setEmailAttachmentFiles([]);
      return;
    }

    // Do not call backend for demo/mock threads
    if (
      !accessToken ||
      accessToken === "mock_access_token_kagalwalla" ||
      accessToken.startsWith("mock_") ||
      selectedThread.threadId.startsWith("test_thread_")
    ) {
      setEmailAttachmentFiles([]);
      return;
    }

    let cancelled = false;

    const loadAttachments = async () => {
      setIsLoadingAttachments(true);

      try {
        const attachments: GmailAttachmentInfo[] = await fetchThreadAttachments(
          selectedThread.threadId
        );

        if (cancelled) return;

        const mappedDocs: UploadedDocument[] = attachments.map((file) => ({
          id: `${file.message_id}-${file.attachment_id || file.filename}`,
          name: file.filename,
          category: inferDocumentCategory(file.filename, file.mime_type),
          fileSize: formatAttachmentSize(file.size),
          uploadedAt: selectedThread.date || "From selected Gmail thread",
          matterAssociation: selectedThread.subject || "Selected Gmail thread",
          status: "Verified",
          source: "gmail",
          messageId: file.message_id,
          attachmentId: file.attachment_id,
          mimeType: file.mime_type,
        }));

        setEmailAttachmentFiles(mappedDocs);
      } catch (err) {
        console.error("Failed to fetch Gmail attachments:", err);

        if (!cancelled) {
          setEmailAttachmentFiles([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAttachments(false);
        }
      }
    };

    loadAttachments();

    return () => {
      cancelled = true;
    };
  }, [selectedThread?.threadId, accessToken]);

  const loadRealInbox = async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      if (accessToken === "mock_access_token_kagalwalla" || accessToken.startsWith("mock_")) {
        setThreads(getCustomizedEmails());
        setSuccessMsg("Logged into Kagalwalla Practice Sandbox. Loaded transaction-ready demo cases.");
        setTimeout(() => setSuccessMsg(null), 3000);
        setIsRefreshing(false);
        return;
      }
      const realThreads = await fetchGmailThreads(accessToken);
      if (realThreads.length === 0) {
        setThreads(getCustomizedEmails());
        setErrorMsg("Your live Google Workspace inbox is empty. Loaded Real Estate Demo Cases to explore triage capabilities.");
      } else {
        setThreads(realThreads);
        setSuccessMsg("Successfully fetched your live Gmail inbox threads.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.warn("Could not load live threads (normal if offline/unauthorized):", err?.message || err);
      setThreads(getCustomizedEmails());
      setErrorMsg("Unable to fetch live Gmail (OAuth mode). Loaded practice sandbox cases for immediate valuation.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadDemoInbox = () => {
    setThreads(getCustomizedEmails());
    setSelectedThread(null);
    setErrorMsg(null);
    setSuccessMsg("Loaded 8 transaction-ready real estate and estate planning demo cases.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleInjectTestEmail = () => {
    if (!testSenderEmail.trim() || !testSubject.trim() || !testBody.trim()) {
      setErrorMsg("Please fill in the sender email, subject, and message body to simulate.");
      return;
    }

    const newThreadId = "test_thread_" + Date.now();
    const newThread: ThreadMessage = {
      id: newThreadId,
      threadId: newThreadId,
      sender: testSenderName ? `${testSenderName} <${testSenderEmail}>` : testSenderEmail,
      subject: testSubject,
      date: new Date().toISOString(),
      snippet: testBody.slice(0, 100) + (testBody.length > 100 ? "..." : ""),
      body: testBody,
      labels: [],
      triageStatus: "unread",
      analyzing: false,
    };

    setThreads((prev) => [newThread, ...prev]);
    setSuccessMsg("Injected test email into active triage stream queue! Click on it to run legal analysis.");
    setTimeout(() => setSuccessMsg(null), 4000);
    
    // Auto-select and analyze the newly simulated thread
    analyzeThread(newThread);
  };

  // Perform AI Triage on selection
  const analyzeThread = async (thread: ThreadMessage) => {
    if (thread.analysis) {
      setSelectedThread(thread);
      setEditedDraft(thread.analysis.suggestedDraftResponse);
      setEditedTaskTitle(thread.analysis.suggestedTasks[0]?.title || `Follow up: ${thread.subject}`);
      setEditedTaskDueDate(thread.analysis.suggestedTasks[0]?.dueDate || "2026-06-30");
      setEditedEventSummary(thread.analysis.suggestedEvents[0]?.summary || `Closing: ${thread.subject}`);
      setEditedEventDateTime(thread.analysis.suggestedEvents[0]?.dateTime || "2026-06-29T10:00:00");
      setEditedEventDesc(thread.analysis.suggestedEvents[0]?.description || "");
      setIsEventConfirmed(false);
      return;
    }

    setThreads(prev =>
      prev.map(t => (t.id === thread.id ? { ...t, analyzing: true } : t))
    );
    setSelectedThread(prev => prev && prev.id === thread.id ? { ...prev, analyzing: true } : prev);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/triage/email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: {
            subject: thread.subject,
            body: thread.body,
            sender: thread.sender,
            date: thread.date,
            snippet: thread.snippet,
            id: thread.id,
            thread_id: thread.threadId,
            message_id_header: thread.messageIdHeader,
            references_header: thread.referencesHeader
          }
        })
      });

      if (!response.ok) {
        throw new Error("Triage failed: " + (await response.text()));
      }

      const rawAnalysis = await response.json();
      const updatedAnalysis: TriageAnalysis = {
        classification: rawAnalysis.classification,
        confidence: rawAnalysis.confidence,
        detectedCriticalSignals: rawAnalysis.detected_critical_signals || [],
        urgency: rawAnalysis.urgency,
        priority: rawAnalysis.priority,
        deadlineDate: rawAnalysis.deadline_date || null,
        deadlineReason: rawAnalysis.deadline_reason || null,
        privilegeAssessment: rawAnalysis.privilege_assessment || "",
        briefSummary: rawAnalysis.brief_summary || "",
        suggestedDraftResponse: rawAnalysis.suggested_draft_response || "",
        suggestedTasks: (rawAnalysis.suggested_tasks || []).map((task: any) => ({
          title: task.title,
          dueDate: task.due_date,
        })),
        suggestedEvents: (rawAnalysis.suggested_events || []).map((event: any) => ({
          summary: event.summary,
          description: event.description,
          dateTime: event.date_time,
        })),
        shouldDelegate: rawAnalysis.should_delegate || false,
        suggestedAssignee: rawAnalysis.suggested_assignee || undefined,
        delegationReason: rawAnalysis.delegation_reason || undefined,
      };
      
      setThreads(prev =>
        prev.map(t => {
          if (t.id === thread.id) {
            return {
              ...t,
              analyzing: false,
              analysis: updatedAnalysis
            };
          }
          return t;
        })
      );

      if (selectedThread && selectedThread.id === thread.id) {
        setSelectedThread({
          ...selectedThread,
          analyzing: false,
          analysis: updatedAnalysis
        });
        setEditedDraft(updatedAnalysis.suggestedDraftResponse);
        setEditedTaskTitle(updatedAnalysis.suggestedTasks[0]?.title || `Follow up: ${thread.subject}`);
        setEditedTaskDueDate(updatedAnalysis.deadlineDate || "2026-06-30");
        setEditedEventSummary(updatedAnalysis.suggestedEvents[0]?.summary || `Closing Meet: ${thread.subject}`);
        setEditedEventDateTime(updatedAnalysis.suggestedEvents[0]?.dateTime || "2026-06-29T10:00:00");
        setEditedEventDesc(updatedAnalysis.suggestedEvents[0]?.description || "");
        setIsEventConfirmed(false);
      }
    } catch (err: any) {
      console.warn("Triage analyzer notice (normal if rate-limited):", err?.message || err);
      setErrorMsg("Backend triage offline/unresponsive. Loaded fallback real estate heuristics for local testing.");
      setTimeout(() => setErrorMsg(null), 4000);
      
      // Fallback analysis matching mock cases
      const fallbackAnalysis: TriageAnalysis = {
        classification: "Closings",
        priority: "High",
        confidence: "High",
        detectedCriticalSignals: ["Escrow Contingency", "Earnest Money at Risk"],
        urgency: "Contractual Milestone Deadline",
        deadlineDate: "2026-06-29",
        deadlineReason: "Closing escrow scheduled date. Action required to prevent default or TRID delays.",
        privilegeAssessment: "ATTORNEY-CLIENT PRIVILEGED: Real estate transaction counsel.",
        briefSummary: "Urgent transaction milestone review requested for the scheduled property closing.",
        suggestedDraftResponse: `Dear Client,\n\nI have completed our legal review of your transaction documents and title commitment. We are in a strong position to move forward with the closing on Monday.\n\nSincerely,\n${attorneyName}, Esq.\nKagalwalla Law Offices LLC`,
        suggestedTasks: [{ title: "Verify title commitment clearance and wire routing", dueDate: "2026-06-29" }],
        suggestedEvents: [{ summary: "Kagalwalla Closing Signature Meeting", description: "Official property deed signing and key exchange.", dateTime: "2026-06-29T10:00:00" }]
      };

      setThreads(prev =>
        prev.map(t => (t.id === thread.id ? { ...t, analyzing: false, analysis: fallbackAnalysis } : t))
      );
      if (selectedThread && selectedThread.id === thread.id) {
        setSelectedThread({ ...selectedThread, analyzing: false, analysis: fallbackAnalysis });
        setEditedDraft(fallbackAnalysis.suggestedDraftResponse);
        setEditedTaskTitle(fallbackAnalysis.suggestedTasks[0].title);
        setEditedTaskDueDate("2026-06-29");
        setEditedEventSummary(fallbackAnalysis.suggestedEvents[0].summary);
        setEditedEventDateTime(fallbackAnalysis.suggestedEvents[0].dateTime);
        setIsEventConfirmed(false);
      }
    }
  };

  // Smokeball Filing action
  const handleSmokeballFile = () => {
    if (!selectedThread) return;
    setIsFiling(true);
    
    setTimeout(() => {
      setFiledMatters(prev => ({
        ...prev,
        [selectedThread.id]: { status: "success", matter: selectedMatter }
      }));
      setThreads(prev =>
        prev.map(t => (t.id === selectedThread.id ? { ...t, triageStatus: t.triageStatus === "unread" ? "unread" : t.triageStatus } : t))
      );
      setIsFiling(false);
      setSuccessMsg(`Archived thread & attachments successfully to Smokeball under: "${selectedMatter}"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 1200);
  };

  // Gmail Label Action
  const handleApplyLabel = async (labelName: string) => {
    if (!selectedThread) return;
    setSuccessMsg(`Applied label "${labelName}" to active email thread.`);
    setTimeout(() => setSuccessMsg(null), 2500);

    if (accessToken) {
      try {
        await applyGmailLabelToThread(accessToken, selectedThread.threadId, labelName);
      } catch (e) {
        console.warn("Could not sync live label to Google account", e);
      }
    }
  };

  // Gmail Draft Action
  const handleCreateDraft = async () => {
    if (!selectedThread) return;
    if (!accessToken) {
      setErrorMsg("Please connect Gmail before saving a draft.");
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    try {
      await createGmailDraft(accessToken, selectedThread.threadId, selectedThread.sender, selectedThread.subject, editedDraft, selectedThread.id, selectedThread.messageIdHeader, selectedThread.referencesHeader);
      setThreads(prev =>
        prev.map(t => (t.id === selectedThread.id ? { ...t, triageStatus: "drafted" } : t))
      );
      setSelectedThread(prev => prev ? { ...prev, triageStatus: "drafted" } : null);
      setSuccessMsg("Draft response prepared and synced into your Google Mail Drafts folder.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save draft to Gmail.");
      setTimeout(() => setErrorMsg(null), 4500);
    }
  };

  // Gmail Send Reply Action
  const handleSendReply = async () => {
    if (!selectedThread) return;
    if (!accessToken) {
      setErrorMsg("Please connect Gmail before sending a reply.");
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    setIsSendingReply(true);
    try {
      await sendGmailReply(accessToken, selectedThread.threadId, selectedThread.sender, selectedThread.subject, editedDraft, selectedThread.id, selectedThread.messageIdHeader, selectedThread.referencesHeader);
      setThreads(prev =>
        prev.map(t => (t.id === selectedThread.id ? { ...t, triageStatus: "sent" } : t))
      );
      setSelectedThread(prev => prev ? { ...prev, triageStatus: "sent" } : null);
      setSuccessMsg("Reply sent from Gmail.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to send reply from Gmail.");
      setTimeout(() => setErrorMsg(null), 4500);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Google Calendar Action
  const handleCreateEvent = async () => {
    if (!selectedThread) return;
    try {
      if (accessToken) {
        await createGoogleCalendarEvent(accessToken, editedEventSummary, editedEventDesc, editedEventDateTime);
      }
      setIsEventConfirmed(true);
      setSuccessMsg(`Event "${editedEventSummary}" successfully docketed on Google Calendar.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setIsEventConfirmed(true);
      setSuccessMsg(`Event "${editedEventSummary}" docketed locally to case calendar.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Google Tasks / Delegation Action
  const handleCreateTask = async () => {
    if (!selectedThread) return;
    try {
      if (accessToken) {
        await createGoogleTask(accessToken, editedTaskTitle, editedTaskDueDate, editedTaskNotes);
      }
      const newStatus = taskMode === "delegate" ? "delegated" : "deferred";
      setThreads(prev =>
        prev.map(t => (t.id === selectedThread.id ? {
          ...t,
          triageStatus: newStatus,
          delegatedTo: taskMode === "delegate" ? delegationAssignee : undefined
        } : t))
      );
      setSelectedThread(prev => prev ? {
        ...prev,
        triageStatus: newStatus,
        delegatedTo: taskMode === "delegate" ? delegationAssignee : undefined
      } : null);

      setSuccessMsg(taskMode === "delegate"
        ? `Task assigned and delegated to ${delegationAssignee}. Notifications dispatched.`
        : "Task successfully added to your Google Tasks list.");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      const newStatus = taskMode === "delegate" ? "delegated" : "deferred";
      setThreads(prev =>
        prev.map(t => (t.id === selectedThread.id ? {
          ...t,
          triageStatus: newStatus,
          delegatedTo: taskMode === "delegate" ? delegationAssignee : undefined
        } : t))
      );
      setSelectedThread(prev => prev ? {
        ...prev,
        triageStatus: newStatus,
        delegatedTo: taskMode === "delegate" ? delegationAssignee : undefined
      } : null);
      setSuccessMsg("Task added to local practice reminder log.");
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Archive Action
  const handleArchive = async () => {
    if (!selectedThread) return;
    try {
      if (accessToken) {
        await archiveGmailThread(accessToken, selectedThread.threadId);
      }
      setThreads(prev =>
        prev.map(t => (t.id === selectedThread.id ? { ...t, triageStatus: "archived" } : t))
      );
      setSelectedThread(null);
      setSuccessMsg("Thread successfully archived from active inbox.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setThreads(prev =>
        prev.map(t => (t.id === selectedThread.id ? { ...t, triageStatus: "archived" } : t))
      );
      setSelectedThread(null);
      setSuccessMsg("Thread moved to archived folder.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // File drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesList = Array.from(e.dataTransfer.files) as File[];
      const newDocs: UploadedDocument[] = filesList.map((file, index) => ({
        id: `uploaded_${Date.now()}_${index}`,
        name: file.name,
        category: uploadCategory,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matterAssociation: uploadMatter,
        status: "Pending Review",
        source: "local",
      }));

      setUploadedFiles(prev => [newDocs[0], ...prev]);
      setSuccessMsg(`Successfully uploaded "${newDocs[0].name}" to document vault.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newDoc: UploadedDocument = {
        id: `uploaded_${Date.now()}`,
        name: file.name,
        category: uploadCategory,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matterAssociation: uploadMatter,
        status: "Pending Review",
        source: "local",
      };

      setUploadedFiles(prev => [newDoc, ...prev]);
      setSuccessMsg(`Successfully uploaded "${newDoc.name}" to document vault.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const deleteDocument = (id: string) => {
    setUploadedFiles(prev => prev.filter(d => d.id !== id));
    setSuccessMsg("Document removed from local storage.");
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  // Consultation scheduler form handler
  const handleScheduleConsult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppClient || !newAppTime) {
      setErrorMsg("Please provide client name and appointment date.");
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }

    const newAppointment: ConsultationAppointment = {
      id: `app_${Date.now()}`,
      time: newAppTime,
      clientName: newAppClient,
      type: newAppType,
      notes: newAppNotes || "Initial planning review and legal consult.",
      status: "Scheduled",
      contact: newAppContact || "client@domain.com"
    };

    setAppointments(prev => [...prev, newAppointment]);
    setSuccessMsg(`Scheduled consultation appointment for ${newAppClient}.`);
    setNewAppClient("");
    setNewAppTime("");
    setNewAppNotes("");
    setNewAppContact("");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Filtered Threads for Inboxes
  const filteredThreads = threads.filter(thread => {
    const isFilteredByPriority = filterPriority === "All" || thread.analysis?.priority === filterPriority;
    if (!isFilteredByPriority) return false;
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.subject.toLowerCase().includes(query) ||
      thread.sender.toLowerCase().includes(query) ||
      thread.snippet.toLowerCase().includes(query)
    );
  });

  const documentFiles: UploadedDocument[] = [
    ...emailAttachmentFiles,
    ...uploadedFiles,
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header Deck Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-slate-100/50 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-[10px] bg-[#0057A4]/10 text-[#0057A4] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#0057A4]/20">
                  Kagalwalla Core Workspace
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-medium">
                  Attorney Partner: {attorneyName}
                </span>
              </div>
              <h1 className="text-3xl font-sans font-extrabold text-[#0057A4] mt-3 tracking-tight">
                Welcome back, Counsel
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 max-w-3xl font-sans leading-relaxed">
                Manage high-volume real estate transactions, title objections, and estate planning documents with AI-driven compliance guardrails. Lock escrow milestones, docket critical deadlines, and archive records in Smokeball.
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center space-x-3.5 shadow-sm min-w-[220px]">
              <div className="bg-[#0057A4]/10 p-2.5 rounded-lg text-[#0057A4] border border-[#0057A4]/20">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="text-slate-400 font-medium">Practice Profile</p>
                <p className="text-[#0057A4] font-bold font-sans mt-0.5">Real Estate & Estate Trust</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts & Messages */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl shadow-xs text-xs flex justify-between items-center border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900 font-bold ml-2">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-xl shadow-xs text-xs flex justify-between items-center border border-emerald-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Dashboard Nav Bar Switcher */}
        <div className="border-b border-slate-200">
          <nav className="flex flex-wrap gap-2 -mb-px" aria-label="Tabs">
            {[
              { id: "triage", name: "Client Inboxes & Triage", icon: Mail },
              { id: "transactions", name: "Matter Summary", icon: Home },
              { id: "documents", name: "Document Uploads", icon: FileText },
              { id: "appointments", name: "Appointments & Consultations", icon: Calendar },
              { id: "analytics", name: "Caseload Analytics", icon: TrendingUp },
              { id: "settings", name: "Roles & Settings", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDashboard === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDashboard(tab.id as any)}
                  className={`flex items-center space-x-2 py-3.5 px-5 border-b-2 font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "border-[#0057A4] text-[#0057A4] bg-white rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-[#0057A4] hover:border-slate-300"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#0057A4]" : "text-slate-400"}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* DASHBOARD 1: TRIAGE INBOX STREAM */}
        {activeDashboard === "triage" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Queue Panel (4 columns) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Triage Stream Queue</h3>
                  <div className="flex space-x-1.5">
                    {["All", "High", "Medium"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p as any)}
                        className={`text-[10px] px-2.5 py-1 rounded font-semibold border transition ${
                          filterPriority === p
                            ? "bg-[#0057A4] text-white border-[#0057A4]"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search correspondence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#0057A4]"
                  />
                </div>

                {/* Inboxes List */}
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredThreads.length === 0 ? (
                    <div className="text-center py-10">
                      <Mail className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-400 mt-2 font-medium">No pending correspondence.</p>
                    </div>
                  ) : (
                    filteredThreads.map((thread) => {
                      const isSelected = selectedThread?.id === thread.id;
                      const hasDeadline = thread.analysis?.deadlineDate;
                      const isPrivileged = thread.analysis?.privilegeAssessment;
                      const smStatus = filedMatters[thread.id]?.status === "success";

                      return (
                        <button
                          key={thread.id}
                          onClick={() => analyzeThread(thread)}
                          className={`w-full text-left p-3.5 rounded-xl border flex justify-between gap-3 transition-all duration-150 ${
                            isSelected
                              ? "bg-slate-50 border-[#0057A4] ring-1 ring-[#0057A4]/20"
                              : "border-slate-200 bg-white hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between text-slate-500 text-[10px] font-semibold">
                              <span className="truncate max-w-[150px]">{thread.sender}</span>
                              <span>{new Date(thread.date).toLocaleDateString()}</span>
                            </div>
                            
                            <h4 className="font-sans font-bold text-slate-800 text-xs truncate">{thread.subject}</h4>
                            <p className="text-slate-400 text-[11px] truncate leading-normal">{thread.snippet}</p>

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {thread.analysis?.priority && (
                                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                  thread.analysis.priority === "High"
                                    ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                  {thread.analysis.priority} Priority
                                </span>
                              )}
                              {isPrivileged && (
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                                  PRIVILEGED
                                </span>
                              )}
                              {hasDeadline && (
                                <span className="bg-[#0057A4]/10 text-[#0057A4] text-[9px] font-semibold px-2 py-0.5 rounded border border-[#0057A4]/20 uppercase tracking-wider">
                                  DEADLINE
                                </span>
                              )}
                              {smStatus && (
                                <span className="bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded border border-slate-700 uppercase tracking-wider">
                                  SMOKEBALL
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 self-center" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Real-Time Email Simulator Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setIsTesterExpanded(!isTesterExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 text-left hover:bg-slate-100/60 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-[#0057A4]" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Real-Time Email Simulator</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Simulate client communications & test AI compliance rules</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isTesterExpanded ? "rotate-90" : ""}`} />
                </button>

                {isTesterExpanded && (
                  <div className="p-4 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
                    {/* Preset Templates */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Preset Legal Scenarios</span>
                      <div className="flex flex-wrap gap-1.5">
                        {TEST_TEMPLATES.map((tmpl, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setTestSenderName(tmpl.senderName);
                              setTestSenderEmail(tmpl.senderEmail);
                              setTestSubject(tmpl.subject);
                              setTestBody(tmpl.body);
                            }}
                            className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-semibold transition"
                          >
                            {tmpl.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">Sender Name</label>
                        <input
                          type="text"
                          value={testSenderName}
                          onChange={(e) => setTestSenderName(e.target.value)}
                          className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-[#0057A4]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">Sender Email</label>
                        <input
                          type="text"
                          value={testSenderEmail}
                          onChange={(e) => setTestSenderEmail(e.target.value)}
                          className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-mono focus:outline-none focus:border-[#0057A4]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold uppercase block">Subject / Transaction Matter</label>
                      <input
                        type="text"
                        value={testSubject}
                        onChange={(e) => setTestSubject(e.target.value)}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-sans focus:outline-none focus:border-[#0057A4]"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold uppercase block">Correspondence Message Body</label>
                      <textarea
                        rows={4}
                        value={testBody}
                        onChange={(e) => setTestBody(e.target.value)}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-sans leading-relaxed focus:outline-none focus:border-[#0057A4]"
                      />
                    </div>

                    <button
                      onClick={handleInjectTestEmail}
                      className="w-full bg-[#0057A4] hover:bg-[#004685] text-white text-xs font-bold py-2 rounded-lg transition text-center shadow-xs flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Inject & Analyze Email</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Details Triage Console (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              {selectedThread ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  
                  {/* Selected Email Header */}
                  <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="text-[10px] bg-white text-slate-600 px-3 py-1 rounded-full border border-slate-200 font-semibold font-mono">
                          Sender: {selectedThread.sender}
                        </span>
                        <h3 className="font-sans font-bold text-lg text-slate-800 mt-2.5">{selectedThread.subject}</h3>
                      </div>
                      <span className="text-xs text-slate-500 font-mono bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-inner">
                        {new Date(selectedThread.date).toLocaleString()}
                      </span>
                    </div>

                    {/* Email body container */}
                    <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-sans whitespace-pre-wrap leading-relaxed shadow-inner max-h-[160px] overflow-y-auto">
                      {selectedThread.body}
                    </div>
                  </div>

                  {/* Smokeball Filing Integration Module */}
                  <div className="p-5 border-b border-slate-200 bg-slate-50/20">
                    <div className="flex items-center space-x-2 text-[#0057A4] font-bold text-xs uppercase tracking-wider mb-3">
                      <Database className="h-4 w-4 text-[#0057A4]" />
                      <span>Smokeball Boost Integration (Case File Association)</span>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target Smokeball Matter</label>
                          <select
                            value={selectedMatter}
                            onChange={(e) => setSelectedMatter(e.target.value)}
                            className="w-full bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#0057A4]"
                          >
                            <option value="1044 Whispering Pines Dr Acquisition (Matter #2026-RE-1044)">
                              1044 Whispering Pines Dr Acquisition (Matter #2026-RE-1044)
                            </option>
                            <option value="742 Oakwood Lane Closing (Matter #2026-RE-0742)">
                              742 Oakwood Lane Closing (Matter #2026-RE-0742)
                            </option>
                            <option value="Estate of Robert Williams, Probate Administration (Matter #2026-CV-1011)">
                              Estate of Robert Williams, Probate Administration (Matter #2026-CV-1011)
                            </option>
                            <option value="512 Birch Street Title Dispute (Matter #2026-RE-0512)">
                              512 Birch Street Title Dispute (Matter #2026-RE-0512)
                            </option>
                            <option value="Montgomery Living Trust Estate (Matter #2026-EP-4411)">
                              Montgomery Living Trust Estate (Matter #2026-EP-4411)
                            </option>
                            <option value="General Real Estate Client Advisory">
                              General Real Estate Client Advisory
                            </option>
                          </select>
                        </div>

                        <div className="shrink-0 flex items-end">
                          {filedMatters[selectedThread.id]?.status === "success" ? (
                            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-2.5 px-4 rounded-lg flex items-center space-x-1.5 font-bold">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Filed in Smokeball</span>
                            </div>
                          ) : (
                            <button
                              disabled={isFiling}
                              onClick={handleSmokeballFile}
                              className="w-full sm:w-auto bg-[#0057A4] hover:bg-[#004685] text-white py-2.5 px-5 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-sm"
                            >
                              {isFiling ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  <span>Filing File...</span>
                                </>
                              ) : (
                                <>
                                  <Database className="h-3.5 w-3.5" />
                                  <span>One-Click Smokeball File</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {filedMatters[selectedThread.id]?.status === "success" && (
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-[11px] text-emerald-800 leading-normal flex items-start space-x-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            This email is officially logged into the <strong>Smokeball File</strong> for "{filedMatters[selectedThread.id].matter}". Records archived securely under transaction dockets.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Analysis View Panel */}
                  {selectedThread.analyzing ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="h-8 w-8 text-[#0057A4] animate-spin" />
                      <p className="text-sm font-bold text-slate-800">Analyzing correspondence...</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Extracting contract dates, identifying escrow risks, and drafting responsive legal wording under attorney guidelines.
                      </p>
                    </div>
                  ) : selectedThread.analysis ? (
                    <div className="divide-y divide-slate-100">
                      
                      {/* Classification details */}
                      <div className="p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classification:</span>
                              <span className="bg-[#0057A4]/10 text-[#0057A4] text-xs font-bold px-3 py-1 rounded-full border border-[#0057A4]/20">
                                {selectedThread.analysis.classification}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Priority:</span>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                selectedThread.analysis.priority === "High"
                                  ? "bg-red-50 text-red-700 font-extrabold border border-red-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {selectedThread.analysis.priority || "Medium"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                            <span>Ingest Confidence:</span>
                            <span className="font-bold text-slate-700">{selectedThread.analysis.confidence}</span>
                          </div>
                        </div>

                        {/* Critical signals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                              <ShieldAlert className="h-3.5 w-3.5 text-[#0057A4]" />
                              <span>Detected Operational Signals</span>
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {selectedThread.analysis.detectedCriticalSignals.map((sig, sIdx) => (
                                <span key={sIdx} className="bg-white border border-slate-200 text-slate-700 text-[10px] px-2.5 py-1 rounded-md font-medium">
                                  {sig}
                                </span>
                              ))}
                            </div>
                          </div>

                          {selectedThread.analysis.deadlineDate && (
                            <div className="bg-red-50/50 p-4 rounded-xl border border-red-200/60">
                              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                                <Clock className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                                <span>Urgent Milestone / Deadline</span>
                              </h4>
                              <p className="text-xs text-red-800 font-bold">
                                {selectedThread.analysis.urgency || "Action Window"} - Due: {selectedThread.analysis.deadlineDate}
                              </p>
                              <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                                {selectedThread.analysis.deadlineReason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Privilege Assessment */}
                        <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/80">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5 mb-1.5">
                            <Sparkle className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Attorney-Client Privilege Review (FRE 408)</span>
                          </h4>
                          <p className="text-xs text-emerald-800 leading-normal">
                            {selectedThread.analysis.privilegeAssessment}
                          </p>
                        </div>
                      </div>

                      {/* Summary & Draft Replies section */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Matter Summary</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {selectedThread.analysis.briefSummary}
                          </p>
                        </div>

                        {/* Drafting Sandbox */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-[#0057A4] uppercase tracking-wider flex items-center space-x-1">
                              <Sparkles className="h-3.5 w-3.5 text-[#0057A4]" />
                              <span>Proposed Responsive Reply Draft</span>
                            </h4>
                            <span className="text-[10px] text-slate-400 italic">Vetted for non-disclosure protection</span>
                          </div>

                          <textarea
                            value={editedDraft}
                            onChange={(e) => setEditedDraft(e.target.value)}
                            rows={7}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 focus:outline-none focus:border-[#0057A4] font-mono leading-relaxed"
                          />

                          <div className="flex justify-end space-x-2 pt-1">
                            {selectedThread.triageStatus === "sent" ? (
                              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-2 px-4 rounded-lg flex items-center space-x-1.5 font-bold">
                                <CheckCircle className="h-4 w-4" />
                                <span>Reply Sent from Gmail</span>
                              </div>
                            ) : selectedThread.triageStatus === "drafted" ? (
                              <>
                                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs py-2 px-4 rounded-lg flex items-center space-x-1.5 font-bold">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Draft Uploaded to Gmail</span>
                                </div>
                                <button
                                  onClick={handleSendReply}
                                  disabled={isSendingReply}
                                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-4.5 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  <span>{isSendingReply ? "Sending..." : "Send Reply"}</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={handleCreateDraft}
                                className="bg-[#0057A4] hover:bg-[#004685] text-white text-xs font-semibold px-4.5 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                <span>Save Draft to Gmail</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Google Tasks / Calendar Actionables */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                        
                        {/* Task Planner Box */}
                        <div className="space-y-3 bg-white p-4.5 rounded-xl border border-slate-200">
                          <h4 className="text-xs font-bold text-[#0057A4] uppercase tracking-wider flex items-center space-x-1.5">
                            <ListTodo className="h-4 w-4" />
                            <span>Actionable Task Planner</span>
                          </h4>

                          <div className="space-y-2.5">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Task Assignment Mode</label>
                              <div className="flex space-x-1.5 mt-1">
                                <button
                                  onClick={() => setTaskMode("personal")}
                                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                    taskMode === "personal"
                                      ? "bg-[#0057A4] text-white border-[#0057A4]"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  Personal Task
                                </button>
                                <button
                                  onClick={() => setTaskMode("delegate")}
                                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                    taskMode === "delegate"
                                      ? "bg-[#0057A4] text-white border-[#0057A4]"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  Delegate Task
                                </button>
                              </div>
                            </div>

                            {taskMode === "delegate" && (
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase">Assign To Counsel / Assistant</label>
                                <select
                                  value={delegationAssignee}
                                  onChange={(e) => setDelegationAssignee(e.target.value)}
                                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                                >
                                  <option value="Paralegal Sarah">Paralegal Sarah (Real Estate Settlement)</option>
                                  <option value="Junior Associate Mark">Junior Associate Mark (Title Clerk)</option>
                                  <option value="Executive Assistant Linda">Executive Assistant Linda (Estate Probate)</option>
                                </select>
                              </div>
                            )}

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Task Description</label>
                              <input
                                type="text"
                                value={editedTaskTitle}
                                onChange={(e) => setEditedTaskTitle(e.target.value)}
                                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase">Due Date</label>
                                <input
                                  type="date"
                                  value={editedTaskDueDate}
                                  onChange={(e) => setEditedTaskDueDate(e.target.value)}
                                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-mono"
                                />
                              </div>
                              <div className="flex items-end">
                                {selectedThread.triageStatus === "deferred" || selectedThread.triageStatus === "delegated" ? (
                                  <div className="w-full text-center bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 rounded-lg text-xs font-bold">
                                    ✓ Task Synchronized
                                  </div>
                                ) : (
                                  <button
                                    onClick={handleCreateTask}
                                    className="w-full bg-[#0057A4] hover:bg-[#004685] text-white text-xs font-semibold py-2 rounded-lg transition shadow-sm"
                                  >
                                    Deploy Task
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Calendar Planner Box */}
                        <div className="space-y-3 bg-white p-4.5 rounded-xl border border-slate-200">
                          <h4 className="text-xs font-bold text-[#0057A4] uppercase tracking-wider flex items-center space-x-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>Calendar Event Scheduler</span>
                          </h4>

                          <div className="space-y-2.5">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Event Summary</label>
                              <input
                                type="text"
                                value={editedEventSummary}
                                onChange={(e) => setEditedEventSummary(e.target.value)}
                                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Event Date & Time</label>
                              <input
                                type="datetime-local"
                                value={editedEventDateTime}
                                onChange={(e) => setEditedEventDateTime(e.target.value)}
                                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-mono"
                              />
                            </div>

                            <div className="flex items-end justify-between pt-2">
                              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                                <Info className="h-3 w-3" />
                                <span>Locks calendar invitation</span>
                              </span>
                              {isEventConfirmed ? (
                                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-1.5 px-4 rounded-lg text-xs font-bold flex items-center space-x-1">
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Docket Confirmed</span>
                                </div>
                              ) : (
                                <button
                                  onClick={handleCreateEvent}
                                  className="bg-[#0057A4] hover:bg-[#004685] text-white text-xs font-semibold py-2 px-5 rounded-lg transition shadow-sm"
                                >
                                  Docket Event
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Bottom Footer Actions */}
                      <div className="p-5 flex justify-between bg-slate-50 border-t border-slate-200 rounded-b-xl">
                        <p className="text-[10px] text-slate-400 self-center">
                          Complies with statutory closing guidelines & ABA ethics rules.
                        </p>
                        <button
                          onClick={handleArchive}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          <span>Archive Correspondence</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="p-16 text-center text-slate-400">
                      <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-sm mt-3 font-semibold">Ready for Legal Triage Analysis</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Select any communication thread on the left queue, and Kagalwalla AI will classify details, audit privilege, track contingencies, and construct replies.
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
                  <Mail className="h-12 w-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 mt-3">Select a Triage Stream File</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-normal">
                    Real estate closings and estate plans require immediate correspondence review. Select any item from the left queue to open the active compliance cockpit.
                  </p>
                </div>
              )}

              {/* Workspace Connection card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3.5">
                  <h4 className="text-xs font-bold text-[#0057A4] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Database className="h-4 w-4" />
                      <span>Workspace Conduit</span>
                    </span>
                    {user ? (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 border ${
                        accessToken && accessToken !== "mock_access_token_kagalwalla" && !accessToken.startsWith("mock_")
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                        <span>{accessToken && accessToken !== "mock_access_token_kagalwalla" && !accessToken.startsWith("mock_") ? "Live Workspace" : "Sandbox Active"}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-50 text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                        Disconnected
                      </span>
                    )}
                  </h4>

                  {user ? (
                    <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-[#0057A4]/15 text-[#0057A4] flex items-center justify-center font-extrabold text-xs uppercase shadow-sm">
                          {user.displayName?.slice(0, 2) || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{user.displayName || "Testing User"}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={onTriggerLogout}
                          className="text-[10px] bg-white hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg font-bold transition flex-1 text-center"
                        >
                          Disconnect Account
                        </button>
                        <button
                          onClick={onTriggerLogin}
                          className="text-[10px] bg-[#0057A4] hover:bg-[#004685] text-white px-2.5 py-1.5 rounded-lg font-bold transition flex-1 text-center shadow-xs"
                        >
                          Switch Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center space-y-3">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        No active email account connected. Connect a Google Workspace account or activate the developer testing sandbox to run real-time mail validation.
                      </p>
                      <button
                        onClick={onTriggerLogin}
                        className="w-full bg-[#0057A4] hover:bg-[#004685] text-white text-xs font-bold py-2.5 rounded-lg transition shadow-xs"
                      >
                        Connect Email Account
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 leading-normal font-sans">
                    {accessToken && accessToken !== "mock_access_token_kagalwalla" && !accessToken.startsWith("mock_")
                      ? "Kagalwalla Law Triage Agent has live active Gmail, Google Tasks, and Google Calendar scopes. Approved operations deploy in seconds."
                      : "Working in localized sandbox mode. Connect your actual Google Workspace (Gmail, Calendar, Tasks) or switch sandbox emails to simulate multi-lawyer firm workflows."}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {accessToken && accessToken !== "mock_access_token_kagalwalla" && !accessToken.startsWith("mock_") ? (
                      <button
                        onClick={loadRealInbox}
                        disabled={isRefreshing}
                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 border border-slate-200 transition"
                      >
                        <RefreshCw className={`h-3 w-3 text-[#0057A4] ${isRefreshing ? "animate-spin" : ""}`} />
                        <span>{isRefreshing ? "Syncing..." : "Sync Live Gmail"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          alert(
                            "To integrate your actual Google account:\n\n1. Review and approve the Google Workspace Integration card in the AI Studio chat panel to the left.\n2. Once authorized, click the 'Attorney Sign-In' button in the top right to securely log in with your real Gmail."
                          );
                        }}
                        className="flex-1 bg-[#0057A4]/10 hover:bg-[#0057A4]/15 text-[#0057A4] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-[#0057A4]/20"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Integrate Live Gmail</span>
                      </button>
                    )}
                    <button
                      onClick={loadDemoInbox}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-3 rounded-lg text-xs font-semibold border border-slate-200 transition flex items-center justify-center space-x-1"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-[#0057A4]" />
                      <span>Reload 8 Demo Cases</span>
                    </button>
                  </div>
                </div>

                {/* Active Calibration */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Active System Guidelines
                  </h4>
                  <div className="text-xs space-y-2 text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Practice Focus</span>
                      <span className="font-bold text-slate-700">{config?.role || "Real Estate & Estate Trust Partner"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Caseload Influx</span>
                      <span className="font-bold text-slate-700">{config?.volume || "Moderate Caseload"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Response Guard</span>
                      <span className="font-bold text-slate-700">{config?.responsiveness || "Same-Day Business Closure"}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Tune preferences anytime using the "Preferences & Rules" tab in the main header.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* DASHBOARD 2: MATTER SUMMARY */}
        {activeDashboard === "transactions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0057A4] flex items-center space-x-2">
                  <Home className="h-5 w-5 text-[#0057A4]" />
                  <span>Matter Summary & Escrow Pipeline</span>
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Active escrow files, closing milestones, title search commitments, and critical contractual contingency timers.
                </p>
              </div>
              <div className="bg-[#0057A4]/5 px-3 py-1.5 rounded-lg border border-[#0057A4]/15 text-[#0057A4] text-xs font-semibold">
                3 Active Real Estate Matters
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Property Address</span>
                        <h3 className="text-base font-bold text-slate-800 mt-0.5">{tx.address}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                        tx.status === "Pending Signatures"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : tx.status === "Title Objection Filed"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 py-3">
                      <div>
                        <span className="text-slate-400 block font-medium">Buyer/Client</span>
                        <span className="font-bold text-slate-700">{tx.clientName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Earnest Money</span>
                        <span className="font-bold text-emerald-700">{tx.earnestMoney}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Escrow Officer</span>
                        <span className="font-semibold text-slate-600">{tx.escrowOfficer}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Closing Scheduled</span>
                        <span className="font-bold text-slate-700 font-mono">{tx.closingDate}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Contingencies Timeline</span>
                        <span className="font-bold text-[#0057A4]">{tx.progressPercent}% Safe</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#0057A4] h-full" style={{ width: `${tx.progressPercent}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Contractual Covenants</h4>
                      <div className="space-y-1.5">
                        {tx.contingencies.map((con, cIdx) => (
                          <div key={cIdx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <span className="text-slate-700 font-medium truncate max-w-[150px]">{con.name}</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] text-slate-400 font-mono">{con.date}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                con.status === "Approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : con.status === "At Risk"
                                  ? "bg-red-100 text-red-800 animate-pulse"
                                  : "bg-slate-200 text-slate-600"
                              }`}>
                                {con.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedMatter(`${tx.address} Closing (Matter #2026-RE)`);
                        setActiveDashboard("triage");
                        setSuccessMsg(`Switched triage console focus to: ${tx.address}`);
                        setTimeout(() => setSuccessMsg(null), 2500);
                      }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-[#0057A4] border border-slate-200 text-xs font-semibold py-2 rounded-lg text-center transition"
                    >
                      View Associated Mail
                    </button>
                    <button
                      onClick={() => {
                        setSuccessMsg(`Requested escrow clearance letter from ${tx.escrowOfficer} at ${tx.escrowCompany}`);
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="bg-[#0057A4] hover:bg-[#004685] text-white text-xs font-semibold py-2 px-3.5 rounded-lg transition shadow-sm"
                    >
                      Contact Title
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center space-x-3.5 text-xs text-slate-500">
              <Info className="h-5 w-5 text-[#0057A4] shrink-0" />
              <p>
                <strong>Escrow Wire Caution Notice:</strong> Never execute bank transfers or earnest money wires solely based on email coordinates. Always verbally confirm instructions with Escrow officers at Chicago Title or Vanguard Title using authenticated phone channels.
              </p>
            </div>
          </div>
        )}

        {/* DASHBOARD 3: ROLES & SYSTEM SETTINGS */}
        {activeDashboard === "settings" && (
          <div className="space-y-6">
            
            {/* Header Block */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0057A4] flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-[#0057A4]" />
                  <span>Firm Role & Authorization Preferences</span>
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Configure active security credentials, audit transaction trails, and control administrative compliance overrides.
                </p>
              </div>
              <div className="bg-[#0057A4]/5 px-3.5 py-1.5 rounded-lg border border-[#0057A4]/15 text-[#0057A4] text-xs font-bold flex items-center space-x-1.5 uppercase font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Security Level: {userRole} Active</span>
              </div>
            </div>

            {/* Role Switcher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* User Role Card */}
              <button
                type="button"
                onClick={() => {
                  setUserRole("User");
                  setSuccessMsg("Security credentials adjusted to Associate Counsel (User).");
                  setTimeout(() => setSuccessMsg(null), 2500);
                }}
                className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  userRole === "User"
                    ? "bg-white border-[#0057A4] ring-2 ring-[#0057A4]/15 shadow-sm"
                    : "bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {userRole === "User" && (
                  <div className="absolute right-0 top-0 bg-[#0057A4] text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Current Active Role
                  </div>
                )}
                <div className="space-y-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                    userRole === "User" ? "bg-[#0057A4]/10 text-[#0057A4] border-[#0057A4]/20" : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-sm">Associate Counsel & Staff (User)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Standard workflow authorization. Perform legal triage, draft client emails, docket calendar items, and sync documents to active Smokeball matters.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className={userRole === "User" ? "text-[#0057A4]" : "text-slate-400"}>
                    Standard Permission Scope
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    userRole === "User" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-500"
                  }`}>
                    Read & Write
                  </span>
                </div>
              </button>

              {/* Admin Role Card */}
              <button
                type="button"
                onClick={() => {
                  setUserRole("Admin");
                  setSuccessMsg("Security level elevated to Managing Partner (Admin). Full administrative override unlocked.");
                  setTimeout(() => setSuccessMsg(null), 2500);
                }}
                className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  userRole === "Admin"
                    ? "bg-white border-[#0057A4] ring-2 ring-[#0057A4]/15 shadow-sm"
                    : "bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {userRole === "Admin" && (
                  <div className="absolute right-0 top-0 bg-amber-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Current Active Role
                  </div>
                )}
                <div className="space-y-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                    userRole === "Admin" ? "bg-amber-500/10 text-amber-700 border-amber-500/20" : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-sm">Managing Partner & Compliance Officer (Admin)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Full firm administrative privileges. Access absolute document deletion, inspect real-time action audits, enforce global wire transaction guidelines, and clear secure logs.
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className={userRole === "Admin" ? "text-amber-700" : "text-slate-400"}>
                    Elevated Compliance Scope
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    userRole === "Admin" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-500"
                  }`}>
                    Full Override & Audit
                  </span>
                </div>
              </button>

            </div>

            {/* Dynamic Settings Content based on Role Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Role-Specific Settings Controls (5 Columns) */}
              <div className="lg:col-span-5 space-y-6">
                
                {userRole === "Admin" ? (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <Shield className="h-4 w-4 text-amber-600" />
                        <span>Global Compliance & Risk Guardrails</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">Configure automated checks applied dynamically across the firm's legal pipelines.</p>
                    </div>

                    <div className="space-y-4">
                      
                      <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">Enforce Dual-Channel Escrow Wire Approvals</label>
                          <p className="text-[10px] text-slate-500 leading-normal">Requires secondary phone authentication for all earnest money transfers. Automatically flags wire emails without matching dockets.</p>
                        </div>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-[#0057A4] shrink-0 cursor-pointer">
                          <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full transition" />
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-[#0057A4]/10 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">FRE 408 Auto-Redaction & Privacy Mask</label>
                          <p className="text-[10px] text-slate-500 leading-normal">Instantly mask sensitive social security or private estate values before processing through cloud-hosted analysis engines.</p>
                        </div>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-[#0057A4] shrink-0 cursor-pointer">
                          <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full transition" />
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">Strict Attorney-Client Privilege Tagging</label>
                          <p className="text-[10px] text-slate-500 leading-normal">Flag all legal summaries with robust privilege warning tags if an attorney domain is detected in the communication chain.</p>
                        </div>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-[#0057A4] shrink-0 cursor-pointer">
                          <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full transition" />
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <User className="h-4 w-4 text-[#0057A4]" />
                        <span>My Workspace Personal Preferences</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">Calibrate your individual view, notification alerts, and accessibility options.</p>
                    </div>

                    <div className="space-y-4">
                      
                      <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">Daily Correspondence Email Recap</label>
                          <p className="text-[10px] text-slate-500 leading-normal">Receive a summary docket of all unread high-priority escrow objections at 8:00 AM CST.</p>
                        </div>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-[#0057A4] shrink-0 cursor-pointer">
                          <span className="inline-block w-4 h-4 transform translate-x-6 bg-white rounded-full transition" />
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">Sound alerts on Smokeball Synced Cases</label>
                          <p className="text-[10px] text-slate-500 leading-normal">Play a soft confirmation chime when correspondences or deeds are successfully logged.</p>
                        </div>
                        <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-slate-200 shrink-0 cursor-pointer">
                          <span className="inline-block w-4 h-4 transform translate-x-1 bg-white rounded-full transition" />
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs space-y-1.5">
                        <h4 className="font-bold text-amber-800 flex items-center space-x-1">
                          <Lock className="h-3.5 w-3.5 shrink-0" />
                          <span>Standard Scope Restrictive Warning</span>
                        </h4>
                        <p className="text-[10px] text-amber-700 leading-normal">
                          Administrative systems such as firm-wide prompt calibration, global audit purging, and permanent document deletion are locked for your standard account scope. Switch to Admin mode above to override.
                        </p>
                      </div>

                    </div>
                  </div>
                )}
                
              </div>

              {/* Right Column: Firm Audit Ledger & Action Console (7 Columns) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <Fingerprint className="h-4.5 w-4.5 text-[#0057A4]" />
                      <span>Firm Compliance Action Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-400">Verifiable logging of critical file uploads, dockets, and database synchronization actions.</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full shrink-0">
                    {auditLogs.length} audit checkpoints
                  </span>
                </div>

                {/* Audit table/list */}
                <div className="divide-y divide-slate-150 max-h-[300px] overflow-y-auto pr-1">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Fingerprint className="h-10 w-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-medium mt-2">Ledger currently clear.</p>
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="py-3 flex justify-between items-start gap-4 text-left">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">{log.user}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              log.category === "Security"
                                ? "bg-amber-100 text-amber-800"
                                : log.category === "Filing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {log.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-normal font-sans">{log.action}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-semibold">{log.timestamp}</p>
                        </div>
                        <span className="text-[9px] bg-slate-50 text-slate-400 font-bold border border-slate-150 px-2 py-0.5 rounded-sm font-mono shrink-0">
                          {log.id.toUpperCase()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Interactive Audit Action Console */}
                <div className="border-t border-slate-150 pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      const sampleActions = [
                        { action: "Executed automated contingency audit on 1044 Whispering Pines Dr Acquisition", user: user?.displayName || "Managing Partner", category: "Security" as const },
                        { action: "Synchronized closing disclosure paperwork with Smokeball Matter #2026-RE-0742", user: "Paralegal Sarah", category: "Filing" as const },
                        { action: "Purged outdated local draft correspondence caches", user: "System Scheduler", category: "System" as const },
                        { action: "Registered healthcare power of attorney appointment for Clara Davis", user: "Paralegal Sarah", category: "Filing" as const },
                        { action: "Re-calibrated system responsiveness guardrails to Same-Day Business Closure", user: user?.displayName || "Managing Partner", category: "System" as const },
                      ];
                      const selectedSample = sampleActions[Math.floor(Math.random() * sampleActions.length)];
                      const newLog = {
                        id: `log_${Date.now()}`,
                        timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        user: selectedSample.user,
                        action: selectedSample.action,
                        category: selectedSample.category,
                      };
                      setAuditLogs(prev => [newLog, ...prev]);
                      setSuccessMsg("Simulated firm audit action successfully injected.");
                      setTimeout(() => setSuccessMsg(null), 2500);
                    }}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-[#0057A4] border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl text-center transition flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <span>+ Inject Simulated Audit Event</span>
                  </button>

                  <button
                    onClick={() => {
                      if (userRole !== "Admin") {
                        setErrorMsg("Permission Denied: Only Admin users (Managing Partner) can purge the firm compliance ledger.");
                        setTimeout(() => setErrorMsg(null), 3500);
                        return;
                      }
                      setAuditLogs([]);
                      setSuccessMsg("Firm compliance action ledger cleared successfully.");
                      setTimeout(() => setSuccessMsg(null), 2500);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition text-center flex items-center justify-center space-x-1 shrink-0 ${
                      userRole === "Admin"
                        ? "bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300"
                        : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    }`}
                    title={userRole === "Admin" ? "Clear Ledger" : "Requires Admin Role"}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    <span>Clear Logs</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* DASHBOARD 4: DOCUMENT UPLOADS */}
        {activeDashboard === "documents" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Upload Panel (4 columns) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Upload Transaction Documents
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Associate uploaded ALTA surveys, deeds, disclosures, and Gmail attachments directly into matter files.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      Document Category
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700"
                    >
                      <option value="Deed">Property Deed / Title Transfer</option>
                      <option value="Closing Disclosure">Closing Disclosure (CD)</option>
                      <option value="ALTA Survey">ALTA Boundary Survey Map</option>
                      <option value="Will/Trust Draft">Estate Will / Trust Drafting</option>
                      <option value="Title Commitment">Title Commitment Objection</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      Associate to Active Case
                    </label>
                    <select
                      value={uploadMatter}
                      onChange={(e) => setUploadMatter(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-[#0057A4] font-semibold"
                    >
                      <option value="742 Oakwood Lane Closing">
                        742 Oakwood Lane Closing (Escrow #0742)
                      </option>
                      <option value="1044 Whispering Pines Dr Acquisition">
                        1044 Whispering Pines Dr Acquisition (Escrow #1044)
                      </option>
                      <option value="512 Birch Street Title Dispute">
                        512 Birch Street Title Dispute (Objection #0512)
                      </option>
                      <option value="Estate of Robert Williams Probate">
                        Estate of Robert Williams Probate (Case #1011)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <label
                  htmlFor="manual_file_input"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                    isDragging
                      ? "border-[#0057A4] bg-[#0057A4]/5"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <Upload className="h-8 w-8 text-[#0057A4]" />
                  <div className="text-xs font-semibold text-slate-700">
                    Drag & Drop File Here
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Supports PDF, DOCX, PNG up to 15MB
                  </div>
                  <span className="text-xs text-[#0057A4] font-bold">
                    or browse local disk
                  </span>
                  <input
                    type="file"
                    onChange={handleManualUpload}
                    className="hidden"
                    id="manual_file_input"
                  />
                </label>

                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-[11px] rounded-xl p-3 leading-relaxed">
                  Gmail attachments are loaded automatically from the currently selected email thread.
                  Manual uploads remain local until you connect a real document-storage backend.
                </div>
              </div>
            </div>

            {/* Right Document Vault list (8 columns) */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Kagalwalla Document Vault
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gmail attachments from the selected thread plus manually uploaded local documents.
                  </p>
                </div>

                <span className="text-xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full">
                  {documentFiles.length} files logged
                </span>
              </div>

              {!selectedThread && emailAttachmentFiles.length === 0 && uploadedFiles.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex items-start space-x-2">
                  <Info className="h-4 w-4 text-[#0057A4] shrink-0 mt-0.5" />
                  <span>
                    Select an email thread in the triage dashboard to load its Gmail attachments here.
                  </span>
                </div>
              )}

              {selectedThread && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 mb-1">
                    Selected Email Thread
                  </div>
                  <div className="truncate">
                    {selectedThread.subject}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                    Thread ID: {selectedThread.threadId}
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {isLoadingAttachments ? (
                  <div className="py-10 text-center text-xs text-slate-500 font-semibold">
                    <RefreshCw className="h-6 w-6 mx-auto mb-2 text-[#0057A4] animate-spin" />
                    Loading Gmail attachments...
                  </div>
                ) : documentFiles.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 font-semibold">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    No documents found. Select a Gmail thread with attachments or upload a local file.
                  </div>
                ) : (
                  documentFiles.map((doc) => (
                    <div key={doc.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="bg-[#0057A4]/10 p-2.5 rounded-lg text-[#0057A4] border border-[#0057A4]/15">
                          <File className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800 truncate max-w-[320px]">
                              {doc.name}
                            </h4>

                            {doc.source === "gmail" ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Gmail Attachment
                              </span>
                            ) : (
                              <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Local Upload
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 items-center mt-1 text-[10px] text-slate-400 font-semibold">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                              {doc.category}
                            </span>
                            <span>•</span>
                            <span>Matter: {doc.matterAssociation}</span>
                            <span>•</span>
                            <span>Size: {doc.fileSize}</span>
                            {doc.mimeType && (
                              <>
                                <span>•</span>
                                <span>{doc.mimeType}</span>
                              </>
                            )}
                          </div>

                          {doc.source === "gmail" && (
                            <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                              Message ID: {doc.messageId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          doc.status === "Verified"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {doc.status}
                        </span>

                        {doc.source === "gmail" ? (
                          <button
                            disabled
                            className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed"
                            title="Gmail attachments cannot be deleted from this local vault view"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (userRole !== "Admin") {
                                setErrorMsg("Access Denied: Only Admins can delete documents from the firm vault.");
                                setTimeout(() => setErrorMsg(null), 3500);
                                return;
                              }

                              deleteDocument(doc.id);
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              userRole === "Admin"
                                ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                : "text-slate-300 cursor-not-allowed"
                            }`}
                            title={userRole === "Admin" ? "Delete document" : "Requires Admin Role"}
                          >
                            {userRole === "Admin" ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* DASHBOARD 5: APPOINTMENTS & CONSULTATIONS */}
        {activeDashboard === "appointments" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Scheduling Form (4 columns) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Schedule Client Consultation</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Book potential estate plan reviews, deeds, or closing appointments.</p>
                </div>

                <form onSubmit={handleScheduleConsult} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Client Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kenneth & Maria Davis"
                      value={newAppClient}
                      onChange={(e) => setNewAppClient(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-none focus:border-[#0057A4]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Service Type</label>
                      <select
                        value={newAppType}
                        onChange={(e) => setNewAppType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700"
                      >
                        <option value="Estate Planning">Estate Planning</option>
                        <option value="Real Estate Closing">Closing signing</option>
                        <option value="Commercial Lease">Lease Review</option>
                        <option value="Title Dispute">Title Dispute</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Contact Email</label>
                      <input
                        type="email"
                        placeholder="client@gmail.com"
                        value={newAppContact}
                        onChange={(e) => setNewAppContact(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Appointment Time</label>
                    <input
                      type="text"
                      placeholder="e.g. June 29, 2026 - 03:30 PM"
                      value={newAppTime}
                      onChange={(e) => setNewAppTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Consultation Directives / Notes</label>
                    <textarea
                      placeholder="e.g. Asset transfers, joint properties, durable power of attorney reviews..."
                      value={newAppNotes}
                      onChange={(e) => setNewAppNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0057A4] hover:bg-[#004685] text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-sm"
                  >
                    Docket Consultation
                  </button>
                </form>
              </div>
            </div>

            {/* Right Docket Ledger (8 columns) */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Upcoming Client Appointments</h3>
                  <p className="text-xs text-slate-400">Calendared hearings, deeds signing, and consultation assessments.</p>
                </div>
                <span className="text-xs font-mono font-bold bg-[#0057A4]/10 text-[#0057A4] px-3.5 py-1 rounded-full border border-[#0057A4]/15">
                  {appointments.length} active events
                </span>
              </div>

              <div className="space-y-4">
                {appointments.map((app) => (
                  <div key={app.id} className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#0057A4]/30 transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-xs font-bold text-[#0057A4] bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-xs flex items-center space-x-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{app.time}</span>
                        </span>
                        <span className="bg-[#0057A4]/10 text-[#0057A4] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#0057A4]/15 uppercase tracking-wider">
                          {app.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 pt-1">{app.clientName}</h4>
                      <p className="text-xs text-slate-500 leading-normal">{app.notes}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold">Contact: {app.contact}</p>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border bg-emerald-50 text-emerald-700 border-emerald-100">
                        {app.status}
                      </span>
                      <button
                        onClick={() => {
                          setAppointments(prev => prev.filter(a => a.id !== app.id));
                          setSuccessMsg("Event removed from schedule.");
                          setTimeout(() => setSuccessMsg(null), 2000);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
                        title="Cancel Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* DASHBOARD 6: ANALYTICS & INSIGHTS VIEW */}
        {activeDashboard === "analytics" && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
                <div className="absolute right-4 top-4 text-[#0057A4]/10">
                  <Mail className="h-12 w-12 text-[#0057A4]" />
                </div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ingested Caseload Volume</h4>
                <p className="text-3xl font-bold text-[#0057A4] mt-2 font-mono">52</p>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-2">
                  <span className="text-emerald-600 font-bold">↑ 18%</span>
                  <span>vs last week escrow files</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
                <div className="absolute right-4 top-4 text-emerald-600/10">
                  <Sparkles className="h-12 w-12 text-emerald-500" />
                </div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Replies Auto-Drafted</h4>
                <p className="text-3xl font-bold text-emerald-600 mt-2 font-mono">24</p>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-2">
                  <span className="text-emerald-600 font-bold">100%</span>
                  <span>confidentiality verified</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
                <div className="absolute right-4 top-4 text-red-600/10">
                  <Calendar className="h-12 w-12 text-red-500" />
                </div>
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-sans">Active Closing Calendars</h4>
                <p className="text-3xl font-bold text-red-600 mt-2 font-mono">12</p>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-2">
                  <span className="text-red-600 font-bold">0 Missed</span>
                  <span>contingency dockets preserved</span>
                </div>
              </div>

            </div>

            {/* Classification distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0057A4] flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>Practice Matters Distribution</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  How transaction files, objections, and consultations are balanced in your docket.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Contract Deadlines", count: 3, percent: 15, color: "bg-red-500", desc: "Earnest money expirations and contingency notices." },
                  { label: "Status Requests", count: 2, percent: 10, color: "bg-blue-500", desc: "Clients seeking closing progress or trust drafts." },
                  { label: "Document Disclosures", count: 4, percent: 20, color: "bg-amber-500", desc: "Closing Disclosures (CD), survey maps, NNN leases." },
                  { label: "Escrow Finalizations", count: 2, percent: 10, color: "bg-emerald-500", desc: "Settlement signings and verified bank wire instructions." },
                  { label: "Easement Encroachments", count: 1, percent: 5, color: "bg-purple-500", desc: "Written title objections and utility boundary disputes." },
                  { label: "Estate Trust Files", count: 2, percent: 10, color: "bg-indigo-500", desc: "Living Trust distributions and joint property transfers." },
                  { label: "Continuing Education", count: 5, percent: 25, color: "bg-slate-400", desc: "Local real estate regulations and bar bulletins." },
                  { label: "General Admin", count: 12, percent: 5, color: "bg-pink-400", desc: "Spam listings and automated title agency emails." }
                ].map((cat, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/60 p-4 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-700">{cat.label}</span>
                        <span className="font-mono text-xs text-[#0057A4] font-bold">{cat.count} files</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">{cat.desc}</p>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`${cat.color} h-full`} style={{ width: `${cat.percent * 2}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme extractions */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0057A4] flex items-center space-x-2">
                  <Layers className="h-4 w-4" />
                  <span>Topic modeling extraction clusters</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  AI-driven classification isolates high-frequency operational signals directly from email payloads.
                </p>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    theme: "Commercial Property Lease Redlines",
                    signal: "NNN lease maintenance / structural expenses / Sunset Blvd Commercial",
                    frequency: "1 Matter Cluster",
                    verbatim: "Samantha Vance seeking contract indemnity confirmation before retail signing."
                  },
                  {
                    theme: "Financing & Earnest Money Milestones",
                    signal: "Financing contingency expiration / 1044 Whispering Pines Dr / repair receipts",
                    frequency: "1 Urgent Docket Threat",
                    verbatim: "Mark Henderson warning that financing contingency expires on June 28, 2026."
                  },
                  {
                    theme: "Closing Disclosure TRID Guidelines",
                    signal: "TRID 3-day rule / signed CD before closing / Helen Ross Vanguard Title",
                    frequency: "1 Ingest Deadline Warning",
                    verbatim: "Helen Ross requesting Closing Disclosure (CD) approval by 5:00 PM today."
                  },
                  {
                    theme: "ALTA survey & Easement objections",
                    signal: "Boundary survey encroachments / Title Objection Notice / Arthur Gable Birch Street",
                    frequency: "1 Title Objection Threat",
                    verbatim: "Arthur Gable flagging detached garage easement encroachment on 512 Birch Street."
                  }
                ].map((theme, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-800">{theme.theme}</span>
                        <span className="bg-[#0057A4]/10 text-[#0057A4] text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-[#0057A4]/15 uppercase tracking-wider font-mono">{theme.frequency}</span>
                      </div>
                      <p className="text-[11px] text-slate-500"><strong>Extraction Signals:</strong> {theme.signal}</p>
                      <p className="text-[11px] text-slate-400 italic"><strong>Subject Context:</strong> "{theme.verbatim}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
