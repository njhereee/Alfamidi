'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Calendar, Building, User, Hash, ChevronRight } from 'lucide-react'
import RekapDetailView from './RekapDetailView'

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

export default function RekapView({ onSelectDetail }: { onSelectDetail?: (item: any) => void }) {
  // Filter States
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterPic, setFilterPic] = useState('')
  const [filterKodeToko, setFilterKodeToko] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Data States
  const [rawStoresData, setRawStoresData] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Data dari Supabase
 useEffect(() => {
  const fetchRekapData = async () => {
    try {
      setLoading(true)
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      // 1. Ambil semua stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, kode, nama, branch, nama_bmt')
        .order('branch', { ascending: true })

      if (storesError) throw storesError

      // 2. Ambil data submission dari VIEW yang baru dibuat
      const { data: submissionsData, error: subError } = await supabase
        .from('view_rekap_fcpt') // <-- Memanggil View, bukan tabel fcpt_submissions
        .select('store_kode, submitted_at, nilai_akhir, jml_terceklist')

      if (subError) throw subError

      // Mapping submission berdasarkan store_kode
      const subMap: Record<string, any> = {}
      if (submissionsData) {
        submissionsData.forEach((sub: any) => {
          subMap[sub.store_kode] = sub
        })
      }

      // 3. Gabungkan Data Store dengan Data Submission
      const merged: StoreData[] = (storesData || []).map(store => {
        const sub = subMap[store.kode]
        return {
          id: store.id,
          kodeToko: store.kode,
          namaToko: store.nama,
          branch: store.branch || 'Unknown',
          namaPic: store.nama_bmt || 'Tanpa PIC',
          isDone: !!sub,
          submittedAt: sub?.submitted_at || null,
          // Sekarang mengambil nilai langsung dari View yang sudah dihitung database
          nilaiAkhir: sub?.nilai_akhir ?? 0, 
          jmlTerceklist: sub?.jml_terceklist ?? 0 
        }
      })

      setRawStoresData(merged)
    } catch (error) {
      console.error('Error fetching rekap data:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchRekapData()
}, [])

  // Mengelola Data sesuai Filter
  const filteredData = useMemo(() => {
    return rawStoresData.filter(item => {
      const matchBranch = filterBranch === '' || item.branch === filterBranch
      const matchPic = filterPic === '' || item.namaPic === filterPic
      const matchKode = filterKodeToko === '' || item.kodeToko.toLowerCase().includes(filterKodeToko.toLowerCase())
      // Format Tanggal HTML Date input = YYYY-MM-DD. 
      const matchDate = filterTanggal === '' || (item.submittedAt && item.submittedAt.startsWith(filterTanggal))
      
      return matchBranch && matchPic && matchKode && matchDate
    })
  }, [rawStoresData, filterBranch, filterPic, filterKodeToko, filterTanggal])

  // Menyiapkan Data KPI
  const kpiTerceklist = filteredData.filter(d => d.isDone).length

  // Menyiapkan Data untuk Bar Chart (Sudah vs Belum Terceklist per Cabang)
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

  // Menyiapkan Data untuk Pie Chart (Distribusi Cabang yang sudah diceklist)
  const pieChartData = useMemo(() => {
    const doneStores = filteredData.filter(d => d.isDone)
    const totalDone = doneStores.length || 1 // Hindari division by zero
    const pieMap: Record<string, number> = {}

    doneStores.forEach(d => {
      pieMap[d.branch] = (pieMap[d.branch] || 0) + 1
    })

    let pieArray = Object.keys(pieMap).map(branch => ({
      name: branch,
      value: Number(((pieMap[branch] / totalDone) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value)

    // Ambil Top 5, sisanya masuk ke "Lainnya" agar chart tidak terlalu penuh
    if (pieArray.length > 6) {
      const top5 = pieArray.slice(0, 5)
      const lainnyaValue = pieArray.slice(5).reduce((acc, curr) => acc + curr.value, 0)
      pieArray = [...top5, { name: 'Lainnya', value: Number(lainnyaValue.toFixed(1)) }]
    }

    return pieArray
  }, [filteredData])

  // Opsi Dropdown Unik
  const uniqueBranches = Array.from(new Set(rawStoresData.map(d => d.branch))).sort()
  const uniquePics = Array.from(new Set(rawStoresData.map(d => d.namaPic))).sort()

  const handleSelectDetail = (item: any) => {
    if (onSelectDetail) {
      onSelectDetail(item)
    } else {
      setSelectedItem(item)
    }
  }

  if (selectedItem && !onSelectDetail) {
    return <RekapDetailView data={selectedItem} onBack={() => setSelectedItem(null)} />
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
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Monitoring Ceklist Bangunan (FCPT ONLINE)</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Kolom Kiri: Filter */}
          <div className="lg:col-span-1 space-y-4">
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
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Branch</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                >
                  <option value="">Semua Branch</option>
                  {uniqueBranches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama PIC</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  value={filterPic}
                  onChange={(e) => setFilterPic(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                >
                  <option value="">Semua PIC</option>
                  {uniquePics.map(pic => (
                    <option key={pic} value={pic}>{pic}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kode Toko</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  value={filterKodeToko}
                  onChange={(e) => setFilterKodeToko(e.target.value)}
                  placeholder="Masukkan Kode Toko"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Kolom Tengah: KPI */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div className="bg-gradient-to-br from-[#0c539a] to-blue-800 rounded-2xl p-6 text-white shadow-md text-center h-full flex flex-col justify-center transform transition hover:scale-105">
              <p className="text-blue-200 font-semibold mb-2">Jml Terceklist</p>
              <h3 className="text-5xl font-black tracking-tight">{kpiTerceklist.toLocaleString('id-ID')}</h3>
            </div>
          </div>

          {/* Kolom Kanan: Donut Chart */}
          <div className="lg:col-span-2 flex justify-center items-center bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <div className="w-full h-[300px]">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 font-medium">
                  Belum ada data terceklist
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
          <table className="w-full text-sm text-left relative">
            <thead className="bg-[#cc1e2c] text-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-bold">NO</th>
                <th className="px-6 py-4 font-bold">KODE TOKO</th>
                <th className="px-6 py-4 font-bold">NAMA TOKO</th>
                <th className="px-6 py-4 font-bold">NAMA PIC</th>
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
                    <td className={`px-6 py-4 text-center font-bold ${row.nilaiAkhir >= 90 ? 'text-emerald-600' : 'text-red-600'}`}>
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
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          Jumlah Toko Terchecklist vs Belum Terchecklist
        </h3>
        <div className="w-full h-[300px]">
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="terceklist" name="Sudah Terceklist" fill="#0c539a" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="belumTerceklist" name="Belum Terceklist" fill="#cc1e2c" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400 font-medium">
              Data Grafik Kosong
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}