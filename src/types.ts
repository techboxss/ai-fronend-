export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

export interface SystemPromptConfig {
  role: string;
  volume: string;
  emailMix: string[];
  painPoints: string[];
  responsiveness: string;
  createdAt?: string;
}

export interface TriageAnalysis {
  classification: string;
  confidence: string;
  detectedCriticalSignals: string[];
  urgency: string;
  priority: "High" | "Medium" | "Low";
  deadlineDate: string | null;
  deadlineReason: string | null;
  privilegeAssessment: string;
  briefSummary: string;
  suggestedDraftResponse: string;
  suggestedTasks: Array<{
    title: string;
    dueDate?: string;
  }>;
  suggestedEvents: Array<{
    summary: string;
    description: string;
    dateTime: string;
  }>;
  shouldDelegate?: boolean;
  suggestedAssignee?: string;
  delegationReason?: string;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  body: string;
  sender: string;
  date: string;
  labels: string[];
  messageIdHeader?: string | null;
  referencesHeader?: string | null;
  analyzing?: boolean;
  analysis?: TriageAnalysis | null;
  triageStatus?: "unread" | "archived" | "drafted" | "sent" | "deferred" | "calendared" | "processing" | "delegated";
  delegatedTo?: string;
}

export interface TriageStats {
  needsAttention: number;
  draftedCount: number;
  deferredCount: number;
  archivedCount: number;
  calendaredCount: number;
  delegatedCount?: number;
}

export interface GmailAttachmentInfo {
  message_id: string;
  thread_id: string;
  attachment_id?: string | null;
  filename: string;
  mime_type?: string | null;
  size?: number | null;
}

export interface PropertyTransactionFromEmail {
  property_address?: string | null;
  buyer_client?: string | null;
  escrow_officer?: string | null;
  earnest_money?: string | null;
  closing_scheduled?: string | null;
  status?: "UNDERWAY" | "AT RISK" | "DELAYED" | "CLOSED" | "UNKNOWN" | string;
}