import type { EmitNfseInput, EmitNfseResponse, NfseStatusResponse } from "./types"

export class NfseClient {
  private apiKey: string
  private baseUrl = "https://api.nuvemfiscal.com.br"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      })
      if (!res.ok) {
        const error = await res.text().catch(() => "Unknown error")
        throw new Error(`NFS-e API error (${res.status}): ${error}`)
      }
      return res.json() as Promise<T>
    } finally {
      clearTimeout(timeout)
    }
  }

  async emit(data: EmitNfseInput): Promise<EmitNfseResponse> {
    return this.request<EmitNfseResponse>("/nfse", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getStatus(id: string): Promise<NfseStatusResponse> {
    return this.request<NfseStatusResponse>(`/nfse/${id}`)
  }

  async cancel(id: string, motivo: string): Promise<void> {
    await this.request(`/nfse/${id}/cancelamento`, {
      method: "POST",
      body: JSON.stringify({ justificativa: motivo }),
    })
  }

  async getPdfBytes(id: string): Promise<ArrayBuffer> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch(`${this.baseUrl}/nfse/${id}/pdf`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      if (!res.ok) throw new Error(`Failed to get PDF: ${res.status}`)
      return res.arrayBuffer()
    } finally {
      clearTimeout(timeout)
    }
  }

  /** Simple connectivity test — fetches the root or a lightweight endpoint */
  async testConnection(): Promise<boolean> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch(`${this.baseUrl}/nfse?$top=1`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      return res.ok
    } finally {
      clearTimeout(timeout)
    }
  }
}
