'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart as ReBarChart, Bar as ReBar, XAxis as ReXAxis, YAxis as ReYAxis, 
  CartesianGrid as ReCartesianGrid, Tooltip as RechartsTooltipComponent, ResponsiveContainer as ReResponsiveContainer, 
  PieChart as RePieChart, Pie as RePie, Cell as ReCell, Legend as ReLegend 
} from 'recharts'
import { Calendar, Hash, ChevronRight, CheckSquare } from 'lucide-react'
import BMTRekapDetailView from './BMTRekapDetailView'

type StoreData = {
  id: string
  kodeToko: string
  namaToko: string
  branch: string
  namaPic: string
  isDone: boolean
  submittedAt: string | null
  nilaiAkhir: number
  jmlTerceklist: number
}

const COLORS = ['#0c539a', '#cc1e2c', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#94a3b8']

interface BMTRekapViewProps {
  nik?: string
  metadata?: any
  onSelectDetail?: (item: any) => void
}

export default function BMTRekapView({ nik, metadata, onSelectDetail }: BMTRekapViewProps) {
  // Filter States
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterKodeToko, setFilterKodeToko] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'done' | 'pending'
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Data States
  const [rawStoresData, setRawStoresData] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Data khusus Toko milik BMT
  useEffect(() => {
    const fetchBMTData = async () => {
      try {
        setLoading(true)
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()

        // 1. Identifikasi User BMT
        const { data: { user } } = await supabase.auth.getUser()
        const userNik = nik || user?.user_metadata?.nik || ''
        const userName = metadata?.full_name || user?.user_metadata?.full_name || ''

        // 2. Query stores
        let storeQuery = supabase
          .from('stores')
          .select('id, kode, nama, branch, nama_bmt, nik_bmt')

        if (userNik && userName) {
          storeQuery = storeQuery.or(`nik_bmt.eq."${userNik}",nama_bmt.ilike."%${userName}%"`)
        } else if (userNik) {
          storeQuery = storeQuery.eq('nik_bmt', userNik)
        } else if (userName) {
          storeQuery = storeQuery.ilike('nama_bmt', `%${userName}%`)
        }

        const { data: storesData, error: storesError } = await storeQuery.order('kode', { ascending: true })

        if (storesError) {
          console.error('Stores Fetch Error Detail:', storesError.message, storesError.details)
          throw storesError
        }

        const storeCodes = (storesData || []).map(s => s.kode).filter(Boolean)

        // Jika BMT belum memiliki toko yang ditugaskan
        if (storeCodes.length === 0) {
          setRawStoresData([])
          setLoading(false)
          return
        }

        // 3. Ambil data submission HANYA untuk toko-toko milik BMT tersebut
        const { data: submissionsData, error: subError } = await supabase
          .from('view_rekap_fcpt')
          .select('store_kode, submitted_at, nilai_akhir, jml_terceklist')
          .in('store_kode', storeCodes)

        if (subError) {
          console.error('Submissions Fetch Error Detail:', subError.message, subError.details)
          throw subError
        }

        // Mapping submission berdasarkan store_kode
        const subMap: Record<string, any> = {}
        if (submissionsData) {
          submissionsData.forEach((sub: any) => {
            subMap[sub.store_kode] = sub
          })
        }

        // 4. Gabungkan Data
        const merged: StoreData[] = (storesData || []).map(store => {
          const sub = subMap[store.kode]
          return {
            id: store.id,
            kodeToko: store.kode,
            namaToko: store.nama,
            branch: store.branch || 'Unknown',
            namaPic: store.nama_bmt || userName || 'BMT Staff',
            isDone: !!sub,
            submittedAt: sub?.submitted_at || null,
            nilaiAkhir: sub?.nilai_akhir ?? 0,
            jmlTerceklist: sub?.jml_terceklist ?? 0
          }
        })

        setRawStoresData(merged)
      } catch (error: any) {
        console.error('Error fetching BMT rekap data:', error?.message || error?.details || error)
      } finally {
        setLoading(false)
      }
    }

    fetchBMTData()
  }, [nik, metadata])

  // Filter Lokal berdasarkan Tanggal, Kode Toko, dan Status Inspection
  const filteredData = useMemo(() => {
    return rawStoresData.filter(item => {
      const matchKode = filterKodeToko === '' || item.kodeToko.toLowerCase().includes(filterKodeToko.toLowerCase())
      const matchDate = filterTanggal === '' || (item.submittedAt && item.submittedAt.startsWith(filterTanggal))
      
      let matchStatus = true
      if (filterStatus === 'done') {
        matchStatus = item.isDone
      } else if (filterStatus === 'pending') {
        matchStatus = !item.isDone
      }

      return matchKode && matchDate && matchStatus
    })
  }, [rawStoresData, filterKodeToko, filterTanggal, filterStatus])

  // KPI
  const kpiTerceklist = filteredData.filter(d => d.isDone).length
  const totalTokoPegangan = filteredData.length

  // Bar Chart Data
  const barChartData = useMemo(() => {
    const stats: Record<string, { name: string, terceklist: number, belumTerceklist: number }> = {}
    
    filteredData.forEach(d => {
      if (!stats[d.branch]) {
        stats[d.branch] = { name: d.branch, terceklist: 0, belumTerceklist: 0 }
      }
      if (d.isDone) stats[d.branch].terceklist += 1
      else stats[d.branch].belumTerceklist += 1
    })

    return Object.values(stats)
  }, [filteredData])

  // Pie Chart Data
  const pieChartData = useMemo(() => {
    const doneStores = filteredData.filter(d => d.isDone)
    const totalDone = doneStores.length || 1
    const pieMap: Record<string, number> = {}

    doneStores.forEach(d => {
      pieMap[d.branch] = (pieMap[d.branch] || 0) + 1
    })

    return Object.keys(pieMap).map(branch => ({
      name: branch,
      value: Number(((pieMap[branch] / totalDone) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value)
  }, [filteredData])

  const handleSelectDetail = (item: any) => {
    if (onSelectDetail) {
      onSelectDetail(item)
    } else {
      setSelectedItem(item)
    }
  }

  if (selectedItem && !onSelectDetail) {
    return <BMTRekapDetailView data={selectedItem} onBack={() => setSelectedItem(null)} />
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="animate-spin w-8 h-8 border-4 border-[#0c539a] border-t-transparent rounded-full" />
      <p className="text-xs text-gray-500 font-bold">Memuat data toko BMT...</p>
    </div>
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto font-sans"
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Rekapitulasi FCPT Area BMT</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Menampilkan {totalTokoPegangan} toko yang ditugaskan kepada Anda.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* FILTER BAR BARU */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* 1. Filter Tanggal */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rentang Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="date" 
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none" 
                />
              </div>
            </div>
            
            {/* 2. Filter Status Checklist (Ganti Filter Branch) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status Inspection</label>
              <div className="relative">
                <CheckSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none appearance-none font-medium cursor-pointer"
                >
                  <option value="all">Semua Toko (Sudah & Belum)</option>
                  <option value="done">Sudah Terceklist</option>
                  <option value="pending">Belum Terceklist</option>
                </select>
              </div>
            </div>

            {/* 3. Filter Kode Toko */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cari Kode Toko</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  value={filterKodeToko}
                  onChange={(e) => setFilterKodeToko(e.target.value)}
                  placeholder="Contoh: NC42 / SC1M"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* KPI Card */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div className="bg-gradient-to-br from-[#0c539a] to-blue-800 rounded-2xl p-6 text-white shadow-md text-center h-full flex flex-col justify-center transform transition hover:scale-105">
              <p className="text-blue-200 font-semibold mb-1 text-sm">Sudah Terceklist</p>
              <h3 className="text-5xl font-black tracking-tight">{kpiTerceklist} <span className="text-2xl font-normal text-blue-200">/ {totalTokoPegangan}</span></h3>
              <p className="text-[11px] text-blue-100 mt-2 font-medium">Toko Dalam Pengawasan Anda</p>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="lg:col-span-2 flex justify-center items-center bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <div className="w-full h-[300px]">
              {pieChartData.length > 0 ? (
                <ReResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <RePie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <ReCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </RePie>
                    <RechartsTooltipComponent formatter={(value) => `${value}%`} />
                    <ReLegend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                  </RePieChart>
                </ReResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 font-medium text-xs">
                  Belum ada laporan checklist selesai
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Tabel Toko Pegangan BMT */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-sm">Daftar Toko BMT ({filteredData.length})</h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
          <table className="w-full text-sm text-left relative">
            <thead className="bg-[#cc1e2c] text-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-bold">NO</th>
                <th className="px-6 py-4 font-bold">KODE TOKO</th>
                <th className="px-6 py-4 font-bold">NAMA TOKO</th>
                <th className="px-6 py-4 font-bold">PIC BMT</th>
                <th className="px-6 py-4 font-bold text-center">NILAI AKHIR</th>
                <th className="px-6 py-4 font-bold text-center">JML TERCEKLIST</th>
                <th className="px-6 py-4 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, i) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-medium">{i + 1}.</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{row.kodeToko}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{row.namaToko}</td>
                    <td className="px-6 py-4 text-gray-600">{row.namaPic}</td>
                    <td className={`px-6 py-4 text-center font-bold ${row.isDone ? (row.nilaiAkhir >= 90 ? 'text-emerald-600' : 'text-red-600') : 'text-gray-400'}`}>
                      {row.isDone ? row.nilaiAkhir : '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-800">
                      {row.isDone ? row.jmlTerceklist : '0'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleSelectDetail(row)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0c539a] hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
                        Detail <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500 font-medium">
                    Tidak ada toko pegangan BMT yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart Status Per Cabang */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6 text-sm">
          Status Inspeksi Toko Pegangan
        </h3>
        <div className="w-full h-[280px]">
          {barChartData.length > 0 ? (
            <ReResponsiveContainer width="100%" height="100%">
              <ReBarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <ReCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <ReXAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <ReYAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <RechartsTooltipComponent cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <ReLegend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <ReBar dataKey="terceklist" name="Sudah Terceklist" fill="#0c539a" radius={[4, 4, 0, 0]} barSize={24} />
                <ReBar dataKey="belumTerceklist" name="Belum Terceklist" fill="#cc1e2c" radius={[4, 4, 0, 0]} barSize={24} />
              </ReBarChart>
            </ReResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400 font-medium text-xs">
              Data Grafik Kosong
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}