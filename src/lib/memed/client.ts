import { logger } from "@/lib/logger"

const DEFAULT_TIMEOUT = 15000

interface MemedPrescriberInput {
  nome: string
  cpf?: string
  dataNascimento?: string // YYYY-MM-DD
  email?: string
  uf: string
  conselho: string // CRM, CRO, etc.
  crm: string // board number
  externalId: string
}

interface MemedPrescriberResponse {
  data: {
    attributes: {
      token: string
      external_id: string
    }
    id: string
  }
}

interface MemedPrescriberGetResponse {
  data: {
    attributes: {
      token: string
      [key: string]: unknown
    }
    id: string
    [key: string]: unknown
  }
}

export class MemedClient {
  private apiKey: string
  private secretKey: string
  private baseUrl: string

  constructor(apiKey: string, secretKey: string, baseUrl?: string) {
    this.apiKey = apiKey
    this.secretKey = secretKey
    this.baseUrl = baseUrl || "https://integrations.api.memed.com.br/v1"
  }

  private async request<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
      })
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error")
        throw new Error(`Memed API error (${res.status}): ${errorText}`)
      }
      return res.json() as Promise<T>
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Register a new prescriber in Memed.
   * Returns the prescriber token and Memed-side ID.
   */
  async registerPrescriber(
    data: MemedPrescriberInput
  ): Promise<{ token: string; id: string }> {
    const body = {
      data: {
        type: "usuarios",
        attributes: {
          external_id: data.externalId,
          nome: data.nome,
          ...(data.cpf && { cpf: data.cpf }),
          ...(data.dataNascimento && {
            data_nascimento: data.dataNascimento,
          }),
          ...(data.email && { email: data.email }),
          uf: data.uf,
          conselho: data.conselho,
          crm: data.crm,
        },
        relationships: {
          cidade: { data: null },
          especialidade: { data: null },
        },
      },
    }

    const res = await this.request<MemedPrescriberResponse>(
      "/sinapse-prescricao/usuarios",
      {
        method: "POST",
        headers: {
          Authorization: this.secretKey,
        },
        body: JSON.stringify(body),
      }
    )

    return {
      token: res.data.attributes.token,
      id: res.data.id,
    }
  }

  /**
   * Get prescriber data from Memed by external ID.
   * Returns the current token and full prescriber data.
   */
  async getPrescriber(
    externalId: string
  ): Promise<{ token: string; data: unknown }> {
    const res = await this.request<MemedPrescriberGetResponse>(
      `/sinapse-prescricao/usuarios/${externalId}`,
      {
        method: "GET",
        headers: {
          Authorization: this.secretKey,
        },
      }
    )

    return {
      token: res.data.attributes.token,
      data: res.data,
    }
  }

  /**
   * Update prescriber data in Memed.
   */
  async updatePrescriber(
    id: string,
    data: Partial<MemedPrescriberInput>
  ): Promise<void> {
    const body = {
      data: {
        type: "usuarios",
        attributes: {
          ...(data.nome && { nome: data.nome }),
          ...(data.cpf && { cpf: data.cpf }),
          ...(data.email && { email: data.email }),
          ...(data.uf && { uf: data.uf }),
          ...(data.conselho && { conselho: data.conselho }),
          ...(data.crm && { crm: data.crm }),
        },
      },
    }

    await this.request(`/sinapse-prescricao/usuarios/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: this.secretKey,
      },
      body: JSON.stringify(body),
    })
  }

  /**
   * Get the signed PDF URL for a prescription.
   */
  async getPrescriptionPdfUrl(
    prescriptionId: string,
    token: string
  ): Promise<string> {
    const res = await this.request<{ url: string }>(
      `/prescricoes/${prescriptionId}/url-document/full`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return res.url
  }

  /**
   * Get the digital prescription link for patient delivery (SMS/email/WhatsApp).
   */
  async getDigitalPrescriptionLink(
    prescriptionId: string,
    token: string
  ): Promise<string> {
    const res = await this.request<{ link: string }>(
      `/prescricoes/${prescriptionId}/get-digital-prescription-link`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return res.link
  }

  /**
   * Test connectivity by making a simple authenticated request.
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try fetching a non-existent prescriber to validate credentials
      // A 404 means credentials are valid; a 401/403 means they are not
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)
      try {
        const res = await fetch(
          `${this.baseUrl}/sinapse-prescricao/usuarios/test-connection`,
          {
            signal: controller.signal,
            headers: {
              Authorization: this.secretKey,
              Accept: "application/json",
            },
          }
        )
        // 404 = credentials valid, resource not found (expected)
        // 200 = somehow found (also fine)
        // 401/403 = invalid credentials
        return res.status !== 401 && res.status !== 403
      } finally {
        clearTimeout(timeout)
      }
    } catch (err) {
      logger.error(
        "Memed connection test failed",
        { action: "testConnection" },
        err
      )
      return false
    }
  }
}

/**
 * Factory: creates a MemedClient from environment variables.
 * Returns null if Memed is not configured.
 */
export function createMemedClient(): MemedClient | null {
  // Import env inline to avoid circular dependency issues
  const apiKey = process.env.MEMED_API_KEY || ""
  const secretKey = process.env.MEMED_SECRET_KEY || ""
  const baseUrl =
    process.env.MEMED_API_URL || "https://integrations.api.memed.com.br/v1"

  if (!apiKey || !secretKey) {
    return null
  }

  return new MemedClient(apiKey, secretKey, baseUrl)
}
