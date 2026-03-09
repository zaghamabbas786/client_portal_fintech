/**
 * Run once to create the community-images bucket in Supabase Storage.
 * Usage: npx tsx scripts/create-storage-bucket.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data: existing } = await supabase.storage.listBuckets()
  const alreadyExists = existing?.some((b) => b.name === 'community-images')

  if (alreadyExists) {
    console.log('✅ community-images bucket already exists')
    return
  }

  const { error } = await supabase.storage.createBucket('community-images', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  })

  if (error) {
    console.error('❌ Failed to create bucket:', error.message)
    process.exit(1)
  }

  console.log('✅ community-images bucket created (public, 5 MB max, images only)')
}

main()
