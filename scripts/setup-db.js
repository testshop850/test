const { initializeDatabase } = require('../lib/db.ts')

async function setupDatabase() {
  console.log('🚀 Setting up database...')
  
  try {
    const success = await initializeDatabase()
    if (success) {
      console.log('✅ Database setup completed successfully!')
    } else {
      console.log('⚠️ Running in demo mode (no database)')
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

setupDatabase()