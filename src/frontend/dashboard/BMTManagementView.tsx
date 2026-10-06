'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, UserCircle, Edit, Trash2, Check, Loader2, Users, X } from 'lucide-react'

type Store = {
  id: string
  kode: string
  nama: string
  branch: string
  nama_bmt: string | null
  nik_bmt: string | null
}

type Profile = {
  id: string
  nik: string
  full_name: string
  role: string
  status: string
}

export default function BMTManagementView({ userBranch, userRole, userNik, userName }: { userBranch?: string, userRole?: string, userNik?: string, userName?: string }) {
  const [stores, setStores] = useState<Store[]>([])
  const [bmts, setBmts] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedBmtNik, setSelectedBmtNik] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { createClient } = await import('@/frontend/supabase/client')
      const supabase = createClient()
      
      let storesQuery = supabase.from('stores').select('id, kode, nama, branch, nama_bmt, nik_bmt').order('branch', { ascending: true })
      
      // Jika koordinator cabang, filter by nik_coordinator atau nama_coordinator
      // HO bisa melihat semua
      if (userRole === 'koordinator_cabang' || userRole === 'manager_cabang') {
        if (userNik && userName) {
          storesQuery = storesQuery.or(`nik_coordinator.eq."${userNik}",nama_coordinator.ilike."%${userName}%"`)
        } else if (userNik) {
          storesQuery = storesQuery.eq('nik_coordinator', userNik)
        } else if (userName) {
          storesQuery = storesQuery.ilike('nama_coordinator', `%${userName}%`)
        } else if (userBranch) {
          // Fallback ke branch jika NIK/Nama tidak tersedia
          storesQuery = storesQuery.ilike('branch', `%${userBranch}%`)
        }
      }

      const { data: storesData, error: storesError } = await storesQuery
      if (storesError) throw storesError
      
      const { data: bmtData, error: bmtError } = await supabase
        .from('profiles')
        .select('id, nik, full_name, role, status')
        .eq('role', 'bmt')
        .neq('status', 'pending')
        
      if (bmtError) throw bmtError

      setStores(storesData || [])
      setBmts(bmtData || [])
    } catch (error) {
      console.error('Error fetching data for BMT Management:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (store: Store) => {
    setSelectedStore(store)
    setSelectedBmtNik(store.nik_bmt || '')
    setIsModalOpen(true)
  }

  const handleSaveAssigment = async () => {
    if (!selectedStore) return
    setIsSaving(true)
    
    try {
      const { createClient } = await import('@/frontend/supabase/client')
      const supabase = createClient()
      
      const bmt = bmts.find(b => b.nik === selectedBmtNik)
      
      const payload = {
        nik_bmt: bmt ? bmt.nik : null,
        nama_bmt: bmt ? bmt.full_name : null,
      }

      const { error } = await supabase
        .from('stores')
        .update(payload)
        .eq('id', selectedStore.id)

      if (error) throw error
      
      // Update local state
      setStores(stores.map(s => s.id === selectedStore.id ? { ...s, ...payload } : s))
      setIsModalOpen(false)
      
    } catch (error: any) {
      console.error(error)
      alert(`Gagal menyimpan: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredStores = stores.filter(s => 
    s.kode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.nama_bmt && s.nama_bmt.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-[#0c539a]" /> Manajemen BMT
          </h2>
          <p className="text-sm text-gray-500 mt-1">Kelola penugasan BMT (Building Maintenance Technician) untuk setiap toko.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari toko, kode, atau BMT..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800 transition-all"
          />
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0c539a]">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Toko</p>
              <h3 className="text-2xl font-black text-gray-800">{stores.length}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total BMT Aktif</p>
              <h3 className="text-2xl font-black text-gray-800">{new Set(stores.map(s => s.nik_bmt).filter(Boolean)).size}</h3>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={36} className="animate-spin mb-4 text-[#cc1e2c]" />
          <p className="font-medium">Memuat data toko dan BMT...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold tracking-wide">
                  <th className="px-6 py-4">Kode</th>
                  <th className="px-6 py-4">Nama Toko</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">BMT Bertugas</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                      Tidak ada toko yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-700">{store.kode}</td>
                    <td className="px-6 py-4 font-medium text-gray-800 truncate max-w-[200px]">{store.nama}</td>
                    <td className="px-6 py-4 text-gray-500">{store.branch}</td>
                    <td className="px-6 py-4">
                      {store.nama_bmt ? (
                        <div className="flex items-center gap-2 text-[#0c539a] font-bold">
                          <UserCircle size={18} /> {store.nama_bmt}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs font-medium bg-gray-100 px-3 py-1 rounded-full">Belum Ada BMT</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenModal(store)}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-all text-xs active:scale-95 border border-blue-100 hover:border-blue-600"
                      >
                        <Edit size={14} /> Atur BMT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Atur BMT */}
      <AnimatePresence>
        {isModalOpen && selectedStore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-[#0c539a] px-6 py-4 flex items-center justify-between text-white">
                <h3 className="font-bold text-lg">Atur BMT Toko</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-blue-100 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-blue-700">Kode</span>
                    <span className="font-bold text-blue-900">{selectedStore.kode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Toko</span>
                    <span className="font-bold text-blue-900 truncate max-w-[200px] text-right">{selectedStore.nama}</span>
                  </div>
                </div>

                <label className="block text-sm font-bold text-gray-700 mb-2">Pilih BMT Bertugas</label>
                <select
                  value={selectedBmtNik}
                  onChange={(e) => setSelectedBmtNik(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0c539a] shadow-sm mb-6 font-medium cursor-pointer"
                >
                  <option value="">-- Kosongkan BMT (Tidak Ada) --</option>
                  {bmts.map((bmt) => (
                    <option key={bmt.id} value={bmt.nik}>
                      {bmt.full_name} (NIK: {bmt.nik})
                    </option>
                  ))}
                </select>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveAssigment}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-[#0c539a] hover:bg-blue-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
