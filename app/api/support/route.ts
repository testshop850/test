import { NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

// Get support tickets
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!hasDb) {
      return NextResponse.json({ tickets: [] })
    }

    let tickets
    if (userId) {
      // Get user's tickets
      tickets = await sql`
        SELECT * FROM support_tickets 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
    } else {
      // Get all tickets (admin)
      tickets = await sql`
        SELECT st.*, u.name as user_name, u.email as user_email
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        ORDER BY st.created_at DESC
      `
    }

    return NextResponse.json({ tickets })

  } catch (error) {
    console.error("Get support tickets error:", error)
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 })
  }
}

// Create support ticket
export async function POST(req: NextRequest) {
  try {
    const { userId, subject, message, priority = 'medium' } = await req.json()
    
    if (!userId || !subject || !message) {
      return NextResponse.json({ error: "User ID, mavzu va xabar kiritilishi shart" }, { status: 400 })
    }

    if (!hasDb) {
      return NextResponse.json({ error: "Database mavjud emas" }, { status: 500 })
    }

    // Create ticket
    const newTicket = await sql`
      INSERT INTO support_tickets (user_id, subject, message, priority)
      VALUES (${userId}, ${subject}, ${message}, ${priority})
      RETURNING *
    `

    return NextResponse.json({ 
      success: true, 
      ticket: newTicket[0] 
    })

  } catch (error) {
    console.error("Create support ticket error:", error)
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 })
  }
}