// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Valid 32-byte key in hex (64 hex chars)
const { mockEnv, TEST_KEY } = vi.hoisted(() => {
  const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  const mockEnv = {
    ENCRYPTION_KEY: TEST_KEY,
  }
  return { mockEnv, TEST_KEY }
})

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}))

import { encrypt, decrypt } from "../crypto"

describe("crypto", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.ENCRYPTION_KEY = TEST_KEY
  })

  afterEach(() => {
  })

  it("encrypt then decrypt returns original text", () => {
    const plaintext = "EAAGe0B...long-whatsapp-access-token"
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it("encrypted output has iv:tag:ciphertext format", () => {
    const encrypted = encrypt("test-token")
    const parts = encrypted.split(":")
    expect(parts).toHaveLength(3)
    // Each part should be valid base64
    for (const part of parts) {
      expect(() => Buffer.from(part, "base64")).not.toThrow()
    }
  })

  it("different encryptions of same text produce different ciphertexts (random IV)", () => {
    const plaintext = "same-token-value"
    const encrypted1 = encrypt(plaintext)
    const encrypted2 = encrypt(plaintext)
    expect(encrypted1).not.toBe(encrypted2)
    // But both decrypt to same value
    expect(decrypt(encrypted1)).toBe(plaintext)
    expect(decrypt(encrypted2)).toBe(plaintext)
  })

  it("decrypt handles legacy plaintext (no colons) gracefully", () => {
    const legacyToken = "EAAGe0BAZCZBsBALongTokenWithNoColons"
    const result = decrypt(legacyToken)
    expect(result).toBe(legacyToken)
  })

  it("tampered ciphertext returns original text as fallback", () => {
    const encrypted = encrypt("secret-token")
    const parts = encrypted.split(":")
    const tamperedCiphertext = Buffer.from("tampered-data").toString("base64")
    const tampered = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`
    // decrypt falls back to returning the input for legacy compat
    expect(decrypt(tampered)).toBe(tampered)
  })

  it("tampered auth tag returns original text as fallback", () => {
    const encrypted = encrypt("secret-token")
    const parts = encrypted.split(":")
    const tamperedTag = Buffer.from("0000000000000000").toString("base64")
    const tampered = `${parts[0]}:${tamperedTag}:${parts[2]}`
    expect(decrypt(tampered)).toBe(tampered)
  })

  it("missing ENCRYPTION_KEY throws error on encrypt", () => {
    mockEnv.ENCRYPTION_KEY = ""
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY")
  })

  it("missing ENCRYPTION_KEY throws error on decrypt of encrypted text", () => {
    const encrypted = encrypt("test")
    mockEnv.ENCRYPTION_KEY = ""
    expect(() => decrypt(encrypted)).toThrow("ENCRYPTION_KEY")
  })
})
