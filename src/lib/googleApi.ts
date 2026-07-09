import { ThreadMessage, GmailAttachmentInfo } from "../types";
import type { PropertyTransactionFromEmail } from "../types";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

function normalizeThread(raw: any): ThreadMessage {
  return {
    id: raw.id,
    threadId: raw.thread_id || raw.threadId || raw.id,
    subject: raw.subject || "(No Subject)",
    snippet: raw.snippet || "",
    body: raw.body || raw.snippet || "",
    sender: raw.sender || "Unknown Sender",
    date: raw.date || new Date().toISOString(),
    labels: raw.labels || [],
    messageIdHeader: raw.message_id_header || raw.messageIdHeader || null,
    referencesHeader: raw.references_header || raw.referencesHeader || null,
    triageStatus: "unread",
  };
}

export async function fetchGmailThreads(_accessToken?: string | null): Promise<ThreadMessage[]> {
  const data = await apiFetch("/api/gmail/threads");
  return (data.threads || []).map(normalizeThread);
}

export async function archiveGmailThread(_accessToken: string | null, threadId: string): Promise<boolean> {
  await apiFetch("/api/gmail/archive-thread", {
    method: "POST",
    body: JSON.stringify({ thread_id: threadId }),
  });
  return true;
}

export async function createGmailLabel(_accessToken: string | null, labelName: string): Promise<string | null> {
  // The FastAPI backend currently does not expose Gmail label creation.
  // Keep this as a no-op so the frontend UI still works without direct Google API tokens.
  return labelName;
}

export async function applyGmailLabelToThread(
  _accessToken: string | null,
  _threadId: string,
  _labelIdOrName: string
): Promise<boolean> {
  // No backend label endpoint yet. Local UI state only.
  return true;
}

export async function createGmailDraft(
  _accessToken: string | null,
  threadId: string,
  recipient: string,
  subject: string,
  body: string,
  messageId?: string,
  messageIdHeader?: string | null,
  referencesHeader?: string | null
): Promise<boolean> {
  await apiFetch("/api/gmail/draft-reply", {
    method: "POST",
    body: JSON.stringify({
      message_id: messageId || threadId,
      thread_id: threadId,
      to: recipient,
      subject,
      body,
      message_id_header: messageIdHeader || undefined,
      references_header: referencesHeader || undefined,
    }),
  });
  return true;
}


export async function sendGmailReply(
  _accessToken: string | null,
  threadId: string,
  recipient: string,
  subject: string,
  body: string,
  messageId?: string,
  messageIdHeader?: string | null,
  referencesHeader?: string | null
): Promise<boolean> {
  await apiFetch("/api/gmail/send-reply", {
    method: "POST",
    body: JSON.stringify({
      message_id: messageId || threadId,
      thread_id: threadId,
      to: recipient,
      subject,
      body,
      message_id_header: messageIdHeader || undefined,
      references_header: referencesHeader || undefined,
    }),
  });
  return true;
}

export async function createGoogleCalendarEvent(
  _accessToken: string | null,
  _summary: string,
  _description: string,
  _startDateTimeStr: string
): Promise<boolean> {
  // Your current FastAPI backend does not expose Calendar create yet.
  // The frontend records this locally for now.
  return true;
}

export async function createGoogleTask(
  _accessToken: string | null,
  _title: string,
  _dueDateStr?: string,
  _notes?: string
): Promise<boolean> {
  // Your current FastAPI backend does not expose Tasks create yet.
  // The frontend records this locally for now.
  return true;
}

export async function fetchThreadAttachments(
  threadId: string
): Promise<GmailAttachmentInfo[]> {
  const data = await apiFetch(`/api/gmail/threads/${threadId}/attachments`, {
    method: "GET",
  });

  return data.attachments || [];
}

export async function fetchPropertyTransactions(): Promise<PropertyTransactionFromEmail[]> {
  const data = await apiFetch("/api/gmail/property-transactions", {
    method: "GET",
  });

  return data.transactions || [];
}