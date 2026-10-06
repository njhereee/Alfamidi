import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing Supabase URL or Anon Key in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  if (!fs.existsSync('stores.csv')) {
    console.error("File stores.csv tidak ditemukan. Harap simpan data CSV Anda ke file 'stores.csv'");
    return;
  }
  
  const content = fs.readFileSync('stores.csv', 'utf8');
  const lines = content.split('\n');
  
  // Asumsi header ada di baris pertama
  // Format: No,Branch,Target Ceklist BMT,Nama Toko,NAMA WILAYAH MTC,Nama BMT,NIK BMT,NAMA WILAYAH BMR,Nama BMR,NIK BMR,NAMA WILAYAH BMC,Nama Coordinator,NIK Coordinator,...
  
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`Memproses ${lines.length - 1} baris data...`);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by comma tapi handle koma di dalam quotes jika ada (meskipun data contoh tidak punya)
    const cols = line.split(',');
    if (cols.length < 13) continue;
    
    const kodeToko = cols[2].trim();
    const namaBmt = cols[5].trim() === 'VACANT' ? null : cols[5].trim();
    const nikBmt = cols[6].trim() === '#N/A' || cols[6].trim() === 'VACANT' || !cols[6].trim() ? null : cols[6].trim();
    const namaCoordinator = cols[11].trim() === 'VACANT' ? null : cols[11].trim();
    const nikCoordinator = cols[12].trim() === '#N/A' || cols[12].trim() === 'VACANT' || !cols[12].trim() ? null : cols[12].trim();
    
    if (kodeToko) {
      const { error } = await supabase
        .from('stores')
        .update({
          nama_coordinator: namaCoordinator,
          nik_coordinator: nikCoordinator,
          nama_bmt: namaBmt,
          nik_bmt: nikBmt
        })
        .eq('kode', kodeToko);
        
      if (error) {
        console.error(`Error update toko ${kodeToko}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`Berhasil update ${successCount} toko...`);
        }
      }
    }
  }
  
  console.log(`Selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
}

run();
