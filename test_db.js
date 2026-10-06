import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1]
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1]

const supabase = createClient(url, key)

async function run() {
  const { data, error } = await supabase.from('stores').select('kode, nama_coordinator, nik_coordinator').limit(5)
  console.log('Stores data:', data)
  console.log('Error:', error)
}
run()
