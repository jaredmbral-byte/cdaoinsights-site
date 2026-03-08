import dotenv from 'dotenv'
import { runMigration } from './migrate-add-is-featured'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Verify required env vars
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

console.log('Environment loaded from .env.local')
console.log('Supabase URL:', process.env.SUPABASE_URL)
console.log('')

runMigration()
  .then(() => {
    console.log('\n✅ Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
