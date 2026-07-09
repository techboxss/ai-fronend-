import { ThreadMessage } from "../types";

export const mockLegalEmails: ThreadMessage[] = [
  {
    id: "mock_thread_1",
    threadId: "mock_thread_1",
    subject: "CRITICAL: Financing Contingency Expiration on 1044 Whispering Pines Dr",
    sender: "Mark Henderson <mhenderson@pinecrest-capital.com>",
    date: "2026-06-24T14:30:00Z",
    snippet: "Our lender underwriting team is still missing the seller's updated repair receipts. The financing contingency expires on June 28, 2026.",
    body: `Dear Counsel,

We represent the buyers for the 1044 Whispering Pines Dr residential transaction. 

Our lender underwriting team is still missing the seller's updated repair receipts to approve the loan. Under Section 14 of our purchase contract, if we do not submit our written loan commitment or request a formal extension by Sunday, June 28, 2026 at 5:00 PM, our clients will waive their financing contingency and their $15,000 earnest money deposit will become fully non-refundable. 

Please provide the receipts or draft an extension addendum today so we can protect their earnest money.

Best regards,
Mark Henderson
Pinecrest Capital Group`,
    labels: ["INBOX"],
    triageStatus: "unread",
    analysis: {
      classification: "Documents",
      priority: "High",
      confidence: "High",
      detectedCriticalSignals: ["Financing Contingency", "Earnest Money At Risk", "Contractual Deadline"],
      urgency: "Contractual Contingency Deadline",
      deadlineDate: "2026-06-28",
      deadlineReason: "Financing contingency expires on Sunday, June 28, 2026 at 5:00 PM. Failing to act risks forfeiture of the client's $15,000 earnest money deposit.",
      privilegeAssessment: "Client contract negotiation. Safeguard financial terms and client instructions under attorney-client privilege.",
      briefSummary: "Lender Mark Henderson warns that the financing contingency for 1044 Whispering Pines Dr expires on June 28, 2026. Repair receipts or an extension request is needed immediately.",
      suggestedDraftResponse: `Dear Mark,

Thank you for the urgent warning. 

I am immediately drafting a formal 5-day Extension of the Financing Contingency Addendum to send to the seller's counsel for signature, which will protect our client's $15,000 earnest money. I will also contact the seller's attorney to obtain the missing repair receipts today.

Sincerely,
Adnan Kagalwalla, Esq.`,
      suggestedTasks: [
        { title: "Draft and submit 5-day Financing Contingency Extension Addendum", dueDate: "2026-06-25" }
      ],
      suggestedEvents: [
        {
          summary: "Financing Contingency Expiration: Whispering Pines",
          description: "Absolute contractual deadline to submit loan commitment or formal extension.",
          dateTime: "2026-06-28T17:00:00"
        }
      ],
      shouldDelegate: false,
      suggestedAssignee: "Paralegal Sarah",
      delegationReason: "This is a critical, high-priority contractual contingency expiring in under 4 days. The lead attorney should handle this transaction milestone directly."
    }
  },
  {
    id: "mock_thread_2",
    threadId: "mock_thread_2",
    subject: "URGENT ACTION: Draft Closing Disclosure (CD) review for 742 Oakwood Lane",
    sender: "Helen Ross, Escrow Officer <h_ross@vanguard-title.com>",
    date: "2026-06-25T08:15:00Z",
    snippet: "Please review the attached draft Closing Disclosure. Closing is scheduled for Monday, June 29, 2026, and federal TRID rules require approval today.",
    body: `Hi Attorney Kagalwalla,

Attached is the draft Closing Disclosure (CD) for the purchase of 742 Oakwood Lane.

The buyers are scheduled to sign and close on Monday, June 29, 2026. Under federal TRID/CFPB guidelines, the buyers must receive and sign the final CD at least three business days prior to closing to avoid transaction delays. This means the buyer must sign the CD by tonight, Thursday, June 25, 2026.

Please review the proration of HOA dues and county property taxes on page 2. We need your final approval or edits by 5:00 PM today so we can release it for signature.

Thank you,
Helen Ross
Vanguard Title & Escrow Services`,
    labels: ["INBOX"],
    triageStatus: "unread",
    analysis: {
      classification: "Closings",
      priority: "High",
      confidence: "High",
      detectedCriticalSignals: ["Federal TRID Rule", "Closing Disclosure", "HOA/Tax Proration"],
      urgency: "TRID 3-Day Rule Deadline",
      deadlineDate: "2026-06-25",
      deadlineReason: "Federal TRID rule requires the signed CD 3 business days before the scheduled June 29 closing, making today (June 25) the absolute deadline for attorney approval.",
      privilegeAssessment: "Escrow and title closing documents. Review figures to protect client from incorrect credit/debit calculations before sign-off.",
      briefSummary: "Escrow officer Helen Ross requests urgent review of the Closing Disclosure (CD) for 742 Oakwood Lane by 5:00 PM today to preserve the June 29 closing schedule under TRID guidelines.",
      suggestedDraftResponse: `Dear Helen,

I have completed my review of the draft Closing Disclosure (CD) for 742 Oakwood Lane.

The tax prorations and HOA dues credits look correct on page 2, and the closing costs match our contract terms. Our clients are cleared to sign. Please proceed with sending the final CD to the buyers for their signature today to meet the TRID timeline.

Sincerely,
Adnan Kagalwalla, Esq.`,
      suggestedTasks: [
        { title: "Review Oakwood Lane Closing Disclosure prorations and HOA credits", dueDate: "2026-06-25" }
      ],
      suggestedEvents: [
        {
          summary: "Closing Disclosure Signature Deadline (TRID)",
          description: "Absolute deadline to sign CD to preserve June 29 closing date.",
          dateTime: "2026-06-25T17:00:00"
        }
      ],
      shouldDelegate: false,
      suggestedAssignee: "Junior Associate Mark",
      delegationReason: "This requires final professional review and legal sign-off by the lead transaction attorney today. Not suitable for routine delegation."
    }
  },
  {
    id: "mock_thread_3",
    threadId: "mock_thread_3",
    subject: "TITLE ISSUES: Objection Notice regarding Easement Encroachment on 512 Birch Street",
    sender: "Arthur Gable, Esq. <agable@gable-realestatelaw.com>",
    date: "2026-06-24T18:45:00Z",
    snippet: "The survey reveals a private utility easement encroachment. We must deliver a formal objection to the seller by July 3, 2026.",
    body: `Dear Adnan,

I am writing regarding our purchase of 512 Birch Street.

The new ALTA boundary survey just came back, and it reveals that the seller's detached garage encroaches 3.2 feet into the city utility easement on the northern boundary. 

Under Section 8 of our purchase agreement, the buyer has until Friday, July 3, 2026, to submit a formal Title Objection Notice. If we fail to notify the seller in writing by this date, we waive the objection and must take title subject to this easement encroachment, which could prevent future utility work or force a demolition of the garage.

Please review the attached survey and let me know if we can file the Title Objection Notice by next week.

Warm regards,
Arthur Gable, Esq.
Gable & Partners LLC`,
    labels: ["INBOX"],
    triageStatus: "unread",
    analysis: {
      classification: "Counterparty",
      priority: "High",
      confidence: "High",
      detectedCriticalSignals: ["Easement Encroachment", "ALTA Survey", "Title Objection Deadline"],
      urgency: "Contractual Objection Deadline",
      deadlineDate: "2026-07-03",
      deadlineReason: "Contractual title objection window closes on July 3, 2026. Failure to object waives the client's right to demand the seller cure the encroachment.",
      privilegeAssessment: "Privileged transaction counsel advice. Review risk of municipal easement violations and prepare formal written objection notice.",
      briefSummary: "Co-counsel Arthur Gable flags a detached garage easement encroachment on 512 Birch Street, requiring a formal written objection notice to the seller by July 3, 2026.",
      suggestedDraftResponse: `Dear Arthur,

I have received your email and reviewed the attached ALTA survey.

I agree that this 3.2-foot encroachment poses a significant title risk that must be addressed. I am drafting the formal Title Objection Notice under Section 8 of the contract to demand the seller obtain a permanent easement waiver or clear the title prior to closing. I will send you a draft for review by Friday.

Sincerely,
Adnan Kagalwalla`,
      suggestedTasks: [
        { title: "Draft formal Title Objection Notice for 512 Birch Street", dueDate: "2026-06-30" }
      ],
      suggestedEvents: [
        {
          summary: "Title Objection Deadline: 512 Birch Street",
          description: "Absolute contractual deadline to submit Title Objection Notice to Seller.",
          dateTime: "2026-07-03T17:00:00"
        }
      ],
      shouldDelegate: false,
      suggestedAssignee: "Junior Associate Mark",
      delegationReason: "This involves analyzing a physical boundary easement encroachment and title objection under Section 8, requiring senior attorney review."
    }
  },
  {
    id: "mock_thread_4",
    threadId: "mock_thread_4",
    subject: "Commercial Lease Redline: 450 Sunset Blvd Triple Net (NNN) Clauses",
    sender: "Samantha Vance <samantha@sunset-properties.com>",
    date: "2026-06-25T00:30:00Z",
    snippet: "Attached are the landlord's redlines for the triple net lease. They modified the structural maintenance obligations on page 14.",
    body: `Hi Attorney Kagalwalla,

Attached is the revised commercial lease agreement for the 450 Sunset Blvd retail property.

The landlord has made several adjustments to the triple net lease (NNN) clauses on page 14. Specifically, they are attempting to shift major structural maintenance obligations (including roof and foundation replacement) onto our client, the tenant. 

We need you to review these changes and confirm if the indemnity clauses are favorable to us. We are scheduled to sign the lease next Friday, July 3, 2026, so your redlines and guidance are highly appreciated.

Thanks,
Samantha Vance
Sunset Properties Group`,
    labels: ["INBOX"],
    triageStatus: "unread",
    analysis: {
      classification: "Documents",
      priority: "Medium",
      confidence: "High",
      detectedCriticalSignals: ["NNN Redline", "Structural Maintenance Dispute", "Indemnity Terms"],
      urgency: "Review and Redline Dispute",
      deadlineDate: "2026-07-03",
      deadlineReason: "Lease signing is scheduled for next Friday, July 3, 2026. Negotiations on structural maintenance costs must be finalized before then.",
      privilegeAssessment: "Commercial transaction draft. Keep negotiations on structural maintenance expenses strictly confidential.",
      briefSummary: "Samantha Vance requests a review of the NNN commercial lease redlines on page 14 shifting roof/foundation expenses to the tenant.",
      suggestedDraftResponse: `Hi Samantha,

I have received the landlord's redlined draft for 450 Sunset Blvd.

Shifting major structural capital expenditures like roof and foundation replacement to a retail tenant under an NNN lease is highly unfavorable. I will draft a counter-redline capping maintenance charges and excluding capital replacements, and prepare a favorable revision of the indemnity clauses. I will send you the redline by tomorrow.

Best regards,
Adnan`,
      suggestedTasks: [
        { title: "Review NNN commercial lease redlines and prepare structural counter-provisions", dueDate: "2026-06-26" }
      ],
      suggestedEvents: [
        {
          summary: "Target Lease Signing: 450 Sunset Blvd",
          description: "Scheduled signing of commercial retail lease agreement.",
          dateTime: "2026-07-03T10:00:00"
        }
      ],
      shouldDelegate: true,
      suggestedAssignee: "Junior Associate Mark",
      delegationReason: "Commercial NNN lease redline review on structural maintenance. Suitable for junior associate Mark to draft initial counter-provisions for your review."
    }
  },
  {
    id: "mock_thread_5",
    threadId: "mock_thread_5",
    subject: "HOA Disclosures & Budget Review: 1205 Marina Towers Condo",
    sender: "David K. <davidk@gmail.com>",
    date: "2026-06-24T18:00:00Z",
    snippet: "Please review the Marina Towers HOA documents. We have a 5-day statutory review window ending June 29, 2026.",
    body: `Dear Counsel,

We received the full Marina Towers Condominium Association packet (financial statements, bylaws, and meeting minutes) yesterday afternoon.

Under state law, we have a strict 5-day statutory rescission window to review these disclosures and cancel the contract without penalty if there are financial issues. The window expires on Monday, June 29, 2026.

I am particularly concerned about the reserve study and whether there are upcoming special assessments for balcony repairs. Please let me know your thoughts after reviewing the packet.

Sincerely,
David K.
(555) 019-2831`,
    labels: ["INBOX"],
    triageStatus: "unread",
    analysis: {
      classification: "Documents",
      priority: "Medium",
      confidence: "High",
      detectedCriticalSignals: ["Statutory Rescission Window", "HOA Reserve Study", "Special Assessments"],
      urgency: "Statutory Review Deadline",
      deadlineDate: "2026-06-29",
      deadlineReason: "5-day statutory review and contract rescission window expires on Monday, June 29, 2026.",
      privilegeAssessment: "Attorney-client consultation. Review HOA reserve balances to evaluate financial liability risks for the client.",
      briefSummary: "Client David K. requests analysis of Marina Towers Condominium HOA financials and reserve studies before the 5-day statutory review window expires on June 29, 2026.",
      suggestedDraftResponse: `Dear David,

Thank you for sending the HOA documents.

I am prioritizing the review of the Marina Towers reserves and bylaws. A low reserve balance combined with planned balcony repairs could lead to high special assessments. I will compile a risk report and review it with you before the statutory cancellation window closes on June 29.

Sincerely,
Adnan Kagalwalla, Esq.`,
      suggestedTasks: [
        { title: "Review Marina Towers Condo HOA financials and reserve adequacy", dueDate: "2026-06-26" }
      ],
      suggestedEvents: [
        {
          summary: "Marina Towers HOA Statutory Review Expiration",
          description: "Absolute statutory deadline to rescind contract based on HOA disclosures.",
          dateTime: "2026-06-29T17:00:00"
        }
      ],
      shouldDelegate: true,
      suggestedAssignee: "Junior Associate David",
      delegationReason: "HOA disclosure package review. Delegate to junior associate David to review the budget, bylaws, and reserve study adequacy."
    }
  },
  {
    id: "mock_thread_6",
    threadId: "mock_thread_6",
    subject: "NOTICE: Public Hearing for Zoning Variance - Case #ZV-2026-10",
    sender: "Zoning Board Clerk <variance-notice@city-planning.gov>",
    date: "2026-06-25T02:00:00Z",
    snippet: "A public hearing is scheduled for July 20, 2026, regarding the building height variance application for 901 Maple Ave.",
    body: `CASE ALERT: City Planning Commission

NOTICE OF PUBLIC ZONING HEARING

Please take notice that the City Zoning Board of Appeals will conduct a public hearing on Case #ZV-2026-10.

Date: July 20, 2026
Time: 7:00 PM EST
Location: City Hall Room 201, Planning Division
Subject: Building height variance application to construct a multi-family dwelling at 901 Maple Ave.

This is a public notice sent to adjacent property owners for informational purposes. If you wish to voice support or objection, you may appear in person or submit a written statement.

Thank you,
Office of the Planning Clerk`,
    labels: ["INBOX"],
    triageStatus: "unread",
    analysis: {
      classification: "Court/Docket",
      priority: "Low",
      confidence: "High",
      detectedCriticalSignals: ["Zoning Variance Notice", "Public Hearing", "No Immediate Pleading Required"],
      urgency: "Public Meeting Notice",
      deadlineDate: "2026-07-20",
      deadlineReason: "Zoning Board public hearing date is scheduled for July 20, 2026.",
      privilegeAssessment: "Public city notice. No attorney-client privilege applies. Flag for information if client owns adjacent property.",
      briefSummary: "City Zoning Board of Appeals schedules a public hearing on July 20, 2026, for a building height variance at 901 Maple Ave.",
      suggestedDraftResponse: `To the Planning Commission,

Thank you for this public notification. I have logged this hearing under our property records for 901 Maple Ave.

Sincerely,
Adnan Kagalwalla, Esq.`,
      suggestedTasks: [
        { title: "File public zoning notice in 901 Maple Ave property records", dueDate: "2026-07-15" }
      ],
      suggestedEvents: [
        {
          summary: "Zoning Board Hearing: 901 Maple Ave Variance",
          description: "Public zoning variance hearing for height exception.",
          dateTime: "2026-07-20T19:00:00"
        }
      ],
      shouldDelegate: true,
      suggestedAssignee: "Administrative Assistant Linda",
      delegationReason: "Public meeting notice with no immediate legal pleading or court response required. Administrative Assistant Linda can log this in the 901 Maple property records folder."
    }
  },
  {
    id: "mock_thread_7",
    threadId: "mock_thread_7",
    subject: "New Client Inquiry: Setting up a Land Trust for property acquisitions",
    sender: "Richard Vance <rvance@vance-holdings.com>",
    date: "2026-06-24T11:30:00Z",
    snippet: "I'd like to schedule a call to discuss setting up a series of land trusts to anonymize my upcoming real estate acquisitions.",
    body: `Dear Attorney Kagalwalla,

I received your contact details from Samantha Vance. 

I am expanding my commercial real estate portfolio next month and would like to establish several land trusts to keep my upcoming acquisitions private. 

Could we schedule a 30-minute introductory call sometime next week to discuss your legal fees and the corporate setup process? 

Best,
Richard Vance
Vance Holdings LLC`,
    labels: ["INBOX"],
    triageStatus: "unread",
    analysis: {
      classification: "General Client Communication",
      priority: "Low",
      confidence: "High",
      detectedCriticalSignals: ["New Client Intake", "Land Trust Consultation", "Anonymity Strategy"],
      urgency: "Client Intake",
      deadlineDate: null,
      deadlineReason: null,
      privilegeAssessment: "Prospective client consultation. Covered under preliminary attorney-client privilege rules to protect prospective disclosures.",
      briefSummary: "Richard Vance inquires about retaining the firm to set up land trusts to anonymize upcoming property acquisitions and requests a call next week.",
      suggestedDraftResponse: `Dear Richard,

Thank you for reaching out. I would be pleased to assist you with your land trust structure.

I have extensive experience structuring land trusts for real estate investors. Let's schedule a 30-minute call next Wednesday, July 1, at 2:00 PM to discuss your acquisition objectives and our corporate fee structures.

Sincerely,
Adnan Kagalwalla, Esq.`,
      suggestedTasks: [
        { title: "Schedule introductory call with prospective client Richard Vance", dueDate: "2026-06-29" }
      ],
      suggestedEvents: [
        {
          summary: "Intro Call: Richard Vance (Land Trusts)",
          description: "Discuss property acquisitions anonymity strategy and trust setup fees.",
          dateTime: "2026-07-01T14:00:00"
        }
      ],
      shouldDelegate: true,
      suggestedAssignee: "Intake Coordinator Sarah",
      delegationReason: "Prospective client intake. Delegate to intake coordinator Sarah to send the initial fee sheets and schedule the introductory consultation."
    }
  },
  {
    id: "mock_thread_8",
    threadId: "mock_thread_8",
    subject: "Registration Open: 1031 Exchange Tax Loopholes & Best Practices",
    sender: "Real Property Law Section <alerts@realpropertycle.org>",
    date: "2026-06-23T10:00:00Z",
    snippet: "Earn 2.0 Tax CLE credits on July 18, 2026. Join our panel on structuring complex 1031 tax-deferred exchanges.",
    body: `Dear Practitioner,

Don't let your summer CLE compliance deadlines slip away!

Register today for our premium webinar: "1031 Exchange Tax-Deferred Masterclass".
- Date: July 18, 2026
- Credits: 2.0 Tax CLE Credits
- Cost: $99 for members

Learn how to navigate complex 45-day identification rules and the 180-day purchase timelines under Section 1031. Highly recommended for commercial real estate closing attorneys.

Register online at realpropertycle.org.

Sincerely,
Real Property Law Section Board`,
    labels: ["INBOX"],
    triageStatus: "unread",
    analysis: {
      classification: "Newsletter/CLE",
      priority: "Low",
      confidence: "High",
      detectedCriticalSignals: ["CLE Promotion", "No Active Case", "Tax Webinar"],
      urgency: "Educational Bulletin",
      deadlineDate: "2026-07-18",
      deadlineReason: "Webinar event date.",
      privilegeAssessment: "Public promotional newsletter. No privilege applies.",
      briefSummary: "Real Property Law Section advertises a 1031 exchange tax-deferred seminar scheduled for July 18, 2026.",
      suggestedDraftResponse: `Thank you for the notification of this professional education course. I have marked this in my professional calendar.`,
      suggestedTasks: [
        { title: "Register for 1031 Exchange Tax CLE", dueDate: "2026-07-15" }
      ],
      suggestedEvents: [
        {
          summary: "CLE: 1031 Exchange Masterclass",
          description: "Continuing legal education credits regarding tax-deferred exchanges.",
          dateTime: "2026-07-18T13:00:00"
        }
      ],
      shouldDelegate: true,
      suggestedAssignee: "Legal Assistant Emily",
      delegationReason: "General training opportunity. Delegate to legal assistant Emily to handle the webinar registration and track CLE compliance credits."
    }
  }
];
