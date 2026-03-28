"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { updateTourStep, completeTour, resetTour as resetTourAction } from "@/server/actions/tour"
import { desktopTourSteps, mobileTourSteps } from "./tour-steps"
import type { TourStep } from "./tour-steps"

interface TourContextValue {
  /** Whether the tour is currently active/running */
  isActive: boolean
  /** Current step index (0-based) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Whether the user has completed the tour at least once */
  hasCompleted: boolean
  /** The current step definition, or null if not active */
  currentStepDef: TourStep | null
  /** Start the tour from step 0 (or resume from saved step) */
  startTour: () => void
  /** Advance to next step */
  nextStep: () => void
  /** Go back to previous step */
  prevStep: () => void
  /** Skip/dismiss the tour */
  skipTour: () => void
  /** Reset tour state (for "Refazer tour" in settings) */
  resetTour: () => Promise<void>
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return ctx
}

/**
 * Optional hook that returns null if outside provider.
 * Useful for components that may or may not be wrapped.
 */
export function useTourOptional() {
  return useContext(TourContext)
}

interface TourProviderProps {
  children: React.ReactNode
  initialTourCompleted: boolean
  initialTourStep: number
}

export function TourProvider({
  children,
  initialTourCompleted,
  initialTourStep,
}: TourProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompleted, setHasCompleted] = useState(initialTourCompleted)

  // Detect mobile vs desktop for step array selection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)")
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  const steps = isMobile ? mobileTourSteps : desktopTourSteps

  // Auto-start tour for new users after a short delay
  useEffect(() => {
    if (!initialTourCompleted && initialTourStep === 0) {
      const timer = setTimeout(() => {
        setIsActive(true)
        setCurrentStep(0)
      }, 500)
      return () => clearTimeout(timer)
    }
    // Resume from saved step
    if (!initialTourCompleted && initialTourStep > 0 && initialTourStep <= 10) {
      const timer = setTimeout(() => {
        setIsActive(true)
        setCurrentStep(initialTourStep - 1) // tourStep is 1-based in DB, 0-based here
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [initialTourCompleted, initialTourStep])

  const startTour = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
    setHasCompleted(false)
    // Persist step 1 (1-based)
    updateTourStep(1).catch(() => {})
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1
      if (next >= steps.length) {
        // Tour complete
        setIsActive(false)
        setHasCompleted(true)
        completeTour().catch(() => {})
        return prev
      }
      // Persist step (1-based)
      updateTourStep(next + 1).catch(() => {})
      return next
    })
  }, [steps.length])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.max(0, prev - 1)
      updateTourStep(next + 1).catch(() => {})
      return next
    })
  }, [])

  const skipTour = useCallback(() => {
    setIsActive(false)
    setHasCompleted(true)
    completeTour().catch(() => {})
  }, [])

  const resetTour = useCallback(async () => {
    const result = await resetTourAction()
    if ("error" in result) return
    setHasCompleted(false)
    setCurrentStep(0)
    setIsActive(true)
    // Persist step 1 (1-based)
    updateTourStep(1).catch(() => {})
  }, [])

  const currentStepDef = isActive ? steps[currentStep] ?? null : null

  const value = useMemo<TourContextValue>(
    () => ({
      isActive,
      currentStep,
      totalSteps: steps.length,
      hasCompleted,
      currentStepDef,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      resetTour,
    }),
    [
      isActive,
      currentStep,
      steps.length,
      hasCompleted,
      currentStepDef,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      resetTour,
    ]
  )

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}
