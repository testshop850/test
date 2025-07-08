import { NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email va parol kiritilishi shart" }, { status: 400 })
    }

    if (!hasDb) {
      return NextResponse.json({ error: "Database mavjud emas" }, { status: 500 })
    }

    // Find user by email
    const users = await sql`
      SELECT id, email, password, name, phone, address, is_admin, created_at 
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Noto'g'ri email yoki parol" }, { status: 401 })
    }

    const user = users[0]

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Noto'g'ri email yoki parol" }, { status: 401 })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword 
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 })
  }
}