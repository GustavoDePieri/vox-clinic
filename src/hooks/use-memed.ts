"use client"

import { useEffect, useRef, useState, useCallback } from "react"

declare global {
  interface Window {
    MdSinapsePrescricao?: {
      event: {
        add: (event: string, callback: (data: unknown) => void) => void
        remove: (event: string) => void
      }
    }
    MdHub?: {
      command: {
        send: (module: string, command: string, data?: unknown) => void
      }
      module: {
        show: (module: string) => void
        hide: (module: string) => void
      }
      event: {
        add: (event: string, callback: (data: unknown) => void) => void
        remove: (event: string) => void
      }
    }
  }
}

export interface MemedPatient {
  nome: string
  cpf?: string
  telefone?: string
  idExterno: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrescricaoImpressaPayload = any

interface UseMemedOptions {
  onPrescricaoImpressa?: (payload: PrescricaoImpressaPayload) => void
}

interface UseMemedReturn {
  isReady: boolean
  isLoading: boolean
  error: string | null
  showPrescription: (patient: MemedPatient) => void
  hidePrescription: () => void
}

const SCRIPT_ID = "memed-sinapse-prescricao"

export function useMemed(
  token: string | null,
  options?: UseMemedOptions
): UseMemedReturn {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const callbackRef = useRef(options?.onPrescricaoImpressa)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Keep callback ref up to date without triggering effect re-runs
  callbackRef.current = options?.onPrescricaoImpressa

  useEffect(() => {
    if (!token) {
      setIsReady(false)
      setIsLoading(false)
      return
    }

    // If script already loaded with same token, skip
    const existingScript = document.getElementById(SCRIPT_ID)
    if (existingScript) {
      // Script already in DOM — check if module is already initialized
      if (window.MdHub) {
        setIsReady(true)
        setIsLoading(false)
        setupEventListeners()
        return
      }
    }

    setIsLoading(true)
    setError(null)

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = `https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js`
    script.dataset.token = token
    script.dataset.color = "#14B8A6" // vox-primary
    script.async = true

    const handleModuleInit = () => {
      setIsReady(true)
      setIsLoading(false)
      setupEventListeners()
    }

    const handleScriptError = () => {
      setError("Falha ao carregar o modulo Memed. Tente novamente mais tarde.")
      setIsLoading(false)
    }

    // Listen for Memed module init event
    const initListener = () => {
      if (window.MdSinapsePrescricao) {
        window.MdSinapsePrescricao.event.add(
          "core:moduleInit",
          handleModuleInit
        )
      }
    }

    script.addEventListener("load", initListener)
    script.addEventListener("error", handleScriptError)

    // Timeout fallback — if module doesn't init in 15s, show error
    const timeout = setTimeout(() => {
      if (!isReady) {
        setError("Memed demorou para responder. Tente novamente.")
        setIsLoading(false)
      }
    }, 15000)

    document.body.appendChild(script)

    return () => {
      clearTimeout(timeout)
      script.removeEventListener("load", initListener)
      script.removeEventListener("error", handleScriptError)

      // Clean up event listeners
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }

      // Remove script from DOM
      const scriptEl = document.getElementById(SCRIPT_ID)
      if (scriptEl) {
        scriptEl.remove()
      }

      setIsReady(false)
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function setupEventListeners() {
    if (!window.MdHub) return

    const handlePrescricao = (data: unknown) => {
      callbackRef.current?.(data)
    }

    window.MdHub.event.add("prescricaoImpressa", handlePrescricao)

    cleanupRef.current = () => {
      if (window.MdHub) {
        window.MdHub.event.remove("prescricaoImpressa")
      }
    }
  }

  const showPrescription = useCallback(
    (patient: MemedPatient) => {
      if (!window.MdHub || !isReady) {
        console.warn("[useMemed] MdHub not ready")
        return
      }

      // Set patient context
      window.MdHub.command.send(
        "plataforma.prescricao",
        "setPaciente",
        {
          nome: patient.nome,
          cpf: patient.cpf || undefined,
          telefone: patient.telefone || undefined,
          idExterno: patient.idExterno,
        }
      )

      // Show the prescription module
      window.MdHub.module.show("plataforma.prescricao")
    },
    [isReady]
  )

  const hidePrescription = useCallback(() => {
    if (!window.MdHub) return
    window.MdHub.module.hide("plataforma.prescricao")
  }, [])

  return {
    isReady,
    isLoading,
    error,
    showPrescription,
    hidePrescription,
  }
}
