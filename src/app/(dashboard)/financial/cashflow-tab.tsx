"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { getCashFlowData } from "@/server/actions/cashflow"

const formatBRL = (value: number) =>
  (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatBRLShort = (value: number) => {
  const reais = value / 100
  if (Math.abs(reais) >= 1000) {
    return `R$ ${(reais / 1000).toFixed(1)}k`
  }
  return `R$ ${reais.toFixed(0)}`
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

type CashFlowResult = Awaited<ReturnType<typeof getCashFlowData>>

export default function CashFlowTab() {
  const [period, setPeriod] = useState<"month" | "year">("month")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CashFlowResult | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCashFlowData(period, currentDate.toISOString())
      setData(result)
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [period, currentDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const navigatePeriod = (direction: -1 | 1) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (period === "month") {
        next.setMonth(next.getMonth() + direction)
      } else {
        next.setFullYear(next.getFullYear() + direction)
      }
      return next
    })
  }

  const periodLabel =
    period === "month"
      ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : `${currentDate.getFullYear()}`

  const formatChartDate = (dateStr: string) => {
    if (period === "month") {
      // "2026-03-15" → "15"
      return dateStr.split("-")[2]
    } else {
      // "2026-03" → "Mar"
      const month = parseInt(dateStr.split("-")[1], 10)
      return monthNames[month - 1]
    }
  }

  const chartData = data?.entries.map((e) => ({
    date: formatChartDate(e.date),
    Entradas: e.inflows / 100,
    Saidas: e.outflows / 100,
    Saldo: e.balance / 100,
  })) ?? []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const net = data?.totals.net ?? 0
  const netPositive = net >= 0

  return (
    <div className="space-y-6">
      {/* Period Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigatePeriod(-1)}
            className="px-2 py-1 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
          >
            &larr;
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {periodLabel}
          </span>
          <button
            onClick={() => navigatePeriod(1)}
            className="px-2 py-1 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
          >
            &rarr;
          </button>
        </div>

        <div className="flex rounded-xl bg-muted/50 p-0.5">
          <button
            onClick={() => setPeriod("month")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              period === "month"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              period === "year"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden rounded-2xl">
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
              netPositive ? "from-vox-success/[0.04]" : "from-vox-error/[0.04]"
            } to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
          />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Saldo do Periodo
                </p>
                <p
                  className={`text-2xl font-bold mt-0.5 tabular-nums ${
                    netPositive ? "text-vox-success" : "text-vox-error"
                  }`}
                >
                  {formatBRL(net)}
                </p>
              </div>
              <div
                className={`flex size-9 items-center justify-center rounded-xl ${
                  netPositive ? "bg-vox-success/10" : "bg-vox-error/10"
                }`}
              >
                {netPositive ? (
                  <TrendingUp className="size-4 text-vox-success" />
                ) : (
                  <TrendingDown className="size-4 text-vox-error" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vox-success/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Entradas
                </p>
                <p className="text-2xl font-bold mt-0.5 text-vox-success tabular-nums">
                  {formatBRL(data?.totals.inflows ?? 0)}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-vox-success/10">
                <DollarSign className="size-4 text-vox-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vox-error/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Saidas
                </p>
                <p className="text-2xl font-bold mt-0.5 text-vox-error tabular-nums">
                  {formatBRL(data?.totals.outflows ?? 0)}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-vox-error/10">
                <TrendingDown className="size-4 text-vox-error" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-vox-warning/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Pendente
                </p>
                <p className="text-2xl font-bold mt-0.5 text-vox-warning tabular-nums">
                  {formatBRL(
                    (data?.summary.pendingReceivables ?? 0) +
                      (data?.summary.pendingExpenses ?? 0)
                  )}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-vox-warning/10">
                <Clock className="size-4 text-vox-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhum dado para o periodo selecionado.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatBRLShort(v * 100)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--background))",
                    fontSize: "12px",
                  }}
                  formatter={(value: unknown, name: unknown) => [
                    `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    String(name),
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                />
                <Bar
                  dataKey="Entradas"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  barSize={period === "month" ? 8 : 24}
                />
                <Bar
                  dataKey="Saidas"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  barSize={period === "month" ? 8 : 24}
                />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#14B8A6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">Movimentacoes</h3>
          {!data?.transactions.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma movimentacao no periodo.
            </p>
          ) : (
            <div className="space-y-1">
              {data.transactions.slice(0, 50).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${
                      tx.type === "inflow"
                        ? "bg-vox-success/10"
                        : "bg-vox-error/10"
                    }`}
                  >
                    {tx.type === "inflow" ? (
                      <ArrowUpRight className="size-4 text-vox-success" />
                    ) : (
                      <ArrowDownRight className="size-4 text-vox-error" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category}
                      {tx.paymentMethod && ` · ${tx.paymentMethod}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        tx.type === "inflow"
                          ? "text-vox-success"
                          : "text-vox-error"
                      }`}
                    >
                      {tx.type === "inflow" ? "+" : "-"}
                      {formatBRL(tx.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(tx.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
