import { NextRequest, NextResponse } from "next/server"
import { getErrors } from "@/lib/error-buffer"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const since = req.nextUrl.searchParams.get("since")
  const errors = getErrors(since ? parseInt(since, 10) : undefined)
  return NextResponse.json({ count: errors.length, errors })
}
