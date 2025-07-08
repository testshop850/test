import { NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone } = await req.json()
    
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, parol va ism kiritilishi shart" }, { status: 400 })
    }

    if (!hasDb) {
      return NextResponse.json({ error: "Database mavjud emas" }, { status: 500 })
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Bu email bilan foydalanuvchi allaqachon mavjud" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUsers = await sql`
      INSERT INTO users (email, password, name, phone, is_admin)
      VALUES (${email}, ${hashedPassword}, ${name}, ${phone || null}, FALSE)
      RETURNING id, email, name, phone, is_admin, created_at
    `

    const newUser = newUsers[0]

    return NextResponse.json({ 
      success: true, 
      user: newUser 
    })

  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 })
  }
}