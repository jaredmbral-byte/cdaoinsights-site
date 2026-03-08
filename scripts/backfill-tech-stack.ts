import dotenv from 'dotenv'
import { supabaseAdmin } from '../lib/supabase-admin'
import { extractTechStack } from '../lib/tech-stack'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Verify required env vars
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

/**
 * Backfill tech_stack for existing hiring_signals rows
 * Extracts tech stack from job_title + description (if available)
 */
async function backfillTechStack() {
  console.log('Starting tech_stack backfill...')
  console.log('Fetching rows where tech_stack is null or empty...\n')

  try {
    // Fetch all rows that need backfilling
    // Note: Supabase treats empty arrays as non-null, so we check for both null and empty array
    const { data: rows, error: fetchError } = await supabaseAdmin
      .from('hiring_signals')
      .select('id, job_title, tech_stack')
      .or('tech_stack.is.null,tech_stack.eq.{}')
      .order('ingested_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching rows:', fetchError.message)
      throw fetchError
    }

    if (!rows || rows.length === 0) {
      console.log('✓ No rows need backfilling. All rows have tech_stack populated.')
      return
    }

    console.log(`Found ${rows.length} rows to backfill\n`)

    let updated = 0
    let skipped = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Extract tech stack from job title (descriptions not stored, so use title only)
      const techStack = extractTechStack(row.job_title)

      if (techStack.length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('hiring_signals')
          .update({ tech_stack: techStack })
          .eq('id', row.id)

        if (updateError) {
          console.error(`Error updating row ${row.id}:`, updateError.message)
          skipped++
        } else {
          updated++
        }
      } else {
        // No tech stack found, update to empty array so we don't re-process
        const { error: updateError } = await supabaseAdmin
          .from('hiring_signals')
          .update({ tech_stack: [] })
          .eq('id', row.id)

        if (updateError) {
          console.error(`Error updating row ${row.id}:`, updateError.message)
        }
        skipped++
      }

      // Log progress every 50 rows
      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${rows.length} rows processed...`)
      }
    }

    console.log('\n✓ Backfill complete')
    console.log(`  Updated: ${updated}`)
    console.log(`  Skipped (no tech found): ${skipped}`)

  } catch (error) {
    console.error('Backfill failed:', error)
    throw error
  }
}

console.log('Environment loaded from .env.local')
console.log('Supabase URL:', process.env.SUPABASE_URL)
console.log('')

backfillTechStack()
  .then(() => {
    console.log('\n✅ Backfill completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error)
    process.exit(1)
  })
