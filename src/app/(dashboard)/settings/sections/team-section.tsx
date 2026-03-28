"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Users, Plus, Crown, Mail, Loader2, X, Clock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { friendlyError } from "@/lib/error-messages"
import {
  getTeamMembers,
  inviteTeamMember,
  cancelInvite,
  updateMemberRole,
  removeMember,
} from "@/server/actions/team"

type TeamMember = { id: string; userId?: string; name: string; email: string; role: string; invitedAt?: string }
type TeamInvite = { id: string; email: string; role: string; status: string; createdAt: string; expiresAt: string }

interface TeamSectionProps {
  clinicName: string
}

export function TeamSection({ clinicName }: TeamSectionProps) {
  const [owner, setOwner] = useState<{ name: string; email: string } | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({ open: false, title: "", description: "", onConfirm: () => {} })
  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm })
  }
  const [inviteRole, setInviteRole] = useState("member")
  const [inviting, setInviting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadTeam = useCallback(async () => {
    try {
      const data = await getTeamMembers()
      setOwner(data.owner)
      setMembers(data.members)
      setInvites(data.invites)
    } catch (err) { console.error("[Settings] team load failed", err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadTeam() }, [loadTeam])

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const result = await inviteTeamMember(inviteEmail.trim(), inviteRole)
      if ('error' in result) { toast.error(result.error); return }
      setInviteEmail(""); setInviteRole("member"); setShowInvite(false)
      loadTeam()
    } catch (err) {
      toast.error(friendlyError(err, "Erro ao convidar"))
    } finally { setInviting(false) }
  }

  async function handleCancelInvite(inviteId: string) {
    setActionLoading(inviteId)
    try { const r = await cancelInvite(inviteId); if ('error' in r) { toast.error(r.error); return }; loadTeam() }
    catch (err) { toast.error(friendlyError(err, "Erro ao cancelar convite")) }
    finally { setActionLoading(null) }
  }

  async function handleRoleChange(memberId: string, role: string) {
    setActionLoading(memberId)
    try { const r = await updateMemberRole(memberId, role); if ('error' in r) { toast.error(r.error); return }; loadTeam() }
    catch (err) { toast.error(friendlyError(err, "Erro ao alterar cargo")) }
    finally { setActionLoading(null) }
  }

  async function handleRemove(memberId: string) {
    showConfirm("Remover membro", "Tem certeza que deseja remover este membro da equipe?", async () => {
      setActionLoading(memberId)
      try { const r = await removeMember(memberId); if ('error' in r) { toast.error(r.error); return }; loadTeam() }
      catch (err) { toast.error(friendlyError(err, "Erro ao remover membro")) }
      finally { setActionLoading(null) }
    })
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
  }

  const ROLE_LABELS: Record<string, string> = { owner: "Proprietario", admin: "Administrador", member: "Membro" }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-vox-primary" />
              Equipe
            </CardTitle>
            <Button size="sm" onClick={() => setShowInvite(!showInvite)} className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5">
              <Plus className="size-3.5" />
              Convidar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Invite form */}
          {showInvite && (
            <div className="rounded-xl border border-vox-primary/20 bg-vox-primary/[0.02] p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInvite() } }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Funcao</Label>
                  <div className="flex rounded-xl bg-muted/50 p-0.5 h-10">
                    {(["member", "admin"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`flex-1 rounded-lg px-3 text-xs font-medium transition-all ${
                          inviteRole === r ? "bg-background shadow-sm" : "text-muted-foreground"
                        }`}
                      >
                        {r === "admin" ? "Admin" : "Membro"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowInvite(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleInvite} disabled={!inviteEmail.trim() || inviting} className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5">
                  {inviting ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                  Enviar Convite
                </Button>
              </div>
            </div>
          )}

          {/* Owner */}
          {owner && (
            <div className="flex items-center gap-3 rounded-xl border border-vox-primary/20 bg-vox-primary/[0.03] px-4 py-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-vox-primary to-vox-primary/70">
                <Crown className="size-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{owner.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{owner.email}</p>
              </div>
              <Badge className="bg-vox-primary/10 text-vox-primary border-vox-primary/20 text-[10px]">
                Proprietario
              </Badge>
            </div>
          )}

          {/* Members */}
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 group">
              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  disabled={actionLoading === m.id}
                  className="rounded-lg border border-border/50 bg-background px-2 py-1 text-[11px] font-medium"
                >
                  <option value="member">Membro</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => handleRemove(m.id)}
                  disabled={actionLoading === m.id}
                  className="flex size-7 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-vox-error/10 text-muted-foreground hover:text-vox-error transition-all"
                  title="Remover"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Pending invites */}
          {invites.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 pt-2 px-1">
                Convites Pendentes
              </p>
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-dashed border-border/50 px-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted/40">
                    <Clock className="size-4 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{inv.email}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {ROLE_LABELS[inv.role] ?? inv.role} — expira {new Date(inv.expiresAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelInvite(inv.id)}
                    disabled={actionLoading === inv.id}
                    className="flex size-7 items-center justify-center rounded-lg hover:bg-vox-error/10 text-muted-foreground hover:text-vox-error transition-colors"
                    title="Cancelar convite"
                  >
                    {actionLoading === inv.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                  </button>
                </div>
              ))}
            </>
          )}

          {members.length === 0 && invites.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">
              Convide membros para colaborar no workspace
            </p>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, open: false })) }}
      />
    </div>
  )
}
