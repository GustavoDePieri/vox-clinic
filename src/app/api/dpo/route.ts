import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, requestType, description } = body

    if (!name?.trim() || !email?.trim() || !requestType || !description?.trim()) {
      return NextResponse.json({ error: "Todos os campos sao obrigatorios" }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 })
    }

    // Save to database
    await db.dpoRequest.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        requestType,
        description: description.trim(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DPO] Failed to save request:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
