/**
 * Asaas Payment Gateway Client
 *
 * Implements the GatewayProvider interface for Asaas (https://asaas.com).
 * Supports PIX, Boleto, and Credit Card payments.
 *
 * Asaas API docs: https://docs.asaas.com
 */

import type {
  GatewayProvider,
  CreateChargeInput,
  CreateChargeResult,
  ChargeStatusResult,
} from "./types"

const SANDBOX_URL = "https://sandbox.asaas.com/api/v3"
const PRODUCTION_URL = "https://api.asaas.com/api/v3"
const TIMEOUT_MS = 15_000

/** Map our payment methods to Asaas billingType */
const BILLING_TYPE_MAP: Record<string, string> = {
  pix: "PIX",
  boleto: "BOLETO",
  credit_card: "CREDIT_CARD",
  undefined: "UNDEFINED", // Asaas generates link with all methods
}

/** Map Asaas status to a normalized status */
const STATUS_MAP: Record<string, string> = {
  PENDING: "pending",
  RECEIVED: "paid",
  CONFIRMED: "paid",
  OVERDUE: "overdue",
  REFUNDED: "refunded",
  RECEIVED_IN_CASH: "paid",
  REFUND_REQUESTED: "refund_requested",
  REFUND_IN_PROGRESS: "refund_in_progress",
  CHARGEBACK_REQUESTED: "chargeback",
  CHARGEBACK_DISPUTE: "chargeback",
  AWAITING_CHARGEBACK_REVERSAL: "chargeback",
  DUNNING_REQUESTED: "overdue",
  DUNNING_RECEIVED: "paid",
  AWAITING_RISK_ANALYSIS: "pending",
}

export class AsaasClient implements GatewayProvider {
  readonly name = "asaas"
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor(apiKey: string, sandbox = true) {
    this.apiKey = apiKey
    this.baseUrl = sandbox ? SANDBOX_URL : PRODUCTION_URL
  }

  // ─── HTTP Helper ──────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          access_token: this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        const errors = data?.errors
          ?.map((e: { description?: string }) => e.description)
          .filter(Boolean)
          .join("; ")
        throw new Error(
          errors || data?.message || `Asaas API error: ${res.status}`
        )
      }

      return data as T
    } finally {
      clearTimeout(timeout)
    }
  }

  // ─── Customer Management ──────────────────────────────────

  /**
   * Find or create an Asaas customer by CPF/CNPJ.
   * Asaas requires a customer for every charge.
   */
  private async findOrCreateCustomer(input: {
    name: string
    document?: string
    email?: string
    phone?: string
    externalReference?: string
  }): Promise<string> {
    // Try to find existing customer by CPF/CNPJ
    if (input.document) {
      const cleanDoc = input.document.replace(/\D/g, "")
      const search = await this.request<{
        data: Array<{ id: string }>
        totalCount: number
      }>("GET", `/customers?cpfCnpj=${cleanDoc}`)

      if (search.totalCount > 0 && search.data[0]) {
        return search.data[0].id
      }
    }

    // Create new customer
    const customer = await this.request<{ id: string }>("POST", "/customers", {
      name: input.name,
      cpfCnpj: input.document?.replace(/\D/g, "") || undefined,
      email: input.email || undefined,
      phone: input.phone?.replace(/\D/g, "") || undefined,
      externalReference: input.externalReference,
      notificationDisabled: true, // VoxClinic handles its own notifications
    })

    return customer.id
  }

  // ─── GatewayProvider Interface ────────────────────────────

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    // 1. Find or create customer in Asaas
    const customerId = input.customerId || await this.findOrCreateCustomer({
      name: input.customerName,
      document: input.customerDocument,
      email: input.customerEmail,
      phone: input.customerPhone,
      externalReference: input.externalReference,
    })

    // 2. Create payment/charge
    const billingType = BILLING_TYPE_MAP[input.method] || "UNDEFINED"
    const amountBRL = input.amount / 100 // Asaas uses BRL (not centavos)

    const charge = await this.request<{
      id: string
      invoiceUrl: string
      bankSlipUrl?: string
      status: string
      nossoNumero?: string
    }>("POST", "/payments", {
      customer: customerId,
      billingType,
      value: amountBRL,
      dueDate: input.dueDate.split("T")[0], // YYYY-MM-DD
      description: input.description,
      externalReference: input.externalReference,
      // Credit card installments (Asaas handles the split)
      ...(input.method === "credit_card" && input.installmentCount && input.installmentCount > 1
        ? { installmentCount: input.installmentCount, installmentValue: amountBRL / input.installmentCount }
        : {}),
    })

    const result: CreateChargeResult = {
      chargeId: charge.id,
      paymentLink: charge.invoiceUrl,
      status: STATUS_MAP[charge.status] || charge.status,
    }

    // 3. If PIX, fetch QR code
    if (input.method === "pix") {
      try {
        const pix = await this.request<{
          encodedImage: string
          payload: string
          expirationDate: string
        }>("GET", `/payments/${charge.id}/pixQrCode`)

        result.pixQrCode = pix.encodedImage
        result.pixCopiaECola = pix.payload
      } catch {
        // PIX QR may not be immediately available, that's ok
      }
    }

    // 4. If boleto, attach URL and barcode
    if (input.method === "boleto") {
      result.boletoUrl = charge.bankSlipUrl || undefined
      if (charge.nossoNumero) {
        // Fetch identificationField (barcode)
        try {
          const ident = await this.request<{
            identificationField: string
            barCode: string
          }>("GET", `/payments/${charge.id}/identificationField`)
          result.boletoBarcode = ident.identificationField || ident.barCode
        } catch {
          // barcode may not be available yet
        }
      }
    }

    return result
  }

  async getChargeStatus(chargeId: string): Promise<ChargeStatusResult> {
    const charge = await this.request<{
      id: string
      status: string
      confirmedDate?: string
      paymentDate?: string
      value: number
      billingType: string
    }>("GET", `/payments/${chargeId}`)

    return {
      chargeId: charge.id,
      status: STATUS_MAP[charge.status] || charge.status,
      paidAt: charge.confirmedDate || charge.paymentDate || undefined,
      paidAmount: Math.round(charge.value * 100), // BRL to centavos
      paymentMethod: charge.billingType?.toLowerCase(),
    }
  }

  async cancelCharge(chargeId: string): Promise<void> {
    await this.request("DELETE", `/payments/${chargeId}`)
  }

  async testConnection(): Promise<{ valid: boolean; message?: string }> {
    try {
      // Try fetching account info — if API key is valid, this succeeds
      await this.request<{ object: string }>(
        "GET",
        "/finance/getCurrentBalance"
      )
      return { valid: true }
    } catch (err) {
      return {
        valid: false,
        message:
          err instanceof Error ? err.message : "Falha ao conectar com Asaas",
      }
    }
  }
}
