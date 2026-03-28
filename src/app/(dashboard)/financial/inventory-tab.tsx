"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Package,
  AlertTriangle,
  DollarSign,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pencil,
  History,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Archive,
} from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  getInventoryItems,
  getInventoryCategories,
  getInventorySummary,
  createInventoryItem,
  updateInventoryItem,
  deactivateInventoryItem,
  recordMovement,
  getMovements,
  createInventoryCategory,
} from "@/server/actions/inventory"

type InventoryItemData = Awaited<ReturnType<typeof getInventoryItems>>[number]
type CategoryData = Awaited<ReturnType<typeof getInventoryCategories>>[number]
type SummaryData = Awaited<ReturnType<typeof getInventorySummary>>
type MovementData = Awaited<ReturnType<typeof getMovements>>[number]

const formatBRL = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100)

const UNIT_OPTIONS = [
  { value: "un", label: "Unidade (un)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "g", label: "Grama (g)" },
  { value: "cx", label: "Caixa (cx)" },
  { value: "par", label: "Par" },
  { value: "fr", label: "Frasco (fr)" },
]

const REASON_OPTIONS: Record<string, { label: string; types: string[] }> = {
  compra: { label: "Compra", types: ["in"] },
  uso: { label: "Uso em procedimento", types: ["out"] },
  perda: { label: "Perda", types: ["out"] },
  vencimento: { label: "Vencimento", types: ["out"] },
  ajuste: { label: "Ajuste manual", types: ["in", "out", "adjustment"] },
  devolucao: { label: "Devolucao", types: ["in"] },
}

const TYPE_LABELS: Record<string, string> = {
  in: "Entrada",
  out: "Saida",
  adjustment: "Ajuste",
}

const REASON_LABELS: Record<string, string> = {
  compra: "Compra",
  uso: "Uso em procedimento",
  uso_procedimento: "Uso em procedimento",
  perda: "Perda",
  vencimento: "Vencimento",
  ajuste: "Ajuste manual",
  ajuste_manual: "Ajuste manual",
  devolucao: "Devolucao",
}

export function InventoryTab() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItemData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("")

  // Dialogs
  const [showCreateItem, setShowCreateItem] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [showMovement, setShowMovement] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)

  // Selected item for edit / history
  const [selectedItem, setSelectedItem] = useState<InventoryItemData | null>(null)
  const [movements, setMovements] = useState<MovementData[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  // Form states
  const [saving, setSaving] = useState(false)

  // Create item form
  const [newItem, setNewItem] = useState({
    name: "", categoryId: "", sku: "", unit: "un",
    initialStock: "", minStock: "", costPerUnit: "", supplier: "", notes: "",
  })

  // Edit item form
  const [editData, setEditData] = useState({
    name: "", categoryId: "", sku: "", unit: "un",
    minStock: "", costPerUnit: "", supplier: "", notes: "",
  })

  // Movement form
  const [movementData, setMovementData] = useState({
    itemId: "", type: "in" as "in" | "out" | "adjustment",
    quantity: "", reason: "compra", notes: "",
  })

  // Category form
  const [newCategoryName, setNewCategoryName] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [itemsData, categoriesData, summaryData] = await Promise.all([
        getInventoryItems(search || undefined, filterCategory || undefined),
        getInventoryCategories(),
        getInventorySummary(),
      ])
      setItems(itemsData)
      setCategories(categoriesData)
      setSummary(summaryData)
    } catch (err) {
      console.error("[InventoryTab] loadData failed", err)
    } finally {
      setLoading(false)
    }
  }, [search, filterCategory])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Debounced search
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ---- Handlers ----

  async function handleCreateItem() {
    setSaving(true)
    try {
      const result = await createInventoryItem({
        name: newItem.name,
        categoryId: newItem.categoryId || undefined,
        sku: newItem.sku || undefined,
        unit: newItem.unit,
        initialStock: newItem.initialStock ? parseFloat(newItem.initialStock) : 0,
        minStock: newItem.minStock ? parseFloat(newItem.minStock) : 0,
        costPerUnit: newItem.costPerUnit ? Math.round(parseFloat(newItem.costPerUnit) * 100) : undefined,
        supplier: newItem.supplier || undefined,
        notes: newItem.notes || undefined,
      })
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Item criado com sucesso")
      setShowCreateItem(false)
      setNewItem({ name: "", categoryId: "", sku: "", unit: "un", initialStock: "", minStock: "", costPerUnit: "", supplier: "", notes: "" })
      loadData()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateItem() {
    if (!selectedItem) return
    setSaving(true)
    try {
      const result = await updateInventoryItem(selectedItem.id, {
        name: editData.name || undefined,
        categoryId: editData.categoryId === "__none__" ? null : (editData.categoryId || undefined),
        sku: editData.sku,
        unit: editData.unit,
        minStock: editData.minStock ? parseFloat(editData.minStock) : 0,
        costPerUnit: editData.costPerUnit ? Math.round(parseFloat(editData.costPerUnit) * 100) : null,
        supplier: editData.supplier,
        notes: editData.notes,
      })
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Item atualizado")
      setShowEditItem(false)
      loadData()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleRecordMovement() {
    setSaving(true)
    try {
      const result = await recordMovement({
        itemId: movementData.itemId,
        type: movementData.type,
        quantity: parseFloat(movementData.quantity),
        reason: movementData.reason,
        notes: movementData.notes || undefined,
      })
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Movimento registrado")
      setShowMovement(false)
      setMovementData({ itemId: "", type: "in", quantity: "", reason: "compra", notes: "" })
      loadData()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(item: InventoryItemData) {
    try {
      const result = await deactivateInventoryItem(item.id)
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Item desativado")
      loadData()
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  async function handleViewHistory(item: InventoryItemData) {
    setSelectedItem(item)
    setShowHistory(true)
    setMovementsLoading(true)
    try {
      const data = await getMovements(item.id, "30d")
      setMovements(data)
    } catch {
      toast.error("Erro ao carregar historico")
    } finally {
      setMovementsLoading(false)
    }
  }

  function openEditDialog(item: InventoryItemData) {
    setSelectedItem(item)
    setEditData({
      name: item.name,
      categoryId: item.category?.id || "",
      sku: item.sku || "",
      unit: item.unit,
      minStock: String(item.minStock),
      costPerUnit: item.costPerUnit != null ? String(item.costPerUnit / 100) : "",
      supplier: item.supplier || "",
      notes: item.notes || "",
    })
    setShowEditItem(true)
  }

  function openMovementDialog(item?: InventoryItemData) {
    setMovementData({
      itemId: item?.id || "",
      type: "in",
      quantity: "",
      reason: "compra",
      notes: "",
    })
    setShowMovement(true)
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    setSaving(true)
    try {
      const result = await createInventoryCategory({ name: newCategoryName.trim() })
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Categoria criada")
      setShowCreateCategory(false)
      setNewCategoryName("")
      const cats = await getInventoryCategories()
      setCategories(cats)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  const lowStockItems = items.filter((i) => i.isLowStock)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-vox-warning/30 bg-vox-warning/5 px-4 py-3">
          <AlertTriangle className="size-4 text-vox-warning shrink-0" />
          <p className="text-sm text-vox-warning font-medium">
            {lowStockItems.length} {lowStockItems.length === 1 ? "item abaixo" : "itens abaixo"} do estoque minimo
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vox-primary/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total de Itens
                </p>
                <p className="text-2xl font-bold mt-0.5 tabular-nums">
                  {summary?.totalItems ?? 0}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-vox-primary/10">
                <Package className="size-4 text-vox-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vox-warning/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Abaixo do Minimo
                </p>
                <p className="text-2xl font-bold mt-0.5 tabular-nums">
                  {summary?.lowStockCount ?? 0}
                  {(summary?.lowStockCount ?? 0) > 0 && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">Alerta</Badge>
                  )}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-vox-warning/10">
                <AlertTriangle className="size-4 text-vox-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vox-success/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Valor Total em Estoque
                </p>
                <p className="text-2xl font-bold mt-0.5 text-vox-success tabular-nums">
                  {formatBRL(summary?.totalValue ?? 0)}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-vox-success/10">
                <DollarSign className="size-4 text-vox-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select value={filterCategory || "all"} onValueChange={(v) => setFilterCategory(!v || v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setShowCreateCategory(true)}>
          <Plus className="size-3.5 mr-1" /> Categoria
        </Button>
        <Button variant="outline" size="sm" onClick={() => openMovementDialog()}>
          <ArrowDownToLine className="size-3.5 mr-1" /> Movimento
        </Button>
        <Button size="sm" onClick={() => setShowCreateItem(true)}>
          <Plus className="size-3.5 mr-1" /> Novo Item
        </Button>
      </div>

      {/* Items Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum item de estoque cadastrado.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreateItem(true)}>
                <Plus className="size-3.5 mr-1" /> Cadastrar primeiro item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Estoque</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden md:table-cell">Min.</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Unid.</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden lg:table-cell">Custo Un.</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.supplier && (
                            <p className="text-xs text-muted-foreground">{item.supplier}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {item.category ? (
                          <Badge variant="secondary" className="text-xs">
                            {item.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {item.currentStock}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                        {item.minStock}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{item.unit}</td>
                      <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">
                        {item.costPerUnit != null ? formatBRL(item.costPerUnit) : "--"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.isLowStock ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="size-3 mr-1" /> Baixo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-vox-success border-vox-success/20 bg-vox-success/10">
                            OK
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => openMovementDialog(item)} title="Registrar movimento">
                            <ArrowUpFromLine className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => handleViewHistory(item)} title="Historico">
                            <History className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditDialog(item)} title="Editar">
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-vox-error" onClick={() => handleDeactivate(item)} title="Desativar">
                            <Archive className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Create Item Dialog */}
      {/* ============================================================ */}
      <Dialog open={showCreateItem} onOpenChange={setShowCreateItem}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Item de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Resina Composta A2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={newItem.categoryId || "none"} onValueChange={(v) => setNewItem((p) => ({ ...p, categoryId: !v || v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={newItem.unit} onValueChange={(v) => setNewItem((p) => ({ ...p, unit: v ?? "un" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Estoque Inicial</Label>
                <Input type="number" min="0" step="any" value={newItem.initialStock} onChange={(e) => setNewItem((p) => ({ ...p, initialStock: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Estoque Minimo</Label>
                <Input type="number" min="0" step="any" value={newItem.minStock} onChange={(e) => setNewItem((p) => ({ ...p, minStock: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Custo Unit. (R$)</Label>
                <Input type="number" min="0" step="0.01" value={newItem.costPerUnit} onChange={(e) => setNewItem((p) => ({ ...p, costPerUnit: e.target.value }))} placeholder="0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input value={newItem.sku} onChange={(e) => setNewItem((p) => ({ ...p, sku: e.target.value }))} placeholder="Codigo interno" />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input value={newItem.supplier} onChange={(e) => setNewItem((p) => ({ ...p, supplier: e.target.value }))} placeholder="Nome do fornecedor" />
              </div>
            </div>
            <div>
              <Label>Observacoes</Label>
              <Textarea value={newItem.notes} onChange={(e) => setNewItem((p) => ({ ...p, notes: e.target.value }))} placeholder="Notas adicionais..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateItem(false)}>Cancelar</Button>
            <Button onClick={handleCreateItem} disabled={saving || !newItem.name.trim()}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Criar Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Edit Item Dialog */}
      {/* ============================================================ */}
      <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={editData.categoryId || "__none__"} onValueChange={(v) => setEditData((p) => ({ ...p, categoryId: v ?? "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={editData.unit} onValueChange={(v) => setEditData((p) => ({ ...p, unit: v ?? "un" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Estoque Minimo</Label>
                <Input type="number" min="0" step="any" value={editData.minStock} onChange={(e) => setEditData((p) => ({ ...p, minStock: e.target.value }))} />
              </div>
              <div>
                <Label>Custo Unit. (R$)</Label>
                <Input type="number" min="0" step="0.01" value={editData.costPerUnit} onChange={(e) => setEditData((p) => ({ ...p, costPerUnit: e.target.value }))} />
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={editData.sku} onChange={(e) => setEditData((p) => ({ ...p, sku: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input value={editData.supplier} onChange={(e) => setEditData((p) => ({ ...p, supplier: e.target.value }))} />
            </div>
            <div>
              <Label>Observacoes</Label>
              <Textarea value={editData.notes} onChange={(e) => setEditData((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditItem(false)}>Cancelar</Button>
            <Button onClick={handleUpdateItem} disabled={saving || !editData.name.trim()}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Record Movement Dialog */}
      {/* ============================================================ */}
      <Dialog open={showMovement} onOpenChange={setShowMovement}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Movimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item *</Label>
              <Select value={movementData.itemId} onValueChange={(v) => setMovementData((p) => ({ ...p, itemId: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar item" /></SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={movementData.type} onValueChange={(v) => setMovementData((p) => ({ ...p, type: v as "in" | "out" | "adjustment", reason: v === "in" ? "compra" : v === "out" ? "uso" : "ajuste" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saida</SelectItem>
                    <SelectItem value="adjustment">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{movementData.type === "adjustment" ? "Novo Estoque *" : "Quantidade *"}</Label>
                <Input type="number" min="0" step="any" value={movementData.quantity} onChange={(e) => setMovementData((p) => ({ ...p, quantity: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Motivo *</Label>
              <Select value={movementData.reason} onValueChange={(v) => setMovementData((p) => ({ ...p, reason: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_OPTIONS)
                    .filter(([, opt]) => opt.types.includes(movementData.type))
                    .map(([key, opt]) => (
                      <SelectItem key={key} value={key}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observacoes</Label>
              <Textarea value={movementData.notes} onChange={(e) => setMovementData((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Detalhes opcionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovement(false)}>Cancelar</Button>
            <Button onClick={handleRecordMovement} disabled={saving || !movementData.itemId || !movementData.quantity}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Movement History Dialog */}
      {/* ============================================================ */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historico — {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {movementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum movimento registrado.</p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className={`flex size-7 items-center justify-center rounded-lg ${
                    m.type === "in" ? "bg-vox-success/10 text-vox-success" :
                    m.type === "out" ? "bg-vox-error/10 text-vox-error" :
                    "bg-vox-primary/10 text-vox-primary"
                  }`}>
                    {m.type === "in" ? <ArrowDownToLine className="size-3.5" /> :
                     m.type === "out" ? <ArrowUpFromLine className="size-3.5" /> :
                     <History className="size-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {TYPE_LABELS[m.type] || m.type}
                      <span className="font-normal text-muted-foreground"> — {REASON_LABELS[m.reason] || m.reason}</span>
                    </p>
                    {m.notes && <p className="text-xs text-muted-foreground truncate">{m.notes}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString("pt-BR")} {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${
                    m.type === "in" ? "text-vox-success" : m.type === "out" ? "text-vox-error" : ""
                  }`}>
                    {m.type === "in" ? "+" : m.type === "out" ? "-" : ""}{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Create Category Dialog */}
      {/* ============================================================ */}
      <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Nome *</Label>
            <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Materiais descartaveis" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCategory(false)}>Cancelar</Button>
            <Button onClick={handleCreateCategory} disabled={saving || !newCategoryName.trim()}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
