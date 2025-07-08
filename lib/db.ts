import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)
export const hasDb = !!process.env.DATABASE_URL

export async function testConnection() {
  try {
    if (!hasDb) {
      console.log("⚠️ No database URL provided, running in demo mode")
      return false
    }
    await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

export async function initializeDatabase() {
  if (!hasDb) return false
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name_uz VARCHAR(255) NOT NULL,
        name_ru VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name_uz VARCHAR(255) NOT NULL,
        name_ru VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        description_uz TEXT,
        description_ru TEXT,
        description_en TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        delivery_address TEXT NOT NULL,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        phone VARCHAR(50) NOT NULL,
        notes TEXT,
        payment_method VARCHAR(50) DEFAULT 'cash',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        menu_item_id INTEGER REFERENCES menu_items(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, menu_item_id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    const adminExists = await sql`
      SELECT id FROM users WHERE email = 'devolper2011@gmail.com'
    `
    
    if (adminExists.length === 0) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin2011', 12)
      
      await sql`
        INSERT INTO users (email, password, name, is_admin)
        VALUES ('devolper2011@gmail.com', ${hashedPassword}, 'Super Admin', TRUE)
      `
    }

    const categoriesExist = await sql`SELECT COUNT(*) as count FROM categories`
    if (categoriesExist[0].count === 0) {
      await sql`
        INSERT INTO categories (name_uz, name_ru, name_en, image_url) VALUES
        ('Pitsalar', 'Пиццы', 'Pizzas', '/images/pizza.jpg'),
        ('Burgerlar', 'Бургеры', 'Burgers', '/images/burger.jpg'),
        ('Ichimliklar', 'Напитки', 'Drinks', '/images/drinks.jpg'),
        ('Salatlar', 'Салаты', 'Salads', '/images/salad.jpg'),
        ('Shirinliklar', 'Десерты', 'Desserts', '/images/dessert.jpg')
      `
    }

    const menuItemsExist = await sql`SELECT COUNT(*) as count FROM menu_items`
    if (menuItemsExist[0].count === 0) {
      await sql`
        INSERT INTO menu_items (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, price, image_url) VALUES
        (1, 'Margherita Pizza', 'Пицца Маргарита', 'Margherita Pizza', 'Klassik italyan pitsasi', 'Классическая итальянская пицца', 'Classic Italian pizza', 45000, '/images/margherita.jpg'),
        (1, 'Pepperoni Pizza', 'Пицца Пепперони', 'Pepperoni Pizza', 'Pepperoni bilan pitsa', 'Пицца с пепперони', 'Pizza with pepperoni', 55000, '/images/pepperoni.jpg'),
        (2, 'Milano Burger', 'Бургер Милано', 'Milano Burger', 'Maxsus Milano burgeri', 'Специальный бургер Милано', 'Special Milano burger', 35000, '/images/milano-burger.jpg'),
        (2, 'Cheese Burger', 'Чизбургер', 'Cheese Burger', 'Pishloqli burger', 'Бургер с сыром', 'Burger with cheese', 30000, '/images/cheeseburger.jpg'),
        (3, 'Coca Cola', 'Кока Кола', 'Coca Cola', 'Sovuq ichimlik', 'Холодный напиток', 'Cold drink', 8000, '/images/coca-cola.jpg'),
        (3, 'Fresh Orange', 'Свежий апельсин', 'Fresh Orange', 'Yangi apelsin sharbati', 'Свежий апельсиновый сок', 'Fresh orange juice', 12000, '/images/orange-juice.jpg')
      `
    }

    console.log("✅ Database initialized successfully")
    return true
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    return false
  }
}