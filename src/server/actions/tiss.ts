"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ERR_UNAUTHORIZED, ERR_WORKSPACE_NOT_CONFIGURED, ERR_TISS_NOT_CONFIGURED, ERR_TISS_GUIDE_NOT_FOUND, ERR_TISS_MISSING_PROFESSIONAL, ERR_OPERADORA_NOT_FOUND, ERR_PATIENT_NOT_FOUND, ActionError, safeAction } from "@/lib/error-messages"
import { logAudit } from "@/lib/audit"
import {
  buildGuiaConsultaXml,
  buildGuiaSpSadtXml,
  buildLoteGuiasXml,
  buildGuideContentXml,
  computeTissHash,
} from "@/lib/tiss/xml-builder"
import type {
  TissConfigData,
  OperadoraData,
  PatientData,
  ProfessionalData,
  TissGuideData,
  TissProcedure,
} from "@/lib/tiss/xml-builder"

// ============================================================
// Auth helper (duplicated per Vercel bundler issue — see CLAUDE.md)
// ============================================================

async function getAuthContext() {
  const { userId } = await auth()
  if (!userId) throw new Error(ERR_UNAUTHORIZED)

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { workspace: true, memberships: { select: { workspaceId: true }, take: 1 } },
  })

  const workspaceId = user?.workspace?.id ?? user?.memberships?.[0]?.workspaceId
  if (!workspaceId) throw new Error(ERR_WORKSPACE_NOT_CONFIGURED)

  return { workspaceId, userId: user!.id, clerkId: userId }
}

// ============================================================
// createTissGuide
// ============================================================

export const createTissGuide = safeAction(async (data: {
  type: "consulta" | "sp_sadt"
  operadoraId: string
  patientId: string
  appointmentId?: string
  numeroCarteira: string
  validadeCarteira?: string // ISO date
  codigoConsulta?: string
  procedimentos?: TissProcedure[]
  dataAtendimento: string // ISO date
  tipoAtendimento?: string
  indicacaoClinica?: string
  observacao?: string
  valorTotal: number // centavos
  cidCode?: string
  cidDescription?: string
}) => {
  const { workspaceId, userId, clerkId } = await getAuthContext()

  // Load TISS config
  const config = await db.tissConfig.findUnique({ where: { workspaceId } })
  if (!config) throw new ActionError(ERR_TISS_NOT_CONFIGURED)

  // Validate professional data is complete
  if (!config.conselhoProfissional || !config.numeroConselho || !config.ufConselho || !config.cbos) {
    throw new ActionError(ERR_TISS_MISSING_PROFESSIONAL)
  }

  // Validate operadora belongs to workspace
  const operadora = await db.operadora.findFirst({
    where: { id: data.operadoraId, workspaceId },
  })
  if (!operadora) throw new ActionError(ERR_OPERADORA_NOT_FOUND)

  // Validate patient belongs to workspace
  const patient = await db.patient.findFirst({
    where: { id: data.patientId, workspaceId, isActive: true },
  })
  if (!patient) throw new ActionError(ERR_PATIENT_NOT_FOUND)

  // Validate appointment if provided
  if (data.appointmentId) {
    const appointment = await db.appointment.findFirst({
      where: { id: data.appointmentId, workspaceId },
    })
    if (!appointment) throw new ActionError("Consulta nao encontrada.")
  }

  // Validate required fields
  if (!data.numeroCarteira.trim()) {
    throw new ActionError("Numero da carteirinha e obrigatorio.")
  }
  if (data.valorTotal <= 0) {
    throw new ActionError("Valor total deve ser maior que zero.")
  }
  if (data.type === "sp_sadt" && (!data.procedimentos || data.procedimentos.length === 0)) {
    throw new ActionError("Guia SP/SADT deve ter pelo menos um procedimento.")
  }

  // Auto-increment guide number inside transaction
  return await db.$transaction(async (tx) => {
    // Lock and increment sequencialGuia
    const updatedConfig = await tx.tissConfig.update({
      where: { workspaceId },
      data: { sequencialGuia: { increment: 1 } },
    })

    const guideNumber = String(updatedConfig.sequencialGuia).padStart(10, "0")

    // Prepare user data for XML builder
    const user = await tx.user.findFirst({
      where: { workspace: { id: workspaceId } },
      select: { name: true, clinicName: true },
    })

    // Get NFS-e config for CNPJ (reuse clinic CNPJ)
    const nfseConfig = await tx.nfseConfig.findUnique({
      where: { workspaceId },
      select: { cnpj: true },
    })

    const cnpjPrestador = nfseConfig?.cnpj || config.codigoPrestador || ""

    const professionalData: ProfessionalData = {
      conselhoProfissional: config.conselhoProfissional!,
      numeroConselho: config.numeroConselho!,
      ufConselho: config.ufConselho!,
      nome: user?.name || user?.clinicName || "Profissional",
      cbos: config.cbos!,
    }

    const operadoraData: OperadoraData = {
      registroAns: operadora.registroAns,
      nome: operadora.nome,
      cnpj: operadora.cnpj,
    }

    const patientInsuranceData = patient.insuranceData as {
      cardNumber?: string
      planName?: string
      validUntil?: string
    } | null

    const patientData: PatientData = {
      name: patient.name,
      document: patient.document,
      birthDate: patient.birthDate,
      insuranceData: patientInsuranceData,
    }

    const guideData: TissGuideData = {
      id: "", // will be set after create
      type: data.type,
      numeroGuia: guideNumber,
      numeroCarteira: data.numeroCarteira.trim(),
      validadeCarteira: data.validadeCarteira ? new Date(data.validadeCarteira) : null,
      codigoConsulta: data.codigoConsulta,
      procedimentos: data.procedimentos || [],
      dataAtendimento: new Date(data.dataAtendimento),
      tipoAtendimento: data.tipoAtendimento,
      indicacaoClinica: data.indicacaoClinica,
      observacao: data.observacao,
      valorTotal: data.valorTotal,
      cidCode: data.cidCode,
      cidDescription: data.cidDescription,
    }

    const configData: TissConfigData = {
      cnes: config.cnes,
      codigoPrestador: config.codigoPrestador,
      cbos: config.cbos,
      conselhoProfissional: config.conselhoProfissional,
      numeroConselho: config.numeroConselho,
      ufConselho: config.ufConselho,
      versaoTiss: config.versaoTiss,
      sequencialGuia: updatedConfig.sequencialGuia,
    }

    // Generate XML
    let xmlContent: string
    if (data.type === "consulta") {
      xmlContent = buildGuiaConsultaXml(
        guideData, configData, operadoraData, patientData, professionalData,
        cnpjPrestador, updatedConfig.sequencialGuia
      )
    } else {
      xmlContent = buildGuiaSpSadtXml(
        guideData, configData, operadoraData, patientData, professionalData,
        cnpjPrestador, updatedConfig.sequencialGuia
      )
    }

    const xmlHash = computeTissHash(xmlContent)

    // Create guide record
    const guide = await tx.tissGuide.create({
      data: {
        workspaceId,
        operadoraId: data.operadoraId,
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        type: data.type,
        numeroGuia: guideNumber,
        numeroCarteira: data.numeroCarteira.trim(),
        validadeCarteira: data.validadeCarteira ? new Date(data.validadeCarteira) : null,
        codigoConsulta: data.codigoConsulta || null,
        procedimentos: JSON.parse(JSON.stringify(data.procedimentos || [])),
        dataAtendimento: new Date(data.dataAtendimento),
        tipoAtendimento: data.tipoAtendimento || null,
        indicacaoClinica: data.indicacaoClinica || null,
        observacao: data.observacao || null,
        valorTotal: data.valorTotal,
        cidCode: data.cidCode || null,
        cidDescription: data.cidDescription || null,
        xmlContent,
        xmlHash,
        createdBy: clerkId,
      },
      include: {
        operadora: { select: { id: true, nome: true, registroAns: true } },
        patient: { select: { id: true, name: true } },
      },
    })

    logAudit({
      workspaceId,
      userId,
      action: "tiss_guide.create",
      entityType: "TissGuide",
      entityId: guide.id,
      details: {
        type: data.type,
        numeroGuia: guideNumber,
        operadora: operadora.nome,
        patient: patient.name,
        valorTotal: data.valorTotal,
      },
    })

    return {
      id: guide.id,
      type: guide.type,
      numeroGuia: guide.numeroGuia,
      status: guide.status,
      valorTotal: guide.valorTotal,
      operadora: { id: operadora.id, nome: operadora.nome, registroAns: operadora.registroAns },
      patient: { id: patient.id, name: patient.name },
      createdAt: guide.createdAt.toISOString(),
    }
  })
})

// ============================================================
// getTissGuides (paginated, filtered)
// ============================================================

export async function getTissGuides(filters?: {
  status?: string
  operadoraId?: string
  patientId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}) {
  const { workspaceId } = await getAuthContext()

  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = { workspaceId }

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status
  }
  if (filters?.operadoraId) {
    where.operadoraId = filters.operadoraId
  }
  if (filters?.patientId) {
    where.patientId = filters.patientId
  }
  if (filters?.startDate || filters?.endDate) {
    const dateFilter: Record<string, Date> = {}
    if (filters?.startDate) dateFilter.gte = new Date(filters.startDate)
    if (filters?.endDate) {
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }
    where.dataAtendimento = dateFilter
  }

  const [guides, total] = await Promise.all([
    db.tissGuide.findMany({
      where,
      include: {
        operadora: { select: { id: true, nome: true, registroAns: true } },
        patient: { select: { id: true, name: true } },
        appointment: { select: { id: true, date: true, procedures: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.tissGuide.count({ where }),
  ])

  return {
    guides: guides.map((g) => ({
      id: g.id,
      type: g.type,
      numeroGuia: g.numeroGuia,
      status: g.status,
      valorTotal: g.valorTotal,
      paidAmount: g.paidAmount,
      glosaAmount: g.glosaAmount,
      dataAtendimento: g.dataAtendimento.toISOString(),
      operadora: g.operadora,
      patient: g.patient,
      appointment: g.appointment ? {
        id: g.appointment.id,
        date: g.appointment.date.toISOString(),
        procedures: g.appointment.procedures,
      } : null,
      createdAt: g.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ============================================================
// getTissGuide (single)
// ============================================================

export async function getTissGuide(id: string) {
  const { workspaceId } = await getAuthContext()

  const guide = await db.tissGuide.findFirst({
    where: { id, workspaceId },
    include: {
      operadora: { select: { id: true, nome: true, registroAns: true, cnpj: true } },
      patient: { select: { id: true, name: true, document: true, insurance: true } },
      appointment: { select: { id: true, date: true, procedures: true, status: true } },
    },
  })

  if (!guide) return null

  return {
    id: guide.id,
    type: guide.type,
    numeroGuia: guide.numeroGuia,
    numeroCarteira: guide.numeroCarteira,
    validadeCarteira: guide.validadeCarteira?.toISOString() ?? null,
    codigoConsulta: guide.codigoConsulta,
    procedimentos: guide.procedimentos,
    dataAtendimento: guide.dataAtendimento.toISOString(),
    tipoAtendimento: guide.tipoAtendimento,
    indicacaoClinica: guide.indicacaoClinica,
    observacao: guide.observacao,
    valorTotal: guide.valorTotal,
    paidAmount: guide.paidAmount,
    glosaAmount: guide.glosaAmount,
    glosaMotivo: guide.glosaMotivo,
    cidCode: guide.cidCode,
    cidDescription: guide.cidDescription,
    status: guide.status,
    submittedAt: guide.submittedAt?.toISOString() ?? null,
    paidAt: guide.paidAt?.toISOString() ?? null,
    xmlContent: guide.xmlContent,
    xmlHash: guide.xmlHash,
    chargeId: guide.chargeId,
    operadora: guide.operadora,
    patient: guide.patient,
    appointment: guide.appointment ? {
      id: guide.appointment.id,
      date: guide.appointment.date.toISOString(),
      procedures: guide.appointment.procedures,
      status: guide.appointment.status,
    } : null,
    createdAt: guide.createdAt.toISOString(),
  }
}

// ============================================================
// updateTissGuideStatus
// ============================================================

export const updateTissGuideStatus = safeAction(async (id: string, status: string, extra?: {
  paidAmount?: number
  glosaAmount?: number
  glosaMotivo?: string
}) => {
  const { workspaceId, userId } = await getAuthContext()

  const guide = await db.tissGuide.findFirst({
    where: { id, workspaceId },
  })
  if (!guide) throw new ActionError(ERR_TISS_GUIDE_NOT_FOUND)

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    draft: ["submitted", "cancelled"],
    submitted: ["paid", "denied", "cancelled"],
    paid: [], // terminal
    denied: ["submitted"], // can resubmit (appeal)
    cancelled: [], // terminal
  }

  const allowed = validTransitions[guide.status]
  if (!allowed || !allowed.includes(status)) {
    throw new ActionError(`Nao e possivel alterar status de "${guide.status}" para "${status}".`)
  }

  const updateData: Record<string, unknown> = { status }

  if (status === "submitted") {
    updateData.submittedAt = new Date()
  }
  if (status === "paid") {
    updateData.paidAt = new Date()
    if (extra?.paidAmount !== undefined) {
      updateData.paidAmount = extra.paidAmount
    }
  }
  if (status === "denied") {
    if (extra?.glosaAmount !== undefined) {
      updateData.glosaAmount = extra.glosaAmount
    }
    if (extra?.glosaMotivo) {
      updateData.glosaMotivo = extra.glosaMotivo
    }
  }

  await db.tissGuide.update({
    where: { id },
    data: updateData,
  })

  logAudit({
    workspaceId,
    userId,
    action: "tiss_guide.status_update",
    entityType: "TissGuide",
    entityId: id,
    details: { from: guide.status, to: status, ...extra },
  })

  return { success: true, status }
})

// ============================================================
// generateTissBatch
// ============================================================

export const generateTissBatch = safeAction(async (guideIds: string[]) => {
  const { workspaceId, userId } = await getAuthContext()

  if (guideIds.length === 0) {
    throw new ActionError("Selecione pelo menos uma guia para gerar o lote.")
  }

  // Load TISS config
  const config = await db.tissConfig.findUnique({ where: { workspaceId } })
  if (!config) throw new ActionError(ERR_TISS_NOT_CONFIGURED)
  if (!config.conselhoProfissional || !config.numeroConselho || !config.ufConselho || !config.cbos) {
    throw new ActionError(ERR_TISS_MISSING_PROFESSIONAL)
  }

  // Load NFS-e config for CNPJ
  const nfseConfig = await db.nfseConfig.findUnique({
    where: { workspaceId },
    select: { cnpj: true },
  })
  const cnpjPrestador = nfseConfig?.cnpj || config.codigoPrestador || ""

  // Load all guides
  const guides = await db.tissGuide.findMany({
    where: { id: { in: guideIds }, workspaceId },
    include: {
      operadora: true,
      patient: true,
    },
  })

  if (guides.length !== guideIds.length) {
    throw new ActionError("Uma ou mais guias nao foram encontradas.")
  }

  // All guides must be draft status
  const nonDraft = guides.filter((g) => g.status !== "draft")
  if (nonDraft.length > 0) {
    throw new ActionError(`${nonDraft.length} guia(s) nao estao em rascunho. Apenas guias em rascunho podem ser incluidas no lote.`)
  }

  // All guides must be for the same operadora
  const operadoraIds = new Set(guides.map((g) => g.operadoraId))
  if (operadoraIds.size > 1) {
    throw new ActionError("Todas as guias do lote devem ser da mesma operadora.")
  }

  const user = await db.user.findFirst({
    where: { workspace: { id: workspaceId } },
    select: { name: true, clinicName: true },
  })

  const professionalData: ProfessionalData = {
    conselhoProfissional: config.conselhoProfissional!,
    numeroConselho: config.numeroConselho!,
    ufConselho: config.ufConselho!,
    nome: user?.name || user?.clinicName || "Profissional",
    cbos: config.cbos!,
  }

  const configData: TissConfigData = {
    cnes: config.cnes,
    codigoPrestador: config.codigoPrestador,
    cbos: config.cbos,
    conselhoProfissional: config.conselhoProfissional,
    numeroConselho: config.numeroConselho,
    ufConselho: config.ufConselho,
    versaoTiss: config.versaoTiss,
    sequencialGuia: config.sequencialGuia,
  }

  // Build individual guide XML contents (without envelope)
  const guideContents: string[] = []
  for (const guide of guides) {
    const patientInsuranceData = guide.patient.insuranceData as {
      cardNumber?: string
      planName?: string
      validUntil?: string
    } | null

    const patientData: PatientData = {
      name: guide.patient.name,
      document: guide.patient.document,
      birthDate: guide.patient.birthDate,
      insuranceData: patientInsuranceData,
    }

    const operadoraData: OperadoraData = {
      registroAns: guide.operadora.registroAns,
      nome: guide.operadora.nome,
      cnpj: guide.operadora.cnpj,
    }

    const guideData: TissGuideData = {
      id: guide.id,
      type: guide.type as "consulta" | "sp_sadt",
      numeroGuia: guide.numeroGuia,
      numeroCarteira: guide.numeroCarteira,
      validadeCarteira: guide.validadeCarteira,
      codigoConsulta: guide.codigoConsulta,
      procedimentos: guide.procedimentos as unknown as TissProcedure[],
      dataAtendimento: guide.dataAtendimento,
      tipoAtendimento: guide.tipoAtendimento,
      indicacaoClinica: guide.indicacaoClinica,
      observacao: guide.observacao,
      valorTotal: guide.valorTotal,
      cidCode: guide.cidCode,
      cidDescription: guide.cidDescription,
    }

    guideContents.push(buildGuideContentXml(guideData, configData, operadoraData, patientData, professionalData))
  }

  const operadora = guides[0].operadora
  const sequencialTransacao = config.sequencialGuia + 1
  const numeroLote = String(sequencialTransacao).padStart(12, "0")

  const batchXml = buildLoteGuiasXml(
    guideContents,
    configData,
    cnpjPrestador,
    operadora.registroAns,
    sequencialTransacao,
    numeroLote
  )

  // Update guides with batch info
  await db.tissGuide.updateMany({
    where: { id: { in: guideIds } },
    data: { status: "submitted", submittedAt: new Date() },
  })

  logAudit({
    workspaceId,
    userId,
    action: "tiss_batch.generate",
    entityType: "TissGuide",
    entityId: numeroLote,
    details: { guideIds, operadora: operadora.nome, count: guides.length },
  })

  return {
    xml: batchXml,
    numeroLote,
    guideCount: guides.length,
  }
})

// ============================================================
// searchAppointmentsForTiss
// ============================================================

export async function searchAppointmentsForTiss(patientQuery: string) {
  const { workspaceId } = await getAuthContext()

  if (!patientQuery.trim()) return []

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const appointments = await db.appointment.findMany({
    where: {
      workspaceId,
      status: "completed",
      date: { gte: sixMonthsAgo },
      patient: {
        name: { contains: patientQuery, mode: "insensitive" },
        isActive: true,
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          insurance: true,
          insuranceData: true,
        },
      },
      tissGuides: {
        where: { status: { notIn: ["cancelled"] } },
        select: { id: true },
      },
    },
    orderBy: { date: "desc" },
    take: 20,
  })

  return appointments.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    price: a.price,
    status: a.status,
    procedures: a.procedures,
    patient: {
      id: a.patient.id,
      name: a.patient.name,
      insurance: a.patient.insurance,
      insuranceData: a.patient.insuranceData,
    },
    hasTissGuide: a.tissGuides.length > 0,
  }))
}
