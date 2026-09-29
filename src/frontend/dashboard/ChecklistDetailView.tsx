'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Settings2, FileText, Snowflake, Zap, User } from 'lucide-react'
import {
  CHILLER_EQUIPMENT_CHECKLIST_TOTAL,
  normalizeEquipmentTypeFromSubmission,
} from './chillerChecklistConfig'

type Store = {
  id: string
  kode: string
  nama: string
  branch: string
  nama_bmt: string
  submitted_at?: string
  is_done?: boolean
  checklist_done_count?: number
  checklist_total?: number
}

function isChillerEquipmentChecklist(checklist: { id?: number; title?: string } | null | undefined) {
  if (!checklist) return false
  if (checklist.id === 3) return true
  const title = (checklist.title ?? '').replace(/\s+/g, ' ').toLowerCase()
  return title.includes('pendingin') || title.includes('chiller')
}

export default function ChecklistDetailView({ 
  checklist, 
  onStoreClick 
}: { 
  checklist: any, 
  onStoreClick: (store: any, isDone: boolean) => void 
}) {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCabang, setSelectedCabang] = useState('')
  
  // State otomatis dari Supabase Login
  const [userRole, setUserRole] = useState('')
  const [currentUserBmtName, setCurrentUserBmtName] = useState('')
  const [selectedBmt, setSelectedBmt] = useState('') // Dropdown filter untuk HO/Admin

  const chillerChecklist = isChillerEquipmentChecklist(checklist)

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const { createClient } = await import('@/frontend/supabase/client')
        const supabase = createClient()

        // 1. CEK USER YANG LOGIN
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError

        let currentRole = 'BMT'
        let currentName = ''

        if (user) {
          // AMBIL ROLE DAN NAMA DARI TABEL PROFILES (Menggunakan full_name)
          const { data: profile } = await supabase
            .from('profiles') 
            .select('role, full_name') // Berubah di sini
            .eq('id', user.id)
            .single()

          if (profile) {
            currentRole = profile.role || 'BMT'
            currentName = profile.full_name || '' // Berubah di sini
          } else if (user.user_metadata) {
            currentRole = user.user_metadata.role || 'BMT'
            currentName = user.user_metadata.full_name || user.user_metadata.name || ''
          }
        }

        setUserRole(currentRole)
        setCurrentUserBmtName(currentName)

        // 2. FETCH SEMUA TOKO
        // (Catatan: Kolom di tabel stores tetap nama_bmt)
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, kode, nama, branch, nama_bmt')
          .order('branch', { ascending: true })

        if (storesError) throw storesError

        // 3. FETCH SUBMISSION (Untuk status checklist)

// Tentukan nama tabel berdasarkan title dari props 'checklist'
let tableName = 'fcpt_submissions'
const categoryTitle = (checklist?.title ?? '').replace(/\s+/g, ' ').toLowerCase()

const isChillerChecklist = isChillerEquipmentChecklist(checklist)

if (isChillerChecklist) {
  tableName = 'chiller_submissions'
} else if (categoryTitle.includes('genset')) {
  tableName = 'genset_submissions'
}

let merged: Store[] = []

if (isChillerChecklist) {
  const { data: submissions, error: subError } = await supabase
    .from('chiller_submissions')
    .select('kode_toko, jenis_mesin, submitted_at, created_at')

  if (subError) {
    console.error('Gagal fetch tabel chiller_submissions:', subError)
  }

  const progressByStore: Record<
    string,
    { types: Set<string>; latestAt: string | null }
  > = {}

  submissions?.forEach((s) => {
    const kode = s.kode_toko
    if (!kode) return
    if (!progressByStore[kode]) {
      progressByStore[kode] = { types: new Set(), latestAt: null }
    }
    const bucket = progressByStore[kode]
    const equipmentType = normalizeEquipmentTypeFromSubmission(s.jenis_mesin)
    if (equipmentType) bucket.types.add(equipmentType)
    const ts = s.submitted_at || s.created_at
    if (ts && (!bucket.latestAt || ts > bucket.latestAt)) {
      bucket.latestAt = ts
    }
  })

  merged = (storesData || []).map((s) => {
    const progress = progressByStore[s.kode]
    const doneCount = progress?.types.size ?? 0
    const total = CHILLER_EQUIPMENT_CHECKLIST_TOTAL
    return {
      ...s,
      submitted_at: progress?.latestAt ?? undefined,
      checklist_done_count: doneCount,
      checklist_total: total,
      is_done: doneCount >= total,
    }
  })
} else {
  const { data: submissions, error: subError } = await supabase
    .from(tableName)
    .select('store_kode, submitted_at, created_at')

  if (subError) {
    console.error(`Gagal fetch tabel ${tableName}:`, subError)
  }

  const doneMap: Record<string, string> = {}
  submissions?.forEach((s) => {
    doneMap[s.store_kode] = s.submitted_at || s.created_at
  })

  merged = (storesData || []).map((s) => ({
    ...s,
    submitted_at: doneMap[s.kode] || undefined,
    checklist_done_count: doneMap[s.kode] ? 1 : 0,
    checklist_total: 1,
    is_done: !!doneMap[s.kode],
  }))
}

setStores(merged)
      } catch (err) {
        console.error('Gagal fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [checklist?.id, checklist?.title])

  // ==============================
  // LOGIKA FILTERING (CASE-INSENSITIVE)
  // ==============================
  const isBMT = userRole.toUpperCase() === 'BMT'

  const filteredStores = stores.filter(store => {
    const storeBmt = (store.nama_bmt || '').trim().toLowerCase()
    const targetBmt = currentUserBmtName.trim().toLowerCase()
    const filterBmtSelection = selectedBmt.trim().toLowerCase()

    // Jika BMT -> Filter ketat sesuai namanya
    // Jika BUKAN BMT (HO/Admin) -> Bebas lihat semua atau pilih via dropdown
    const isAllowedToSee = isBMT 
      ? (targetBmt !== '' && storeBmt === targetBmt)
      : (selectedBmt === '' || storeBmt === filterBmtSelection)

    const matchSearch = store.nama.toLowerCase().includes(search.toLowerCase()) ||
                        store.kode.toLowerCase().includes(search.toLowerCase()) ||
                        store.branch.toLowerCase().includes(search.toLowerCase())
    
    const matchCabang = selectedCabang === '' || store.branch === selectedCabang
    
    return isAllowedToSee && matchSearch && matchCabang
  })

  // Dapatkan opsi Cabang dinamis (Hanya cabang yang BOLEH dia lihat)
  const allowedCabang = Array.from(new Set(
    stores
      .filter(s => {
        if (!isBMT) return true; // Non-BMT lihat semua cabang
        return (s.nama_bmt || '').trim().toLowerCase() === currentUserBmtName.trim().toLowerCase()
      })
      .map(s => s.branch)
  )).sort()

  const uniqueBmt = Array.from(new Set(stores.map(s => s.nama_bmt).filter(Boolean))).sort()

  const renderIcon = () => {
    const title = checklist?.title?.toLowerCase() || ''
    if (title.includes('fcpt')) return <Settings2 size={16} />
    if (title.includes('pendingin')) return <Snowflake size={16} />
    if (title.includes('genset')) return <Zap size={16} />
    return <FileText size={16} />
  }

  // ==============================
  // RENDERING UI
  // ==============================

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="animate-spin w-8 h-8 border-4 border-[#cc1e2c] border-t-transparent rounded-full" />
      <p className="text-sm text-gray-500 font-medium">Memverifikasi profil & memuat toko...</p>
    </div>
  )

  // Pesan error jika user diset sebagai BMT tapi namanya (full_name) tidak ada di tabel profiles
  if (isBMT && !currentUserBmtName) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl max-w-md border border-red-100 shadow-sm">
          <h3 className="font-bold mb-2">Data Profil Belum Lengkap</h3>
          <p className="text-sm">Akun Anda terdeteksi sebagai BMT, namun nama profil Anda kosong. Sistem tidak dapat memfilter toko. Silakan lengkapi profil Anda atau hubungi Admin.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari Toko, Cabang, atau Kode..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800 shadow-sm transition-all"
          />
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          
          {/* Dropdown PIC HANYA TAMPIL JIKA BUKAN BMT (Misal: HO / Admin) */}
          {!isBMT && (
            <div className="relative flex-1 md:w-48">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <select 
                value={selectedBmt}
                onChange={(e) => setSelectedBmt(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3.5 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] transition-colors shadow-sm cursor-pointer truncate"
              >
                <option value="">Semua PIC</option>
                {uniqueBmt.map(bmt => (
                  <option key={bmt} value={bmt}>{bmt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dropdown Filter Cabang */}
          <div className="relative flex-1 md:w-48">
            <SlidersHorizontal className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <select 
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3.5 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] transition-colors shadow-sm cursor-pointer truncate"
            >
              <option value="">Semua Wilayah</option>
              {allowedCabang.map(cabang => (
                <option key={cabang} value={cabang}>{cabang}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400 font-medium">{filteredStores.length} toko ditemukan</p>

      {/* Grid of Store Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredStores.map(store => {
          const doneCount = store.checklist_done_count ?? 0
          const totalCount =
            store.checklist_total ??
            (chillerChecklist ? CHILLER_EQUIPMENT_CHECKLIST_TOTAL : 1)
          const isDone = !!store.is_done
          const hasPartialProgress = doneCount > 0 && doneCount < totalCount
          const dateLabel = store.submitted_at
            ? new Date(store.submitted_at).toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : 'Belum dicek'
          const progressLabel = `${doneCount}/${totalCount}`
          const cardComplete = isDone
          const cardPartial = hasPartialProgress

          return (
            <motion.div 
              key={store.id}
              whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              onClick={() => onStoreClick(store, isDone)}
              className={`rounded-2xl border ${
                cardComplete
                  ? 'border-blue-200 bg-blue-50/50'
                  : cardPartial
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-red-200 bg-red-50/50'
              } overflow-hidden transition-all duration-300 cursor-pointer flex flex-col shadow-sm`}
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-gray-800 text-lg tracking-tight">{store.kode}</span>
                  <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">{store.branch}</span>
                </div>
                <h3 className="text-gray-700 font-bold mb-1 truncate">{store.nama}</h3>
                <p className="text-gray-500 text-sm">{store.nama_bmt}</p>
              </div>

              {/* Bottom Pill */}
              <div
                className={`px-5 py-3 border-t flex items-center justify-between ${
                  cardComplete
                    ? 'bg-blue-100/50 border-blue-200'
                    : cardPartial
                      ? 'bg-amber-100/50 border-amber-200'
                      : 'bg-red-100/50 border-red-200'
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-bold text-sm ${
                    cardComplete ? 'text-blue-700' : cardPartial ? 'text-amber-800' : 'text-red-700'
                  }`}
                >
                  {renderIcon()}
                  <span>{checklist?.title?.replace(/\n/g, ' ') || 'Checklist'}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-medium ${
                      cardComplete ? 'text-blue-600' : cardPartial ? 'text-amber-700' : 'text-red-500'
                    }`}
                  >
                    {dateLabel}
                  </span>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-black text-white shadow-sm ${
                      cardComplete ? 'bg-[#0c539a]' : cardPartial ? 'bg-amber-600' : 'bg-[#cc1e2c]'
                    }`}
                  >
                    {progressLabel}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {filteredStores.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-500">
          Tidak ada toko yang tersedia untuk Anda.
        </div>
      )}
    </motion.div>
  )
}