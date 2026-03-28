/**
 * Gateway factory — creates the appropriate provider client based on config.
 *
 * Currently supports Asaas. Architecture allows adding Stripe or other
 * providers by implementing the GatewayProvider interface.
 */

import type { GatewayProvider } from "./types"
import { AsaasClient } from "./asaas-client"
import { decrypt } from "@/lib/crypto"

/**
 * Create a GatewayProvider instance from a GatewayConfig record.
 */
export function createGatewayClient(config: {
  provider: string
  apiKey: string
  sandboxMode: boolean
}): GatewayProvider {
  const decryptedKey = decrypt(config.apiKey)

  switch (config.provider) {
    case "asaas":
      return new AsaasClient(decryptedKey, config.sandboxMode)

    // Future: case "stripe": return new StripeClient(decryptedKey, config.sandboxMode)

    default:
      throw new Error(`Provedor de gateway nao suportado: ${config.provider}`)
  }
}

export type { GatewayProvider, CreateChargeInput, CreateChargeResult, ChargeStatusResult, GatewayPaymentMethod } from "./types"
