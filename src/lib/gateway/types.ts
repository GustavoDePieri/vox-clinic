/**
 * Gateway-agnostic types for payment gateway integrations.
 *
 * This abstraction allows VoxClinic to support multiple payment providers
 * (Asaas, Stripe, etc.) through a common interface.
 */

// ─── Charge Creation ──────────────────────────────────────────

export type GatewayPaymentMethod = "pix" | "boleto" | "credit_card" | "undefined"

export interface CreateChargeInput {
  /** External customer ID in the gateway (Asaas customer ID) */
  customerId?: string
  /** Patient name (used to create customer if needed) */
  customerName: string
  /** Patient CPF/CNPJ (used to create customer if needed) */
  customerDocument?: string
  /** Patient email */
  customerEmail?: string
  /** Patient phone */
  customerPhone?: string
  /** Amount in centavos (R$ 150,00 = 15000) */
  amount: number
  /** Due date ISO string */
  dueDate: string
  /** Description shown to patient */
  description: string
  /** Payment method */
  method: GatewayPaymentMethod
  /** Number of installments for credit card (1-12). Only applies to credit_card method. */
  installmentCount?: number
  /** Optional external reference (e.g., Payment ID) */
  externalReference?: string
}

export interface CreateChargeResult {
  /** Charge ID in the gateway */
  chargeId: string
  /** Payment link URL for the patient */
  paymentLink?: string
  /** PIX QR code as base64 PNG */
  pixQrCode?: string
  /** PIX copy-paste code */
  pixCopiaECola?: string
  /** Boleto PDF URL */
  boletoUrl?: string
  /** Boleto barcode digits */
  boletoBarcode?: string
  /** Raw status from gateway */
  status: string
}

// ─── Status ───────────────────────────────────────────────────

export interface ChargeStatusResult {
  chargeId: string
  status: string
  paidAt?: string
  paidAmount?: number
  paymentMethod?: string
}

// ─── Provider Interface ───────────────────────────────────────

export interface GatewayProvider {
  /** Provider name identifier */
  readonly name: string

  /** Create a charge/payment in the gateway */
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>

  /** Get current status of a charge */
  getChargeStatus(chargeId: string): Promise<ChargeStatusResult>

  /** Cancel a pending charge */
  cancelCharge(chargeId: string): Promise<void>

  /** Test the API connection/key validity */
  testConnection(): Promise<{ valid: boolean; message?: string }>
}
