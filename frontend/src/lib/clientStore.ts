// Lightweight localStorage-backed Annuity CRM client + policy store.
// This is intentionally frontend-only for now — the backend conversion
// workflow will replace this in a later phase.

import { QuoteData } from "./quoteUtils"

const STORAGE_KEY = "annuity_crm_clients_v1"

export type PolicyStatus =
  | "Draft"
  | "Pending Verification"
  | "Approved"
  | "Active"
  | "Suspended"
  | "Cancelled"

export interface ClientPolicy {
  id: string
  policyNumber: string
  productName: string
  status: PolicyStatus
  createdAt: string
  // Pre-populated from the originating quote
  sourceQuoteId?: string
  sourceQuoteRef?: string
  investmentAmount?: number
  drawdown?: number
  frequency?: string
  guaranteedStartAge?: number
  livingAnnuity?: number
  fundsRemaining?: number
  monthlyLifeAnnuity?: number
  // Completion flags (drives "pending" indicators in the UI)
  documentsUploaded: boolean
  beneficiariesCaptured: boolean
  portfolioAllocated: boolean
  activated: boolean
}

export interface CRMClient {
  id: string
  fullName: string
  idNumber?: string
  dateOfBirth?: string
  contactNumber?: string
  email?: string
  createdAt: string
  policies: ClientPolicy[]
}

const read = (): CRMClient[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const CHANGE_EVENT = "annuity_crm_clients_changed"

const write = (clients: CRMClient[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    /* ignore quota errors */
  }
}

export const listClients = (): CRMClient[] => read()

export const getClient = (id: string): CRMClient | undefined =>
  read().find((c) => c.id === id)

export interface CRMStats {
  totalClients: number
  totalPolicies: number
  convertedQuotes: number
  activePolicies: number
  pendingVerification: number
}

export const getCRMStats = (): CRMStats => {
  const clients = read()
  const policies = clients.flatMap((c) => c.policies)
  return {
    totalClients: clients.length,
    totalPolicies: policies.length,
    convertedQuotes: policies.length,
    activePolicies: policies.filter((p) => p.status === "Active").length,
    pendingVerification: policies.filter(
      (p) => p.status === "Draft" || p.status === "Pending Verification"
    ).length,
  }
}

export const subscribeCRM = (cb: () => void): (() => void) => {
  const handler = () => cb()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}


const genId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const genPolicyNumber = () => {
  const year = new Date().getFullYear()
  const seq = Math.floor(1000 + Math.random() * 9000)
  return `POL-${year}-${seq}`
}

/**
 * Create (or update) a client from a converted quote and attach a
 * Draft policy pre-populated with the quote inputs/outputs.
 */
export const convertQuoteToPolicy = (quote: QuoteData): { client: CRMClient; policy: ClientPolicy } => {
  const clients = read()

  const fullName = (quote.client?.fullName || quote.fullName || "").trim() || "Unnamed Client"
  const idNumber = quote.client?.idNumber || quote.idNumber
  const email = quote.client?.email || quote.email
  const contactNumber = quote.client?.contactNumber || quote.contactNumber
  const dateOfBirth = quote.client?.dateOfBirth || quote.dateOfBirth

  // Match by ID number first, then by name+email
  let client = clients.find(
    (c) =>
      (idNumber && c.idNumber && c.idNumber === idNumber) ||
      (c.fullName.toLowerCase() === fullName.toLowerCase() && email && c.email === email)
  )

  if (!client) {
    client = {
      id: genId("cli"),
      fullName,
      idNumber,
      dateOfBirth,
      contactNumber,
      email,
      createdAt: new Date().toISOString(),
      policies: [],
    }
    clients.push(client)
  } else {
    // Refresh contact fields from latest quote
    client.idNumber = client.idNumber || idNumber
    client.dateOfBirth = client.dateOfBirth || dateOfBirth
    client.contactNumber = contactNumber || client.contactNumber
    client.email = email || client.email
  }

  const inputs = quote.inputs || {}
  const living = quote.outputs?.living || {}
  const life = quote.outputs?.life || {}

  const policy: ClientPolicy = {
    id: genId("pol"),
    policyNumber: genPolicyNumber(),
    productName: quote.productType || quote.type || "Exclusive Annuity",
    status: "Draft",
    createdAt: new Date().toISOString(),
    sourceQuoteId: quote._id,
    sourceQuoteRef: quote.quoteId,
    investmentAmount: inputs.purchaseAmount ?? quote.singlePurchasePremium,
    drawdown: inputs.drawdown ?? quote.drawdown,
    frequency: inputs.frequency ?? quote.frequency,
    guaranteedStartAge: inputs.guaranteedStartAge ?? quote.guaranteedStartAge,
    livingAnnuity: living.guaranteed_annuity ?? quote.guaranteedAnnuity,
    fundsRemaining: living.funds_remaining ?? quote.fundsRemaining,
    monthlyLifeAnnuity: life.monthly_annuity ?? quote.monthlyLifeAnnuity,
    documentsUploaded: false,
    beneficiariesCaptured: false,
    portfolioAllocated: false,
    activated: false,
  }

  client.policies.unshift(policy)
  write(clients)
  return { client, policy }
}
