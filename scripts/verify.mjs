import { createClient } from '@supabase/supabase-js'

const db = createClient(
  'https://amhfxaqolholacanqyas.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZ4YXFvbGhvbGFjYW5xeWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ5NTc5NiwiZXhwIjoyMDg5MDcxNzk2fQ.R6BmGuHqpTOtjbC8S6Qh2u3RI5FIN9IH4iMOrZMTXtQ'
)

const { data, error } = await db
  .from('questions')
  .select('category')
  .eq('locale', 'de')
  .eq('generated_by', 'migration')

if (error) { console.error(error.message); process.exit(1) }

const cats = {}
data.forEach(q => cats[q.category] = (cats[q.category] || 0) + 1)
console.log(`Total DE migration questions: ${data.length}`)
Object.entries(cats).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`))
