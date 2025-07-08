import { NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month' // day, week, month, year

    if (!hasDb) {
      return NextResponse.json({
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        averageOrderValue: 0,
        revenueByPeriod: [],
        ordersByStatus: [],
        topProducts: []
      })
    }

    // Calculate date range
    let dateFilter = ''
    switch (period) {
      case 'day':
        dateFilter = "created_at >= CURRENT_DATE"
        break
      case 'week':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'"
        break
      case 'month':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'"
        break
      case 'year':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '365 days'"
        break
      default:
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'"
    }

    // Total revenue
    const revenueResult = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders 
      WHERE ${sql.unsafe(dateFilter)} AND status = 'delivered'
    `
    const totalRevenue = parseFloat(revenueResult[0].total_revenue)

    // Total orders
    const ordersResult = await sql`
      SELECT COUNT(*) as total_orders
      FROM orders 
      WHERE ${sql.unsafe(dateFilter)}
    `
    const totalOrders = parseInt(ordersResult[0].total_orders)

    // Total users
    const usersResult = await sql`
      SELECT COUNT(*) as total_users
      FROM users 
      WHERE ${sql.unsafe(dateFilter)}
    `
    const totalUsers = parseInt(usersResult[0].total_users)

    // Average order value
    const avgOrderResult = await sql`
      SELECT COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders 
      WHERE ${sql.unsafe(dateFilter)} AND status = 'delivered'
    `
    const averageOrderValue = parseFloat(avgOrderResult[0].avg_order_value)

    // Revenue by period
    const revenueByPeriod = await sql`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE ${sql.unsafe(dateFilter)} AND status = 'delivered'
      GROUP BY DATE(created_at)
      ORDER BY date
    `

    // Orders by status
    const ordersByStatus = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      WHERE ${sql.unsafe(dateFilter)}
      GROUP BY status
    `

    // Top products
    const topProducts = await sql`
      SELECT 
        mi.name_uz as name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.${sql.unsafe(dateFilter)} AND o.status = 'delivered'
      GROUP BY mi.id, mi.name_uz
      ORDER BY total_sold DESC
      LIMIT 10
    `

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalUsers,
      averageOrderValue,
      revenueByPeriod,
      ordersByStatus,
      topProducts
    })

  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 })
  }
}