import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

const demoMenuItems = [
  {
    id: 1,
    category_id: 1,
    name_uz: "Margherita Pizza",
    name_ru: "Пицца Маргарита", 
    name_en: "Margherita Pizza",
    description_uz: "Klassik italyan pitsasi mozzarella va rayhon bilan",
    description_ru: "Классическая итальянская пицца с моцареллой и базиликом",
    description_en: "Classic Italian pizza with mozzarella and basil",
    price: 45000,
    image_url: "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg",
    category_name_uz: "Pitsalar",
    category_name_ru: "Пиццы",
    category_name_en: "Pizzas"
  },
  {
    id: 2,
    category_id: 1,
    name_uz: "Pepperoni Pizza",
    name_ru: "Пицца Пепперони",
    name_en: "Pepperoni Pizza", 
    description_uz: "Pepperoni kolbasa bilan pitsa",
    description_ru: "Пицца с колбасой пепперони",
    description_en: "Pizza with pepperoni sausage",
    price: 55000,
    image_url: "https://images.pexels.com/photos/708587/pexels-photo-708587.jpeg",
    category_name_uz: "Pitsalar",
    category_name_ru: "Пиццы", 
    category_name_en: "Pizzas"
  },
  {
    id: 3,
    category_id: 2,
    name_uz: "Milano Burger",
    name_ru: "Бургер Милано",
    name_en: "Milano Burger",
    description_uz: "Maxsus Milano sousi bilan premium mol go'shti burgeri",
    description_ru: "Премиум бургер из говядины со специальным соусом Милано",
    description_en: "Premium beef burger with special Milano sauce",
    price: 35000,
    image_url: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg",
    category_name_uz: "Burgerlar",
    category_name_ru: "Бургеры",
    category_name_en: "Burgers"
  },
  {
    id: 4,
    category_id: 3,
    name_uz: "Coca Cola",
    name_ru: "Кока Кола",
    name_en: "Coca Cola",
    description_uz: "Sovuq gazlangan ichimlik",
    description_ru: "Холодный газированный напиток", 
    description_en: "Cold carbonated drink",
    price: 8000,
    image_url: "https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg",
    category_name_uz: "Ichimliklar",
    category_name_ru: "Напитки",
    category_name_en: "Drinks"
  },
  {
    id: 5,
    category_id: 3,
    name_uz: "Fresh Orange",
    name_ru: "Свежий апельсин",
    name_en: "Fresh Orange",
    description_uz: "Yangi siqilgan apelsin sharbati",
    description_ru: "Свежевыжатый апельсиновый сок",
    description_en: "Freshly squeezed orange juice",
    price: 12000,
    image_url: "https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg",
    category_name_uz: "Ichimliklar", 
    category_name_ru: "Напитки",
    category_name_en: "Drinks"
  }
]

export async function GET() {
  if (!hasDb) {
    console.log("🍽️ Fetching menu items in DEMO mode")
    return NextResponse.json({ menuItems: demoMenuItems })
  }

  try {
    console.log("🍽️ Fetching menu items from DATABASE")
    const menuItems = await sql`
      SELECT 
        mi.*,
        c.name_uz as category_name_uz,
        c.name_ru as category_name_ru,
        c.name_en as category_name_en
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = TRUE
      ORDER BY mi.category_id, mi.name_uz
    `

    const menuItemsArray = Array.isArray(menuItems) ? menuItems : menuItems.rows || []
    console.log("✅ Fetched menu items from database, count:", menuItemsArray.length)

    return NextResponse.json({ menuItems: menuItemsArray })
  } catch (error) {
    console.error("❌ Error fetching menu items:", error)
    // Fallback to demo menu if database fails
    return NextResponse.json({ menuItems: demoMenuItems })
  }
}