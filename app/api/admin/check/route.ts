import { NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ isAdmin: false })
    }

    if (!hasDb) {
      // Demo mode - only allow specific email
      return NextResponse.json({ 
        isAdmin: email === 'devolper2011@gmail.com' 
      })
    }

    // Check if user is admin
    const users = await sql`
      SELECT is_admin FROM users WHERE email = ${email}
    `

    const isAdmin = users.length > 0 && users[0].is_admin

    return NextResponse.json({ isAdmin })

  } catch (error) {
    console.error("Admin check error:", error)
    return NextResponse.json({ isAdmin: false })
  }
}