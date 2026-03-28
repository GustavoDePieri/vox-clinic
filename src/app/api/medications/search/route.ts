import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { searchMedications } from "@/server/actions/medication"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const q = searchParams.get("q") ?? ""
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50) : 20

    if (q.length < 2) {
      return NextResponse.json([])
    }

    const results = await searchMedications(q, limit)
    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
