/**
 * Run once to create Supabase Storage buckets and set RLS policies.
 * Usage: npx tsx scripts/create-storage-bucket.ts
 */
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const directUrl = process.env.DIRECT_URL!


if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const BUCKETS = [
  {
    name: 'community-images',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  {
    name: 'ea-files',
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: null,
  },
  {
    name: 'avatars',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    name: 'payout-proofs',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
]

/** RLS policies: authenticated users can INSERT; public can SELECT */
function policiesFor(bucket: string) {
  return [
    {
      name: `${bucket}_insert_auth`,
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage' AND tablename = 'objects'
              AND policyname = '${bucket}_insert_auth'
          ) THEN
            CREATE POLICY "${bucket}_insert_auth" ON storage.objects
              FOR INSERT TO authenticated
              WITH CHECK (bucket_id = '${bucket}');
          END IF;
        END $$;
      `,
    },
    {
      name: `${bucket}_select_public`,
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage' AND tablename = 'objects'
              AND policyname = '${bucket}_select_public'
          ) THEN
            CREATE POLICY "${bucket}_select_public" ON storage.objects
              FOR SELECT TO public
              USING (bucket_id = '${bucket}');
          END IF;
        END $$;
      `,
    },
    {
      name: `${bucket}_delete_auth`,
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage' AND tablename = 'objects'
              AND policyname = '${bucket}_delete_auth'
          ) THEN
            CREATE POLICY "${bucket}_delete_auth" ON storage.objects
              FOR DELETE TO authenticated
              USING (bucket_id = '${bucket}');
          END IF;
        END $$;
      `,
    },
  ]
}

async function main() {
  // ── 1. Create / verify buckets ──────────────────────────────────────────────
  const { data: existing } = await supabase.storage.listBuckets()
  const existingNames = new Set(existing?.map((b) => b.name) ?? [])

  for (const bucket of BUCKETS) {
    if (existingNames.has(bucket.name)) {
      console.log(`✅ "${bucket.name}" bucket already exists`)
    } else {
      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        ...(bucket.allowedMimeTypes ? { allowedMimeTypes: bucket.allowedMimeTypes } : {}),
      })
      if (error) {
        console.error(`❌ Failed to create "${bucket.name}":`, error.message)
      } else {
        console.log(`✅ "${bucket.name}" bucket created`)
      }
    }
  }

  // ── 2. Set RLS policies via direct DB connection ─────────────────────────────
  if (!directUrl) {
    console.warn('⚠️  DIRECT_URL not set — skipping RLS policy setup')
    return
  }

  const pg = new Client({ connectionString: directUrl })
  try {
    await pg.connect()
    console.log('\n🔐 Setting up storage RLS policies…')

    for (const bucket of BUCKETS) {
      for (const policy of policiesFor(bucket.name)) {
        try {
          await pg.query(policy.sql)
          console.log(`   ✅ Policy "${policy.name}"`)
        } catch (err: any) {
          console.error(`   ❌ Policy "${policy.name}": ${err.message}`)
        }
      }
    }
  } finally {
    await pg.end()
  }

  console.log('\n🎉 Done! All buckets and policies are configured.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
