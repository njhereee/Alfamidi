'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Settings2, FileText, Snowflake, Zap } from 'lucide-react'

// Dummy Data Toko
const dummyStores = [
  { id: 1, kode: 'SG1Z', cabang: 'Banjarmasin', nama: 'PIERRE TENDEAN BJM', pic: 'Budi Santoso', status: '1/1', date: '10/04/2026 09:38:13' },
  { id: 2, kode: 'AB12', cabang: 'Bitung', nama: 'UBM TOWER', pic: 'Siti Aminah', status: '0/1', date: '-' },
  { id: 3, kode: 'AK1N', cabang: 'Medan', nama: 'KAPITU MEDAN', pic: 'Andi Saputra', status: '0/1', date: '-' },
  { id: 4, kode: 'SK16', cabang: 'Manado', nama: 'SEA MANADO', pic: 'Rina Marlina', status: '1/1', date: '11/04/2026 10:15:00' },
  { id: 5, kode: 'SQ2T', cabang: 'Bekasi', nama: 'BALANPULANG', pic: 'Rudi Hermawan', status: '1/1', date: '12/04/2026 08:20:11' },
  { id: 6, kode: 'SC2F', cabang: 'Tangerang', nama: 'RAYA PESANTREN', pic: 'Doni Tata', status: '0/1', date: '-' },
  { id: 7, kode: 'SS1I', cabang: 'Makassar', nama: 'POB UNDAYAN', pic: 'Hendra Setiawan', status: '1/1', date: '13/04/2026 14:05:22' },
  { id: 8, kode: 'SD3X', cabang: 'Ambon', nama: 'PASAR BARU', pic: 'Lina Jubaedah', status: '0/1', date: '-' },
]

export default function ChecklistDetailView({ checklist, onStoreClick }: { checklist: any, onStoreClick: (store: any, isDone: boolean) => void }) {
  const [search, setSearch] = useState('')
  const [selectedCabang, setSelectedCabang] = useState('')

  const uniqueCabang = Array.from(new Set(dummyStores.map(s => s.cabang)))

  const filteredStores = dummyStores.filter(store => {
    const matchSearch = store.nama.toLowerCase().includes(search.toLowerCase()) || 
                        store.kode.toLowerCase().includes(search.toLowerCase()) ||
                        store.cabang.toLowerCase().includes(search.toLowerCase())
    const matchCabang = selectedCabang === '' || store.cabang === selectedCabang
    return matchSearch && matchCabang
  })

  // Mengambil icon berdasarkan judul checklist (karena icon aslinya SVG/Image)
  const renderIcon = () => {
    const title = checklist?.title?.toLowerCase() || ''
    if (title.includes('fcpt')) return <Settings2 size={16} />
    if (title.includes('pendingin')) return <Snowflake size={16} />
    if (title.includes('genset')) return <Zap size={16} />
    return <FileText size={16} />
  }

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

      {/* Grid of Store Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredStores.map(store => {
          const isDone = store.status === '1/1'

          return (
            <motion.div 
              key={store.id}
              whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              onClick={() => onStoreClick(store, isDone)}
              className={`rounded-2xl border ${isDone ? 'border-blue-200 bg-blue-50/50' : 'border-red-200 bg-red-50/50'} overflow-hidden transition-all duration-300 cursor-pointer flex flex-col shadow-sm`}
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-gray-800 text-lg tracking-tight">{store.kode}</span>
                  <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">{store.cabang}</span>
                </div>
                <h3 className="text-gray-700 font-bold mb-1 truncate">{store.nama}</h3>
                <p className="text-gray-500 text-sm">{store.pic}</p>
              </div>

              {/* Bottom Pill */}
              <div className={`px-5 py-3 border-t ${isDone ? 'bg-blue-100/50 border-blue-200' : 'bg-red-100/50 border-red-200'} flex items-center justify-between`}>
                <div className={`flex items-center gap-2 font-bold text-sm ${isDone ? 'text-blue-700' : 'text-red-700'}`}>
                  {renderIcon()}
                  <span>{checklist?.title?.replace(/\n/g, ' ') || 'Checklist'}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${isDone ? 'text-blue-600' : 'text-red-500'}`}>
                    {store.date !== '-' ? store.date : 'Belum dicek'}
                  </span>
                  <div className={`px-3 py-1 rounded-full text-xs font-black text-white shadow-sm ${isDone ? 'bg-[#0c539a]' : 'bg-[#cc1e2c]'}`}>
                    {store.status}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {filteredStores.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          Tidak ada toko yang cocok dengan pencarian "{search}".
        </div>
      )}
    </motion.div>
  )
}
