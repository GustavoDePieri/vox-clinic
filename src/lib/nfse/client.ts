import type { EmitNfseInput, EmitNfseResponse, NfseStatusResponse } from "./types"

export class NfseClient {
  private apiKey: string
  private baseUrl = "https://api.nuvemfiscal.com.br"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
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

  async getPdfUrl(id: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/nfse/${id}/pdf`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })
    if (!res.ok) throw new Error("Failed to get PDF")
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  }

  /** Simple connectivity test — fetches the root or a lightweight endpoint */
  async testConnection(): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/nfse?$top=1`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })
    return res.ok
  }
}
