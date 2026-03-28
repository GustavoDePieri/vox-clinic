"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Mic,
  Play,
  Pause,
  Loader2,
} from "lucide-react"
import { getAudioPlaybackUrl } from "@/server/actions/patient"
import Link from "next/link"
import type { PatientData } from "./types"

export default function GravacoesTab({
  recordings,
}: {
  recordings: PatientData["recordings"]
}) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  function handleSpeedChange(speed: number) {
    setPlaybackSpeed(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }

  async function handlePlay(rec: PatientData["recordings"][number]) {
    // If already playing this one, pause it
    if (playingId === rec.id && audioRef.current) {
      audioRef.current.pause()
      setPlayingId(null)
      return
    }

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setLoadingId(rec.id)
    try {
      const signedUrl = await getAudioPlaybackUrl(rec.audioUrl)
      const audio = new Audio(signedUrl)
      audioRef.current = audio
      audio.onended = () => {
        setPlayingId(null)
        audioRef.current = null
      }
      audio.onerror = () => {
        setPlayingId(null)
        audioRef.current = null
      }
      audio.playbackRate = playbackSpeed
      await audio.play()
      setPlayingId(rec.id)
    } catch (err) {
      console.error("[PatientTabs] audio load failed", err)
    } finally {
      setLoadingId(null)
    }
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted/60">
          <Mic className="size-6 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium">Nenhuma gravacao registrada</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grave uma consulta para gerar transcricao e resumo automatico
          </p>
        </div>
        <Link href="/appointments/new">
          <Button size="sm" className="bg-vox-primary text-white hover:bg-vox-primary/90 gap-1.5 mt-1">
            <Mic className="size-3.5" />
            Gravar consulta
          </Button>
        </Link>
      </div>
    )
  }

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--"
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  return (
    <div className="space-y-2">
      {recordings.map((rec) => (
        <Card key={rec.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePlay(rec)}
                disabled={loadingId === rec.id}
                className="flex size-9 items-center justify-center rounded-full bg-vox-primary/10 hover:bg-vox-primary/20 transition-colors"
                aria-label={playingId === rec.id ? "Pausar" : "Reproduzir"}
              >
                {loadingId === rec.id ? (
                  <Loader2 className="size-4 text-vox-primary animate-spin" />
                ) : playingId === rec.id ? (
                  <Pause className="size-4 text-vox-primary" fill="currentColor" />
                ) : (
                  <Play className="size-4 text-vox-primary ml-0.5" fill="currentColor" />
                )}
              </button>
              <div>
                <p className="text-sm font-medium">{formatDate(rec.createdAt)}</p>
                <p className="text-xs text-muted-foreground">
                  Duracao: {formatDuration(rec.duration)}
                </p>
              </div>
            </div>
            <Badge
              variant={rec.status === "processed" ? "secondary" : "outline"}
            >
              {rec.status === "processed"
                ? "Transcrito"
                : rec.status === "pending"
                  ? "Pendente"
                  : rec.status}
            </Badge>
          </CardContent>
          {playingId === rec.id && (
            <CardContent className="pt-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1">Velocidade:</span>
                {[1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                      playbackSpeed === speed
                        ? "bg-vox-primary text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </CardContent>
          )}
          {rec.transcript && (
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground line-clamp-3">
                {rec.transcript}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
