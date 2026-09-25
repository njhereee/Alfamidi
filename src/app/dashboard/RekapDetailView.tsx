'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Image as ImageIcon, ArrowLeft } from 'lucide-react'

// ─── TEMPLATE FORM (Untuk memetakan ID ke Label dan Kategori) ────────────────
const formDataTemplate = [
  {
    category: 'A. Area Parkir dan Fasade',
    items: [
      { id: 'A1', label: 'HALAMAN PARKIR (Rabat beton/aspal/paving, ambles, retak, gelombang)' },
      { id: 'A2', label: 'DRAINASE (Grill, saluran, tutup saluran, kelancaran aliran)' },
      { id: 'A3', label: 'KANOPI (Tiang, rangka, cat, baut, korosi)' },
      { id: 'A4', label: 'SIGNAGE (Papan nama toko, spanduk, tenant)' },
      { id: 'A5', label: 'FINISHING (Pengecatan Area Facade)' },
    ]
  },
  {
    category: 'B. AREA TERAS DAN AREA SALES',
    items: [
      { id: 'B1', label: 'STRUKTUR (Kolom, balok, sloof dan Pondasi, dinding, retak, cat)' },
      { id: 'B2', label: 'LANTAI (Keramik, nat, level lantai)' },
      { id: 'B3', label: 'PLAFON (Drop ceiling, gutter, finishing)' },
      { id: 'B4', label: 'FURNITURE (Meja kasir, rak tetap, partisi)' },
      { id: 'B5', label: 'DRAIN AC (Drain, bak kontrol, kebocoran)' },
      { id: 'B6', label: 'FOLDING GATE (Daun Folding Gate, Rel, Rangka, Cat)' },
      { id: 'B7', label: 'FINISHING (Pengecatan Kolom dinding dan Plafon)' },
    ]
  },
  {
    category: 'C. AREA SERVICE',
    items: [
      { id: 'C1', label: 'FINISHING (Pengecatan Kolom, dinding, plafon)' },
      { id: 'C2', label: 'GUDANG (Janitor, tangga)' },
      { id: 'C3', label: 'Utilitas (Sarana dan Instalasi Air Bersih dan Air Kotor)' },
      { id: 'C4', label: 'LANTAI (Keramik, nat, level lantai)' },
    ]
  },
  {
    category: 'D. KM/WC SANITARY',
    items: [
      { id: 'D1', label: 'FINISHING (Lantai, dinding, plafon)' },
      { id: 'D2', label: 'SANITARY (Closet, urinoir, kran, shower, floor drain)' },
      { id: 'D3', label: 'AIR BERSIH (Pompa, tower, tandon, sumur, PAM, dan Kualitas Air)' },
    ]
  },
  {
    category: 'E. PINTU',
    items: [
      { id: 'E1', label: 'PINTU KACA (Handle, lock, floor hinge, seal)' },
      { id: 'E2', label: 'PINTU AREA SERVICE (Engsel, handle, cat)' },
      { id: 'E3', label: 'HARDWARE (Door closer, bowdigit, slot)' },
    ]
  },
  {
    category: 'F. PENUTUP BANGUNAN',
    items: [
      { id: 'F1', label: 'ATAP (Atap, nok, talang, roof drain)' },
      { id: 'F2', label: 'CLADDING (Cladding Merah/Silver, Flushing)' },
    ]
  },
  {
    category: 'G. MATERIAL ELEKTRIKAL LUAR',
    items: [
      { id: 'G1', label: 'PENERANGAN (Lampu luar, sign, parkir)' },
      { id: 'G2', label: 'INSTALASI (Stop kontak, outdoor AC)' },
    ]
  },
  {
    category: 'H. MATERIAL ELEKTRIKAL SALES',
    items: [
      { id: 'H1', label: 'PENCAHAYAAN (TL, LED, downlight)' },
      { id: 'H2', label: 'PERALATAN (Speaker, CCTV, Air Curtain, APAR)' },
      { id: 'H3', label: 'INSTALASI (Saklar, stop kontak, kabel)' },
    ]
  },
  {
    category: 'I. MATERIAL ELEKTRIKAL SERVICE',
    items: [
      { id: 'I1', label: 'ELEKTRIKAL (exhaust, saklar, stop kontak)' },
      { id: 'I2', label: 'PENCAHAYAAN (lampu)' },
    ]
  },
  {
    category: 'J. PANEL & GENSET',
    items: [
      { id: 'J1', label: 'PANEL LV (Volt, Ampere, CT, Timer, Pilot Lamp)' },
      { id: 'J2', label: 'PROTEKSI (MCB, MCCB, COS, Kontaktor)' },
      { id: 'J3', label: 'GENSET (Earthing, Wiring, Steker)' },
    ]
  }
]

// ─── Komponen Badge Status Dinamis ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  let styles = 'bg-gray-100 text-gray-500 border-gray-200'
  
  if (status === 'BAIK') {
    styles = 'bg-emerald-100 text-emerald-700 border-emerald-200'
  } else if (status === 'RUSAK MASIH DAPAT DIGUNAKAN') {
    styles = 'bg-amber-100 text-amber-700 border-amber-200'
  } else if (status === 'RUSAK TIDAK DAPAT DIGUNAKAN') {
    styles = 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <span className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border text-center leading-tight shadow-sm ${styles}`}>
      {status}
    </span>
  )
}

// ─── Komponen Accordion Kategori ───────────────────────────────────────────────
function CategoryAccordion({ cat }: { cat: any }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-5 py-4 flex justify-between items-center transition-colors ${open ? 'bg-[#0c539a] text-white' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-gray-800'}`}
      >
        <span className="font-bold text-sm uppercase tracking-wide text-left">
          {cat.id}. {cat.title}
        </span>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className={`font-black text-lg ${cat.nilai < 90 ? (open ? 'text-red-200' : 'text-red-500') : (open ? 'text-white' : 'text-emerald-600')}`}>
            {cat.nilai}
          </span>
          {open
            ? <ChevronUp size={18} className="text-white" />
            : <ChevronDown size={18} className="text-gray-500" />
          }
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-white"
          >
            <div className="divide-y divide-gray-100">
              {cat.items.map((item: any) => (
                <div key={item.code} className="p-5 space-y-4 hover:bg-gray-50 transition-colors">
                  {/* Header Sub-item */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <p className="font-bold text-gray-800 text-sm leading-snug flex-1">
                      {item.code}. {item.label}
                    </p>
                    <div className="shrink-0 flex items-center sm:items-end flex-row sm:flex-col gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs font-bold text-gray-400">Skor: {item.nilaiItem}</span>
                    </div>
                  </div>
                  
                  {/* Keterangan */}
                  <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-700">Keterangan:</span> {item.keterangan}</p>
                  </div>
                  
                  {/* Foto */}
                  {item.photo ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative max-w-sm">
                      <img
                        src={item.photo}
                        alt={`Foto ${item.code}`}
                        className="w-full h-auto object-cover max-h-[300px]"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center text-gray-400 max-w-sm">
                      <ImageIcon size={24} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">Tidak ada foto dilampirkan</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RekapDetailView({ data, onBack }: { data: any, onBack: () => void }) {
  const [achievementOpen, setAchievementOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Fetch Data dari Database
  useEffect(() => {
    const fetchDetailData = async () => {
      try {
        setLoading(true)
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()

        // Ambil submission_id berdasarkan kode toko yg diklik
        const { data: subData } = await supabase
          .from('fcpt_submissions')
          .select('id')
          .eq('store_kode', data?.kodeToko)
          .single()

        if (subData?.id) {
          // Ambil detail items untuk submission ini
          const { data: detailData, error } = await supabase
            .from('fcpt_item_details')
            .select('*')
            .eq('submission_id', subData.id)
            
          if (error) throw error
          setItems(detailData || [])
        }
      } catch (error) {
        console.error('Error fetching details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (data?.kodeToko) fetchDetailData()
  }, [data])

  // 2. Olah & Kelompokkan Data Live
  const calculations = useMemo(() => {
    // a. Perhitungan Rata-rata
    const sipilItems = items.filter(item => /^[A-F]/.test(item.item_id) && item.nilai !== null)
    const mepItems = items.filter(item => /^[G-J]/.test(item.item_id) && item.nilai !== null)

    const avgSipil = sipilItems.length > 0 ? sipilItems.reduce((acc, curr) => acc + curr.nilai, 0) / sipilItems.length : 0
    const avgMep = mepItems.length > 0 ? mepItems.reduce((acc, curr) => acc + curr.nilai, 0) / mepItems.length : 0

    const nilaiAkhir = (avgSipil * 0.75) + (avgMep * 0.25)

    // b. Mapping Data ke struktur "dummyCategories" (Accordion)
    const groupedData = formDataTemplate.map(section => {
      
      const answeredItems = items.filter(dbItem => section.items.some(t => t.id === dbItem.item_id))
      const validAnswers = answeredItems.filter(i => i.nilai !== null)
      
      const avgCategory = validAnswers.length > 0
        ? validAnswers.reduce((acc, curr) => acc + curr.nilai, 0) / validAnswers.length
        : 0

      // Ekstrak ID (A, B, C) dan Judul (Area Parkir...) dari "A. Area Parkir..."
      const splitCat = section.category.split('. ')
      const catId = splitCat[0]
      const catTitle = splitCat[1] || section.category

      const displayItems = section.items.map(templateItem => {
        const dbAnswer = items.find(i => i.item_id === templateItem.id)
        return {
          code: templateItem.id,
          label: templateItem.label,
          status: dbAnswer?.kondisi || 'Belum Diisi',
          keterangan: dbAnswer?.keterangan || '-',
          photo: dbAnswer?.foto_url || null,
          nilaiItem: dbAnswer?.nilai || 0
        }
      }).filter(item => item.status !== 'Belum Diisi') // Hanya tampilkan yang sudah diisi

      return {
        id: catId,
        title: catTitle,
        nilai: Math.round(avgCategory),
        items: displayItems
      }
    }).filter(cat => cat.items.length > 0) // Hanya tampilkan kategori yang ada isinya

    return { 
      avgSipil: Math.round(avgSipil), 
      avgMep: Math.round(avgMep), 
      nilaiAkhir: Math.round(nilaiAkhir), 
      groupedData 
    }
  }, [items])


  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f7fb] gap-4">
      <div className="animate-spin w-10 h-10 border-4 border-[#0c539a] border-t-transparent rounded-full shadow-md" />
      <p className="text-gray-500 font-medium animate-pulse">Memuat data live...</p>
    </div>
  )

  const nilaiColor = calculations.nilaiAkhir < 90 ? 'bg-[#cc1e2c]' : 'bg-[#0c539a]'

  return (
    <div className="w-full min-h-screen bg-[#f4f7fb]">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto pb-24 px-4 pt-6 space-y-6"
      >

        {/* ── Info Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Kode Branch</p>
              <p className="font-bold text-gray-800 text-lg">{data?.kodeToko || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Nama Branch</p>
              <p className="font-bold text-gray-800 text-lg">{data?.namaToko || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Nama PIC</p>
              <p className="font-bold text-gray-800 text-sm">{data?.namaPic || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Periode</p>
              <p className="font-bold text-gray-800 text-sm">Realtime Data</p>
            </div>
          </div>
        </div>

        {/* ── Achievement Accordion ── */}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hidden">
          {/* Bagian ini saya sembunyikan (hidden) sementara karena logic Achievement 
              membutuhkan agregasi toko keseluruhan, sedangkan page ini fokus di 1 toko. 
              Hapus class 'hidden' di baris atas jika ingin tetap menampilkannya. */}
          <button
            onClick={() => setAchievementOpen(!achievementOpen)}
            className={`w-full px-5 py-4 flex justify-between items-center transition-colors ${achievementOpen ? 'bg-[#eef2f6]' : 'bg-white hover:bg-gray-50'}`}
          >
            <span className="font-bold text-gray-800 uppercase tracking-wide">Achievement Kategori</span>
            <div className="flex items-center gap-3">
              <span className="font-black text-gray-800">Cek</span>
              {achievementOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
        </div>

        {/* ── Nilai Akhir & Rataan ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between flex-1 pr-4 sm:border-r border-gray-100">
            <span className="font-black text-gray-800 text-sm sm:text-base uppercase tracking-wide">Nilai Akhir</span>
            <span className={`${nilaiColor} text-white font-black text-xl px-4 py-1.5 rounded-xl shadow-md`}>
              {calculations.nilaiAkhir}
            </span>
          </div>
          <div className="flex items-center justify-between flex-1">
            <span className="font-black text-gray-800 text-sm sm:text-base uppercase tracking-wide">Rataan Sipil</span>
            <span className="bg-[#0c539a] text-white font-black text-xl px-4 py-1.5 rounded-xl shadow-md">
              {calculations.avgSipil}
            </span>
          </div>
        </div>

        {/* ── Category Accordions (Live Data) ── */}
        <div className="space-y-3">
          {calculations.groupedData.length === 0 ? (
             <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
               <p className="text-gray-500 font-medium">Belum ada data checklist yang diisi untuk toko ini.</p>
             </div>
          ) : (
            calculations.groupedData.map((cat) => (
              <CategoryAccordion key={cat.id} cat={cat} />
            ))
          )}
        </div>

      </motion.div>
    </div>
  )
}