"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Check,
  X,
  Plus,
  RefreshCw,
  Loader2,
  Stethoscope,
  Building2,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Phone,
  Clock,
  Timer,
  SkipForward,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { professions, questionsByProfession } from "./professions"
import type { Question } from "./professions"
import type { WorkspaceConfig } from "@/types"
import { getWorkspacePreview, generateWorkspace } from "@/server/actions/workspace"
import { friendlyError } from "@/lib/error-messages"

const TOTAL_STEPS = 5
const ONBOARDING_STORAGE_KEY = "vox-onboarding-state"

const STEP_META = [
  { label: "Profissao", icon: Stethoscope },
  { label: "Perguntas", icon: ClipboardList },
  { label: "Clinica", icon: Building2 },
  { label: "Revisao", icon: Sparkles },
  { label: "Pronto!", icon: CheckCircle2 },
]

const LOADING_MESSAGES = [
  "Analisando sua profissao...",
  "Criando procedimentos personalizados...",
  "Montando campos customizados...",
  "Preparando modelo de anamnese...",
  "Finalizando seu workspace...",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [clinicName, setClinicName] = useState("")
  const [clinicPhone, setClinicPhone] = useState("")
  const [startHour, setStartHour] = useState("8")
  const [endHour, setEndHour] = useState("18")
  const [appointmentDuration, setAppointmentDuration] = useState("30")
  const [preview, setPreview] = useState<WorkspaceConfig | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [newProcedure, setNewProcedure] = useState("")
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  // Restore onboarding state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.step) setStep(data.step)
        if (data.selectedProfession) setSelectedProfession(data.selectedProfession)
        if (data.answers) setAnswers(data.answers)
        if (data.clinicName) setClinicName(data.clinicName)
        if (data.clinicPhone) setClinicPhone(data.clinicPhone)
        if (data.startHour) setStartHour(data.startHour)
        if (data.endHour) setEndHour(data.endHour)
        if (data.appointmentDuration) setAppointmentDuration(data.appointmentDuration)
      }
    } catch {}
  }, [])

  // Persist user inputs to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          step,
          selectedProfession,
          answers,
          clinicName,
          clinicPhone,
          startHour,
          endHour,
          appointmentDuration,
        })
      )
    } catch {}
  }, [step, selectedProfession, answers, clinicName, clinicPhone, startHour, endHour, appointmentDuration])

  // Rotate loading messages while generating
  useEffect(() => {
    if (!isGenerating) {
      setLoadingMessageIndex(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isGenerating])

  const progressPercent = (step / TOTAL_STEPS) * 100
  const questions = selectedProfession
    ? questionsByProfession[selectedProfession] ?? []
    : []

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleMultiSelect(questionId: string, option: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ? prev[questionId].split(",") : []
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      return { ...prev, [questionId]: updated.join(",") }
    })
  }

  async function handleGeneratePreview() {
    if (!selectedProfession) return
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const config = await getWorkspacePreview(selectedProfession, answers)
      setPreview(config)
      setStep(4)
    } catch {
      // If AI fails, generate a minimal fallback preview
      setPreview({
        procedures: [],
        customFields: [],
        anamnesisTemplate: [],
        categories: [],
      })
      setStep(4)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleRegenerate() {
    if (!selectedProfession) return
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const config = await getWorkspacePreview(selectedProfession, answers)
      setPreview(config)
    } catch (err) {
      setGenerateError("Falha ao regenerar. Tente novamente.")
      console.error("[Onboarding] preview generation failed", err)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleConfirmAndSave() {
    if (!selectedProfession || !preview) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await generateWorkspace(selectedProfession, clinicName, {
        procedures: preview.procedures,
        customFields: preview.customFields,
        anamnesisTemplate: preview.anamnesisTemplate,
        categories: preview.categories,
      })
      sessionStorage.removeItem(ONBOARDING_STORAGE_KEY)
      setStep(5)
    } catch (err) {
      setSaveError(friendlyError(err, "Erro ao salvar workspace. Tente novamente."))
      setIsSaving(false)
    }
  }

  function removeProcedure(id: string) {
    if (!preview) return
    setPreview({
      ...preview,
      procedures: preview.procedures.filter((p) => p.id !== id),
    })
  }

  function addProcedure() {
    if (!preview || !newProcedure.trim()) return
    const id = `proc_${Date.now()}`
    setPreview({
      ...preview,
      procedures: [
        ...preview.procedures,
        { id, name: newProcedure.trim(), category: "Geral" },
      ],
    })
    setNewProcedure("")
  }

  function removeCustomField(id: string) {
    if (!preview) return
    setPreview({
      ...preview,
      customFields: preview.customFields.filter((f) => f.id !== id),
    })
  }

  function toggleFieldRequired(id: string) {
    if (!preview) return
    setPreview({
      ...preview,
      customFields: preview.customFields.map((f) =>
        f.id === id ? { ...f, required: !f.required } : f
      ),
    })
  }

  const selectedProfessionData = professions.find((p) => p.id === selectedProfession)

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with branding and progress */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-vox-primary">VoxClinic</span>
            {step <= 4 && (
              <span className="text-sm text-muted-foreground">
                Passo {step} de 4
              </span>
            )}
          </div>
          {/* Progress bar with step indicators */}
          {step <= 4 && (
            <div className="mt-3 flex items-center gap-2">
              {STEP_META.slice(0, 4).map((meta, i) => {
                const stepNum = i + 1
                const Icon = meta.icon
                const isActive = step === stepNum
                const isComplete = step > stepNum
                return (
                  <div key={stepNum} className="flex flex-1 flex-col items-center gap-1">
                    <motion.div
                      className={`h-1.5 w-full rounded-full transition-colors ${
                        isComplete || isActive ? "bg-vox-primary" : "bg-muted"
                      }`}
                      initial={false}
                      animate={{
                        scaleX: isActive ? 1 : isComplete ? 1 : 1,
                        opacity: isComplete || isActive ? 1 : 0.5,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="flex items-center gap-1">
                      <Icon
                        className={`size-3 ${
                          isActive
                            ? "text-vox-primary"
                            : isComplete
                              ? "text-vox-primary/70"
                              : "text-muted-foreground/50"
                        }`}
                      />
                      <span
                        className={`hidden text-xs sm:inline ${
                          isActive
                            ? "font-medium text-vox-primary"
                            : isComplete
                              ? "text-vox-primary/70"
                              : "text-muted-foreground/50"
                        }`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content with animations */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Profession selection */}
            {step === 1 && (
              <div>
                <div className="mb-8">
                  <div className="mb-2 flex items-center gap-2">
                    <Stethoscope className="size-6 text-vox-primary" />
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      Qual e sua profissao?
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    Selecione sua area de atuacao para personalizarmos seu workspace.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {professions.map((prof) => {
                    const Icon = prof.icon
                    const isSelected = selectedProfession === prof.id
                    return (
                      <motion.div
                        key={prof.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedProfession(prof.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setSelectedProfession(prof.id)
                            }
                          }}
                          className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl p-6 transition-all hover:shadow-md ${
                            isSelected
                              ? "border-2 border-vox-primary bg-vox-primary/10 shadow-md dark:bg-vox-primary/20"
                              : "border border-border/40 bg-card hover:border-vox-primary/30"
                          }`}
                        >
                          <div
                            className={`flex size-14 items-center justify-center rounded-xl transition-colors ${
                              isSelected
                                ? "bg-vox-primary/20 dark:bg-vox-primary/30"
                                : "bg-muted"
                            }`}
                          >
                            <Icon
                              className={`size-7 ${
                                isSelected ? "text-vox-primary" : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-vox-primary" : "text-foreground"
                            }`}
                          >
                            {prof.name}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-vox-primary"
                            >
                              <Check className="size-3.5 text-white" />
                            </motion.div>
                          )}
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="mt-8">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedProfession}
                    className="w-full rounded-xl bg-vox-primary text-white hover:bg-vox-primary/90"
                    size="lg"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Contextual questions */}
            {step === 2 && (
              <div>
                <div className="mb-8">
                  <div className="mb-2 flex items-center gap-2">
                    <ClipboardList className="size-6 text-vox-primary" />
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      Conte-nos mais sobre seu trabalho
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    Essas informacoes nos ajudam a personalizar seu workspace.
                  </p>
                </div>

                <div className="space-y-6">
                  {questions.map((q) => (
                    <QuestionField
                      key={q.id}
                      question={q}
                      value={answers[q.id] ?? ""}
                      onChange={(val) => setAnswer(q.id, val)}
                      onToggleMulti={(opt) => toggleMultiSelect(q.id, opt)}
                    />
                  ))}
                </div>

                <div className="mt-8 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="rounded-xl"
                    size="lg"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-xl bg-vox-primary text-white hover:bg-vox-primary/90"
                    size="lg"
                  >
                    Continuar
                  </Button>
                </div>

                {/* Skip option */}
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <SkipForward className="size-3.5" />
                    Pular esta etapa
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Business data */}
            {step === 3 && (
              <div>
                <div className="mb-8">
                  <div className="mb-2 flex items-center gap-2">
                    <Building2 className="size-6 text-vox-primary" />
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      Dados do seu negocio
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    Informe os dados basicos do seu consultorio ou clinica.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Clinic name */}
                  <div>
                    <Label htmlFor="clinicName" className="mb-2 block text-sm font-medium text-foreground">
                      Nome da clinica / consultorio *
                    </Label>
                    <Input
                      id="clinicName"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Ex: Clinica Sorriso"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  {/* Phone (optional) */}
                  <div>
                    <Label htmlFor="clinicPhone" className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Phone className="size-3.5 text-muted-foreground" />
                      Telefone (opcional)
                    </Label>
                    <Input
                      id="clinicPhone"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  {/* Work hours */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Clock className="size-3.5 text-muted-foreground" />
                      Horario de funcionamento
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="mb-1 block text-xs text-muted-foreground">Inicio</span>
                        <Select value={startHour} onValueChange={(v) => v && setStartHour(v)}>
                          <SelectTrigger className="h-10 w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[6, 7, 8, 9, 10, 11, 12, 13, 14].map((h) => (
                              <SelectItem key={h} value={String(h)}>
                                {`${String(h).padStart(2, "0")}:00`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-muted-foreground">Termino</span>
                        <Select value={endHour} onValueChange={(v) => v && setEndHour(v)}>
                          <SelectTrigger className="h-10 w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[14, 15, 16, 17, 18, 19, 20, 21, 22].map((h) => (
                              <SelectItem key={h} value={String(h)}>
                                {`${String(h).padStart(2, "0")}:00`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Appointment duration */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Timer className="size-3.5 text-muted-foreground" />
                      Duracao padrao da consulta
                    </Label>
                    <Select value={appointmentDuration} onValueChange={(v) => v && setAppointmentDuration(v)}>
                      <SelectTrigger className="h-10 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="20">20 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="rounded-xl"
                    size="lg"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleGeneratePreview}
                    disabled={!clinicName.trim() || isGenerating}
                    className="flex-1 rounded-xl bg-vox-primary text-white hover:bg-vox-primary/90"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      "Gerar meu workspace"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Workspace review */}
            {step === 4 && (
              <div>
                {isGenerating ? (
                  <WorkspaceLoadingSkeleton messageIndex={loadingMessageIndex} />
                ) : preview ? (
                  <div>
                    <div className="mb-8">
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="size-6 text-vox-primary" />
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                          Revise seu workspace
                        </h1>
                      </div>
                      <p className="text-muted-foreground">
                        A IA gerou um workspace personalizado. Revise e ajuste conforme necessario.
                      </p>
                    </div>

                    {/* Summary cards */}
                    <div className="mb-6 grid grid-cols-3 gap-3">
                      <Card className="rounded-2xl border-border/40 bg-card p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{preview.procedures.length}</div>
                        <div className="text-xs text-muted-foreground">Procedimentos</div>
                      </Card>
                      <Card className="rounded-2xl border-border/40 bg-card p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{preview.customFields.length}</div>
                        <div className="text-xs text-muted-foreground">Campos</div>
                      </Card>
                      <Card className="rounded-2xl border-border/40 bg-card p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{preview.anamnesisTemplate.length}</div>
                        <div className="text-xs text-muted-foreground">Anamnese</div>
                      </Card>
                    </div>

                    {/* Procedures */}
                    <section className="mb-6">
                      <h2 className="mb-3 text-lg font-semibold text-foreground">Procedimentos</h2>
                      <div className="space-y-2">
                        {preview.procedures.map((proc) => (
                          <div
                            key={proc.id}
                            className="flex items-center justify-between rounded-xl border border-border/40 bg-card px-4 py-3"
                          >
                            <div>
                              <span className="text-sm font-medium text-foreground">{proc.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {proc.category}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProcedure(proc.id)}
                              className="text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Input
                          value={newProcedure}
                          onChange={(e) => setNewProcedure(e.target.value)}
                          placeholder="Novo procedimento"
                          className="h-9 rounded-xl"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addProcedure()
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addProcedure}
                          disabled={!newProcedure.trim()}
                          className="rounded-xl"
                        >
                          <Plus className="size-4" />
                          Adicionar
                        </Button>
                      </div>
                    </section>

                    {/* Custom fields */}
                    <section className="mb-6">
                      <h2 className="mb-3 text-lg font-semibold text-foreground">Campos customizados</h2>
                      <div className="space-y-2">
                        {preview.customFields.map((field) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between rounded-xl border border-border/40 bg-card px-4 py-3"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium text-foreground">{field.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({field.type})
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs ${field.required ? "text-vox-primary" : "text-muted-foreground"}`}
                              >
                                {field.required ? "Obrigatorio" : "Opcional"}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeCustomField(field.id)}
                                className="text-muted-foreground transition-colors hover:text-destructive"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Anamnesis preview */}
                    <section className="mb-8">
                      <h2 className="mb-3 text-lg font-semibold text-foreground">Anamnese</h2>
                      <div className="space-y-2">
                        {preview.anamnesisTemplate.map((q, i) => (
                          <div
                            key={q.id}
                            className="rounded-xl border border-border/40 bg-card px-4 py-3"
                          >
                            <span className="text-sm text-muted-foreground">
                              {i + 1}.{" "}
                            </span>
                            <span className="text-sm text-foreground">{q.question}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({q.type})
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Error messages */}
                    {(saveError || generateError) && (
                      <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="size-4 shrink-0" />
                        {saveError || generateError}
                      </div>
                    )}

                    {/* Personalizar depois option */}
                    <div className="mb-4 flex justify-center">
                      <button
                        type="button"
                        onClick={handleConfirmAndSave}
                        disabled={isSaving}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Personalizar depois nas configuracoes
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep(3)}
                        className="rounded-xl"
                        size="lg"
                      >
                        Voltar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="rounded-xl"
                        size="lg"
                      >
                        <RefreshCw className={`size-4 ${isGenerating ? "animate-spin" : ""}`} />
                        Regenerar
                      </Button>
                      <Button
                        onClick={handleConfirmAndSave}
                        disabled={isSaving}
                        className="flex-1 rounded-xl bg-vox-primary text-white hover:bg-vox-primary/90"
                        size="lg"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Confirmar e Comecar"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div className="flex flex-col items-center py-12 text-center">
                {/* Animated checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mb-6 flex size-20 items-center justify-center rounded-full bg-vox-primary/10 dark:bg-vox-primary/20"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                  >
                    <CheckCircle2 className="size-10 text-vox-primary" />
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-2 text-2xl font-bold tracking-tight text-foreground"
                >
                  Tudo pronto!
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-8 text-muted-foreground"
                >
                  Seu workspace foi configurado com sucesso.
                </motion.p>

                {/* Summary cards */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-8 grid w-full max-w-md grid-cols-2 gap-3"
                >
                  <Card className="rounded-2xl border-border/40 bg-card p-4">
                    <div className="text-xs text-muted-foreground">Profissao</div>
                    <div className="text-sm font-medium text-foreground">
                      {selectedProfessionData?.name ?? "---"}
                    </div>
                  </Card>
                  <Card className="rounded-2xl border-border/40 bg-card p-4">
                    <div className="text-xs text-muted-foreground">Clinica</div>
                    <div className="truncate text-sm font-medium text-foreground">
                      {clinicName || "---"}
                    </div>
                  </Card>
                  <Card className="rounded-2xl border-border/40 bg-card p-4">
                    <div className="text-xs text-muted-foreground">Procedimentos</div>
                    <div className="text-sm font-medium text-foreground">
                      {preview?.procedures.length ?? 0} cadastrados
                    </div>
                  </Card>
                  <Card className="rounded-2xl border-border/40 bg-card p-4">
                    <div className="text-xs text-muted-foreground">Consultas</div>
                    <div className="text-sm font-medium text-foreground">
                      {appointmentDuration} min cada
                    </div>
                  </Card>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex w-full max-w-md flex-col gap-3"
                >
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="w-full rounded-xl bg-vox-primary text-white hover:bg-vox-primary/90"
                    size="lg"
                  >
                    Ir para o painel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard?tour=true")}
                    className="w-full rounded-xl"
                    size="lg"
                  >
                    Ver tour guiado
                  </Button>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function QuestionField({
  question,
  value,
  onChange,
  onToggleMulti,
}: {
  question: Question
  value: string
  onChange: (val: string) => void
  onToggleMulti: (option: string) => void
}) {
  const selectedMulti = value ? value.split(",") : []

  if (question.type === "boolean") {
    return (
      <div>
        <Label className="mb-3 block text-sm font-medium text-foreground">{question.label}</Label>
        <div className="flex gap-3">
          {["Sim", "Nao"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-xl border px-6 py-2.5 text-sm font-medium transition-all ${
                value === opt
                  ? "border-vox-primary bg-vox-primary/10 text-vox-primary dark:bg-vox-primary/20"
                  : "border-border/40 bg-card text-foreground hover:border-vox-primary/30"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === "select") {
    return (
      <div>
        <Label className="mb-3 block text-sm font-medium text-foreground">{question.label}</Label>
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-xl border px-4 py-2 text-sm transition-all ${
                value === opt
                  ? "border-vox-primary bg-vox-primary/10 font-medium text-vox-primary dark:bg-vox-primary/20"
                  : "border-border/40 bg-card text-foreground hover:border-vox-primary/30"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // multi-select
  return (
    <div>
      <Label className="mb-3 block text-sm font-medium text-foreground">{question.label}</Label>
      <div className="flex flex-wrap gap-2">
        {question.options?.map((opt) => {
          const isActive = selectedMulti.includes(opt)
          return (
            <motion.button
              key={opt}
              type="button"
              onClick={() => onToggleMulti(opt)}
              whileTap={{ scale: 0.95 }}
              className={`rounded-xl border px-4 py-2 text-sm transition-all ${
                isActive
                  ? "border-vox-primary bg-vox-primary/10 font-medium text-vox-primary dark:bg-vox-primary/20"
                  : "border-border/40 bg-card text-foreground hover:border-vox-primary/30"
              }`}
            >
              {isActive && <Check className="mr-1.5 inline size-3.5" />}
              {opt}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function WorkspaceLoadingSkeleton({ messageIndex }: { messageIndex: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="size-6 text-vox-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Gerando seu workspace personalizado...
        </h1>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="mb-8 text-muted-foreground"
        >
          {LOADING_MESSAGES[messageIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Pulsing loader */}
      <div className="mb-8 flex justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex size-16 items-center justify-center rounded-full bg-vox-primary/10 dark:bg-vox-primary/20"
        >
          <Loader2 className="size-8 animate-spin text-vox-primary" />
        </motion.div>
      </div>

      <div className="space-y-6">
        <div>
          <Skeleton className="mb-3 h-6 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="mb-3 h-6 w-48" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="mb-3 h-6 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
