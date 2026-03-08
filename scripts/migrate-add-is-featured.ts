import { supabaseAdmin } from '../lib/supabase-admin'

/**
 * Migration: Add is_featured column to hiring_signals table
 * This column distinguishes between:
 * - Senior roles (featured=true): CDO, CAIO, VP, Director+ shown on site
 * - Engineer roles (featured=false): Data/ML/AI Engineers for tech stack signals only
 */
export async function runMigration() {
  console.log('Starting migration: add is_featured column to hiring_signals')

  try {
    // Step 1: Add is_featured column with default TRUE
    console.log('Adding is_featured column...')
    const { error: addColumnError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE hiring_signals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT TRUE',
    })

    if (addColumnError) {
      // If rpc doesn't work, try direct query
      const { error: directError } = await supabaseAdmin
        .from('hiring_signals')
        .select('is_featured')
        .limit(1)

      if (directError && directError.message.includes('column "is_featured" does not exist')) {
        console.error('Cannot add column via Supabase client. Please run this SQL manually in Supabase SQL Editor:')
        console.error('\nALTER TABLE hiring_signals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT TRUE;')
        console.error('UPDATE hiring_signals SET is_featured = TRUE WHERE is_featured IS NULL;')
        console.error('\nAfter running the SQL, re-run this migration.')
        throw new Error('Manual SQL execution required')
      }
    }

    console.log('✓ Column added')

    // Step 2: Backfill existing rows to TRUE
    console.log('Backfilling existing rows with is_featured = TRUE...')
    const { error: updateError } = await supabaseAdmin
      .from('hiring_signals')
      .update({ is_featured: true })
      .is('is_featured', null)

    if (updateError) {
      console.error('Error backfilling is_featured:', updateError.message)
      throw updateError
    }

    console.log('✓ Backfill complete')

    // Step 3: Verify
    const { count, error: countError } = await supabaseAdmin
      .from('hiring_signals')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error verifying migration:', countError.message)
      throw countError
    }

    console.log(`✓ Migration successful. Total rows in hiring_signals: ${count}`)
    console.log('All existing rows are now marked as is_featured = true')

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}
