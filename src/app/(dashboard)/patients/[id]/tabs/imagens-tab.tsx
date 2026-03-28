"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Camera,
  Grid3x3,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Link2,
  Link2Off,
  X,
  ImageIcon,
  ZoomIn,
} from "lucide-react"
import {
  getPatientImages,
  uploadImage,
  updateImage,
  deleteImage,
  pairImages,
  unpairImage,
} from "@/server/actions/clinical-image"
import { compressImage } from "@/lib/image-compress"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import type { ClinicalImageItem } from "./types"

// ============================================================
// Constants
// ============================================================

const BODY_REGIONS = [
  { value: "face", label: "Face" },
  { value: "torso_front", label: "Torso (frente)" },
  { value: "torso_back", label: "Torso (costas)" },
  { value: "arm", label: "Braco" },
  { value: "leg", label: "Perna" },
  { value: "mouth", label: "Boca" },
  { value: "teeth", label: "Dentes" },
  { value: "skin", label: "Pele" },
  { value: "other", label: "Outro" },
]

const CATEGORIES = [
  { value: "general", label: "Geral" },
  { value: "before", label: "Antes" },
  { value: "after", label: "Depois" },
  { value: "progress", label: "Progresso" },
  { value: "intraoral", label: "Intraoral" },
]

function getCategoryColor(category: string) {
  switch (category) {
    case "before": return "bg-amber-100 text-amber-700 border-amber-200"
    case "after": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "progress": return "bg-blue-100 text-blue-700 border-blue-200"
    case "intraoral": return "bg-purple-100 text-purple-700 border-purple-200"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

function getCategoryLabel(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category
}

function getBodyRegionLabel(region: string | null) {
  if (!region) return null
  return BODY_REGIONS.find((r) => r.value === region)?.label ?? region
}

function formatSize(bytes: number | null) {
  if (!bytes) return "--"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ============================================================
// Main Component
// ============================================================

export default function ImagensTab({ patientId }: { patientId: string }) {
  const [images, setImages] = useState<ClinicalImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid")
  const [filterRegion, setFilterRegion] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadRegion, setUploadRegion] = useState<string>("")
  const [uploadCategory, setUploadCategory] = useState<string>("general")
  const [uploadNotes, setUploadNotes] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Edit metadata dialog
  const [editDialog, setEditDialog] = useState<{ open: boolean; image: ClinicalImageItem | null }>({
    open: false,
    image: null,
  })
  const [editRegion, setEditRegion] = useState<string>("")
  const [editCategory, setEditCategory] = useState<string>("general")
  const [editNotes, setEditNotes] = useState<string>("")
  const [editSaving, setEditSaving] = useState(false)

  // Pair dialog
  const [pairDialog, setPairDialog] = useState<{ open: boolean; sourceImage: ClinicalImageItem | null }>({
    open: false,
    sourceImage: null,
  })

  // Before/After comparison
  const [comparisonDialog, setComparisonDialog] = useState<{
    open: boolean
    before: ClinicalImageItem | null
    after: ClinicalImageItem | null
  }>({ open: false, before: null, after: null })

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ open: false, title: "", description: "", onConfirm: () => {} })

  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm })
  }

  // ============================================================
  // Data Loading
  // ============================================================

  const loadImages = useCallback(async () => {
    try {
      const filters: Record<string, string> = {}
      if (filterRegion && filterRegion !== "all") filters.bodyRegion = filterRegion
      if (filterCategory && filterCategory !== "all") filters.category = filterCategory
      const data = await getPatientImages(patientId, filters)
      setImages(data)
    } catch {
      setImages([])
    } finally {
      setLoading(false)
    }
  }, [patientId, filterRegion, filterCategory])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  // ============================================================
  // Upload Handlers
  // ============================================================

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem excede o limite de 10MB.")
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.")
      return
    }
    setUploadFile(file)
    setUploadPreview(URL.createObjectURL(file))
    setUploadDialogOpen(true)
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleUploadConfirm() {
    if (!uploadFile) return
    setUploading(true)
    try {
      // Compress image before upload
      const compressed = await compressImage(uploadFile, 2048, 0.85)
      const fd = new FormData()
      fd.append("file", compressed, uploadFile.name.replace(/\.[^.]+$/, ".jpg"))
      fd.append("patientId", patientId)
      if (uploadRegion) fd.append("bodyRegion", uploadRegion)
      fd.append("category", uploadCategory)
      if (uploadNotes.trim()) fd.append("notes", uploadNotes.trim())

      const result = await uploadImage(fd)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Imagem enviada com sucesso")
      setUploadDialogOpen(false)
      resetUploadForm()
      loadImages()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao enviar imagem"))
    } finally {
      setUploading(false)
    }
  }

  function resetUploadForm() {
    setUploadFile(null)
    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    setUploadPreview(null)
    setUploadRegion("")
    setUploadCategory("general")
    setUploadNotes("")
  }

  // ============================================================
  // Edit Handlers
  // ============================================================

  function openEditDialog(image: ClinicalImageItem) {
    setEditRegion(image.bodyRegion ?? "")
    setEditCategory(image.category)
    setEditNotes(image.notes ?? "")
    setEditDialog({ open: true, image })
  }

  async function handleEditSave() {
    if (!editDialog.image) return
    setEditSaving(true)
    try {
      const result = await updateImage(editDialog.image.id, {
        bodyRegion: editRegion || null,
        category: editCategory,
        notes: editNotes.trim() || null,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Imagem atualizada")
      setEditDialog({ open: false, image: null })
      loadImages()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao atualizar imagem"))
    } finally {
      setEditSaving(false)
    }
  }

  // ============================================================
  // Delete Handler
  // ============================================================

  function handleDelete(imageId: string) {
    showConfirm(
      "Excluir imagem",
      "Tem certeza que deseja excluir esta imagem clinica? Esta acao nao pode ser desfeita.",
      async () => {
        try {
          const result = await deleteImage(imageId)
          if ("error" in result) {
            toast.error(result.error)
            return
          }
          toast.success("Imagem excluida")
          setLightboxIndex(null)
          loadImages()
        } catch (err) {
          toast.error(friendlyError(err, "Erro ao excluir imagem"))
        }
      }
    )
  }

  // ============================================================
  // Pair Handlers
  // ============================================================

  async function handlePair(targetImageId: string) {
    if (!pairDialog.sourceImage) return
    try {
      const result = await pairImages(pairDialog.sourceImage.id, targetImageId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Imagens pareadas (antes/depois)")
      setPairDialog({ open: false, sourceImage: null })
      loadImages()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao parear imagens"))
    }
  }

  async function handleUnpair(imageId: string) {
    try {
      const result = await unpairImage(imageId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Pareamento removido")
      loadImages()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao remover pareamento"))
    }
  }

  // ============================================================
  // Comparison
  // ============================================================

  function openComparison(image: ClinicalImageItem) {
    const pairedId = image.pairedImageId
    if (!pairedId) return
    const paired = images.find((i) => i.id === pairedId)
    if (!paired) {
      // The paired image might be pointing back at us
      const reverse = images.find((i) => i.pairedImageId === image.id)
      if (!reverse) return
      // Determine before/after by date
      const imgDate = new Date(image.createdAt)
      const revDate = new Date(reverse.createdAt)
      setComparisonDialog({
        open: true,
        before: imgDate < revDate ? image : reverse,
        after: imgDate < revDate ? reverse : image,
      })
      return
    }
    // Determine before/after by date
    const imgDate = new Date(image.createdAt)
    const pairedDate = new Date(paired.createdAt)
    setComparisonDialog({
      open: true,
      before: imgDate < pairedDate ? image : paired,
      after: imgDate < pairedDate ? paired : image,
    })
  }

  // ============================================================
  // Filtered images
  // ============================================================

  const filteredImages = images

  // Group by date for timeline view
  const groupedByDate = filteredImages.reduce<Record<string, ClinicalImageItem[]>>((acc, img) => {
    const dateKey = new Date(img.createdAt).toLocaleDateString("pt-BR")
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(img)
    return acc
  }, {})

  // ============================================================
  // Lightbox navigation
  // ============================================================

  const lightboxImage = lightboxIndex !== null ? filteredImages[lightboxIndex] : null

  function lightboxPrev() {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : filteredImages.length - 1)
  }

  function lightboxNext() {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex < filteredImages.length - 1 ? lightboxIndex + 1 : 0)
  }

  // Check if image has pair (either direction)
  function hasPair(image: ClinicalImageItem) {
    if (image.pairedImageId) return true
    return images.some((i) => i.pairedImageId === image.id)
  }

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square rounded-2xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          Imagens Clinicas
          {images.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {images.length}
            </Badge>
          )}
        </h3>
        <div className="flex-1" />

        {/* Filters */}
        <Select value={filterRegion} onValueChange={(v) => setFilterRegion(v ?? "all")}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Regiao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas regioes</SelectItem>
            {BODY_REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
              viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <Grid3x3 className="size-3" />
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
              viewMode === "timeline" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <Clock className="size-3" />
          </button>
        </div>

        {/* Upload button */}
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5 h-8"
        >
          <Camera className="size-3.5" />
          Nova Foto
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Empty state */}
      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
            <ImageIcon className="size-6 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhuma imagem clinica</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registre fotos de evolucao, antes/depois e imagens clinicas do paciente
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5 mt-1"
          >
            <Camera className="size-3.5" />
            Tirar foto
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border/40 bg-muted/20 transition-all hover:shadow-md hover:border-vox-primary/30 focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
            >
              {img.signedUrl ? (
                <img
                  src={img.signedUrl}
                  alt={img.notes || "Imagem clinica"}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <ImageIcon className="size-8 text-muted-foreground/30" />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2">
                <div className="flex items-center gap-1">
                  <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-medium", getCategoryColor(img.category))}>
                    {getCategoryLabel(img.category)}
                  </span>
                  {img.bodyRegion && (
                    <span className="text-[9px] text-white/80">
                      {getBodyRegionLabel(img.bodyRegion)}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-white/70 mt-0.5">
                  {new Date(img.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {/* Pair indicator */}
              {hasPair(img) && (
                <div className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-vox-primary/90 text-white">
                  <Link2 className="size-3" />
                </div>
              )}
              {/* Zoom icon */}
              <div className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="size-3" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Timeline View */
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dateImages]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-2">{date}</p>
              <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {dateImages.map((img) => {
                  const globalIdx = filteredImages.findIndex((i) => i.id === img.id)
                  return (
                    <button
                      key={img.id}
                      onClick={() => setLightboxIndex(globalIdx)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border/40 bg-muted/20 transition-all hover:shadow-md hover:border-vox-primary/30 focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
                    >
                      {img.signedUrl ? (
                        <img
                          src={img.signedUrl}
                          alt={img.notes || "Imagem clinica"}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <ImageIcon className="size-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <span className={cn("inline-flex items-center self-start rounded-full border px-1.5 py-0 text-[9px] font-medium", getCategoryColor(img.category))}>
                          {getCategoryLabel(img.category)}
                        </span>
                      </div>
                      {hasPair(img) && (
                        <div className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-vox-primary/90 text-white">
                          <Link2 className="size-3" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* Upload Dialog */}
      {/* ============================================================ */}
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetUploadForm()
          setUploadDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova imagem clinica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview */}
            {uploadPreview && (
              <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted/20">
                <img
                  src={uploadPreview}
                  alt="Preview"
                  className="size-full object-contain"
                />
              </div>
            )}

            {/* Body region */}
            <div className="space-y-1.5">
              <Label className="text-xs">Regiao do corpo</Label>
              <Select value={uploadRegion} onValueChange={(v) => setUploadRegion(v ?? "")}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar regiao (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v ?? "general")}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Observacoes</Label>
              <Textarea
                placeholder="Anotacoes sobre a imagem (opcional)"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <Button
              onClick={handleUploadConfirm}
              disabled={uploading || !uploadFile}
              className="w-full bg-vox-primary text-white hover:bg-vox-primary/90"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                "Enviar imagem"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Lightbox */}
      {/* ============================================================ */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-50 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="size-5" />
          </button>

          {/* Nav arrows */}
          {filteredImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxPrev() }}
                className="absolute left-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxNext() }}
                className="absolute right-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxImage.signedUrl ? (
              <img
                src={lightboxImage.signedUrl}
                alt={lightboxImage.notes || "Imagem clinica"}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <div className="flex size-64 items-center justify-center rounded-lg bg-muted/20">
                <ImageIcon className="size-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div
            className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center gap-2 text-white text-xs">
              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", getCategoryColor(lightboxImage.category))}>
                {getCategoryLabel(lightboxImage.category)}
              </span>
              {lightboxImage.bodyRegion && (
                <span className="text-white/70">
                  {getBodyRegionLabel(lightboxImage.bodyRegion)}
                </span>
              )}
              <span className="text-white/50">
                {new Date(lightboxImage.createdAt).toLocaleDateString("pt-BR")} {new Date(lightboxImage.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {lightboxImage.fileSize && (
                <span className="text-white/40">{formatSize(lightboxImage.fileSize)}</span>
              )}
              {lightboxImage.notes && (
                <span className="text-white/70 ml-2">{lightboxImage.notes}</span>
              )}
            </div>
            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 gap-1.5 h-8 text-xs"
                onClick={() => { openEditDialog(lightboxImage); setLightboxIndex(null) }}
              >
                <Pencil className="size-3" />
                Editar
              </Button>
              {hasPair(lightboxImage) ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10 gap-1.5 h-8 text-xs"
                    onClick={() => { openComparison(lightboxImage); setLightboxIndex(null) }}
                  >
                    <Link2 className="size-3" />
                    Ver comparacao
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10 gap-1.5 h-8 text-xs"
                    onClick={() => handleUnpair(lightboxImage.id)}
                  >
                    <Link2Off className="size-3" />
                    Desfazer par
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 gap-1.5 h-8 text-xs"
                  onClick={() => { setPairDialog({ open: true, sourceImage: lightboxImage }); setLightboxIndex(null) }}
                >
                  <Link2 className="size-3" />
                  Parear (antes/depois)
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-vox-error hover:bg-vox-error/10 gap-1.5 h-8 text-xs"
                onClick={() => handleDelete(lightboxImage.id)}
              >
                <Trash2 className="size-3" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Edit Metadata Dialog */}
      {/* ============================================================ */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, image: open ? editDialog.image : null })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Regiao do corpo</Label>
              <Select value={editRegion} onValueChange={(v) => setEditRegion(v ?? "")}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar regiao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {BODY_REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={editCategory} onValueChange={(v) => setEditCategory(v ?? "general")}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observacoes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <Button
              onClick={handleEditSave}
              disabled={editSaving}
              className="w-full bg-vox-primary text-white hover:bg-vox-primary/90"
            >
              {editSaving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Pair Selection Dialog */}
      {/* ============================================================ */}
      <Dialog open={pairDialog.open} onOpenChange={(open) => setPairDialog({ open, sourceImage: open ? pairDialog.sourceImage : null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecionar imagem para pareamento</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Selecione a imagem que deseja parear com a imagem atual para comparacao antes/depois.
          </p>
          <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 max-h-[400px] overflow-y-auto">
            {images
              .filter((img) => img.id !== pairDialog.sourceImage?.id && !hasPair(img))
              .map((img) => (
                <button
                  key={img.id}
                  onClick={() => handlePair(img.id)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border/40 bg-muted/20 transition-all hover:shadow-md hover:border-vox-primary hover:ring-2 hover:ring-vox-primary/30 focus:outline-none focus:ring-2 focus:ring-vox-primary/30"
                >
                  {img.signedUrl ? (
                    <img
                      src={img.signedUrl}
                      alt={img.notes || "Imagem"}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageIcon className="size-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1">
                    <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0 text-[8px] font-medium", getCategoryColor(img.category))}>
                      {getCategoryLabel(img.category)}
                    </span>
                  </div>
                </button>
              ))}
          </div>
          {images.filter((img) => img.id !== pairDialog.sourceImage?.id && !hasPair(img)).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma imagem disponivel para pareamento.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Before/After Comparison Dialog */}
      {/* ============================================================ */}
      <Dialog open={comparisonDialog.open} onOpenChange={(open) => setComparisonDialog({ open, before: open ? comparisonDialog.before : null, after: open ? comparisonDialog.after : null })}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comparacao Antes / Depois</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {/* Before */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getCategoryColor("before")}>
                  Antes
                </Badge>
                {comparisonDialog.before && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(comparisonDialog.before.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              <div className="aspect-square overflow-hidden rounded-xl border bg-muted/20">
                {comparisonDialog.before?.signedUrl ? (
                  <img
                    src={comparisonDialog.before.signedUrl}
                    alt="Antes"
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageIcon className="size-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>
            {/* After */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getCategoryColor("after")}>
                  Depois
                </Badge>
                {comparisonDialog.after && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(comparisonDialog.after.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              <div className="aspect-square overflow-hidden rounded-xl border bg-muted/20">
                {comparisonDialog.after?.signedUrl ? (
                  <img
                    src={comparisonDialog.after.signedUrl}
                    alt="Depois"
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageIcon className="size-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>
          </div>
          {comparisonDialog.before && comparisonDialog.after && (
            <p className="text-xs text-muted-foreground text-center">
              Intervalo: {Math.round((new Date(comparisonDialog.after.createdAt).getTime() - new Date(comparisonDialog.before.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dias
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={() => {
          confirmDialog.onConfirm()
          setConfirmDialog((prev) => ({ ...prev, open: false }))
        }}
      />
    </div>
  )
}
