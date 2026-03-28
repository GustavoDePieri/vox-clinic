"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
import Link from "next/link"

export function PlanoSection() {
  return (
    <Card>
      <CardContent className="pt-6 text-center space-y-4">
        <CreditCard className="size-10 text-vox-primary mx-auto" />
        <div>
          <h3 className="text-base font-semibold">Plano e Assinatura</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seu plano, faca upgrade e veja seu historico de pagamentos.
          </p>
        </div>
        <Link href="/settings/billing">
          <Button className="bg-vox-primary hover:bg-vox-primary/90 text-white rounded-xl">
            Gerenciar Plano
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
