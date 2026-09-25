'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Settings2, FileText, Snowflake, Zap } from 'lucide-react'

type Store = {
  id: string
  kode: string
  nama: string
  branch: string
  nama_bmt: string
  submitted_at?: string
  is_done?: boolean
}

export default function ChecklistDetailView({ checklist, onStoreClick }: { checklist: any, onStoreClick: (store: any, isDone: boolean) => void }) {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCabang, setSelectedCabang] = useState('')

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()

        // Ambil semua stores
        const { data: storesData, error } = await supabase
          .from('stores')
          .select('id, kode, nama, branch, nama_bmt')
          .order('branch', { ascending: true })

        if (error) throw error

        // Ambil submission yang sudah ada untuk cek status done
        const { data: submissions } = await supabase
          .from('fcpt_submissions')
          .select('store_kode, submitted_at')

        const doneMap: Record<string, string> = {}
        submissions?.forEach(s => {
          doneMap[s.store_kode] = s.submitted_at
        })

        const merged = (storesData || []).map(s => ({
          ...s,
          submitted_at: doneMap[s.kode] || null,
          is_done: !!doneMap[s.kode],
        }))

        setStores(merged)
      } catch (err) {
        console.error('Gagal fetch stores:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  const uniqueCabang = Array.from(new Set(stores.map(s => s.branch))).sort()

  const filteredStores = stores.filter(store => {
    const matchSearch = store.nama.toLowerCase().includes(search.toLowerCase()) ||
                        store.kode.toLowerCase().includes(search.toLowerCase()) ||
                        store.branch.toLowerCase().includes(search.toLowerCase()) ||
                        store.nama_bmt?.toLowerCase().includes(search.toLowerCase())
    const matchCabang = selectedCabang === '' || store.branch === selectedCabang
    return matchSearch && matchCabang
  })

  const renderIcon = () => {
    const title = checklist?.title?.toLowerCase() || ''
    if (title.includes('fcpt')) return <Settings2 size={16} />
    if (title.includes('pendingin')) return <Snowflake size={16} />
    if (title.includes('genset')) return <Zap size={16} />
    return <FileText size={16} />
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin w-8 h-8 border-4 border-[#cc1e2c] border-t-transparent rounded-full" />
    </div>
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Search & Filter Bar */}
      <div className="flex gap-4 items-center mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari Toko, Cabang, atau Kode..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800 shadow-sm transition-all"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          <select 
            value={selectedCabang}
            onChange={(e) => setSelectedCabang(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3.5 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] transition-colors shadow-sm cursor-pointer"
          >
            <option value="">Semua Wilayah</option>
            {uniqueCabang.map(cabang => (
              <option key={cabang} value={cabang}>{cabang}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-400 font-medium">{filteredStores.length} toko ditemukan</p>

      {/* Grid of Store Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredStores.map(store => {
          const isDone = !!store.is_done
          // Format tanggal submitted_at
          const dateLabel = store.submitted_at
            ? new Date(store.submitted_at).toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : 'Belum dicek'

          return (
            <motion.div 
              key={store.id}
              whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              onClick={() => onStoreClick(store, isDone)}
              className={`rounded-2xl border ${isDone ? 'border-blue-200 bg-blue-50/50' : 'border-red-200 bg-red-50/50'} overflow-hidden transition-all duration-300 cursor-pointer flex flex-col shadow-sm`}
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
              <div className={`px-5 py-3 border-t ${isDone ? 'bg-blue-100/50 border-blue-200' : 'bg-red-100/50 border-red-200'} flex items-center justify-between`}>
                <div className={`flex items-center gap-2 font-bold text-sm ${isDone ? 'text-blue-700' : 'text-red-700'}`}>
                  {renderIcon()}
                  <span>{checklist?.title?.replace(/\n/g, ' ') || 'Checklist'}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${isDone ? 'text-blue-600' : 'text-red-500'}`}>
                    {dateLabel}
                  </span>
                  <div className={`px-3 py-1 rounded-full text-xs font-black text-white shadow-sm ${isDone ? 'bg-[#0c539a]' : 'bg-[#cc1e2c]'}`}>
                    {isDone ? '1/1' : '0/1'}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {filteredStores.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-500">
          Tidak ada toko yang cocok dengan pencarian &ldquo;{search}&rdquo;.
        </div>
      )}
    </motion.div>
  )
}
