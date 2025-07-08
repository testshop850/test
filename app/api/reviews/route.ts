import { NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

// Get reviews for a menu item
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const menuItemId = searchParams.get('menuItemId')

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item ID kerak" }, { status: 400 })
    }

    if (!hasDb) {
      return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0 })
    }

    // Get reviews with user info
    const reviews = await sql`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.menu_item_id = ${menuItemId}
      ORDER BY r.created_at DESC
    `

    // Calculate average rating
    const ratingStats = await sql`
      SELECT 
        AVG(rating)::DECIMAL(3,2) as average_rating,
        COUNT(*) as total_reviews
      FROM reviews 
      WHERE menu_item_id = ${menuItemId}
    `

    const averageRating = ratingStats[0]?.average_rating || 0
    const totalReviews = ratingStats[0]?.total_reviews || 0

    return NextResponse.json({
      reviews,
      averageRating: parseFloat(averageRating),
      totalReviews: parseInt(totalReviews)
    })

  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 })
  }
}

// Add a review
export async function POST(req: NextRequest) {
  try {
    const { userId, menuItemId, rating, comment } = await req.json()
    
    if (!userId || !menuItemId || !rating) {
      return NextResponse.json({ error: "User ID, menu item ID va rating kiritilishi shart" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating 1 dan 5 gacha bo'lishi kerak" }, { status: 400 })
    }

    if (!hasDb) {
      return NextResponse.json({ error: "Database mavjud emas" }, { status: 500 })
    }

    // Check if user already reviewed this item
    const existingReview = await sql`
      SELECT id FROM reviews 
      WHERE user_id = ${userId} AND menu_item_id = ${menuItemId}
    `

    if (existingReview.length > 0) {
      return NextResponse.json({ error: "Siz bu mahsulotni allaqachon baholagansiz" }, { status: 409 })
    }

    // Add review
    const newReview = await sql`
      INSERT INTO reviews (user_id, menu_item_id, rating, comment)
      VALUES (${userId}, ${menuItemId}, ${rating}, ${comment || null})
      RETURNING *
    `

    return NextResponse.json({ 
      success: true, 
      review: newReview[0] 
    })

  } catch (error) {
    console.error("Add review error:", error)
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 })
  }
}