'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart as ReBarChart, Bar as ReBar, XAxis as ReXAxis, YAxis as ReYAxis, 
  CartesianGrid as ReCartesianGrid, Tooltip as RechartsTooltipComponent, ResponsiveContainer as ReResponsiveContainer, 
  PieChart as RePieChart, Pie as RePie, Cell as ReCell, Legend as ReLegend 
} from 'recharts'
import { Calendar, Hash, ChevronRight, CheckSquare, LayoutList } from 'lucide-react'
import BMTRekapDetailView from './BMTRekapDetailView'
import {
  CHILLER_EQUIPMENT_CHECKLIST_TOTAL,
  normalizeEquipmentTypeFromSubmission,
} from './chillerChecklistConfig'

type RecapType = 'fcpt' | 'chiller' | 'genset'

type StoreBase = {
  id: string
  kodeToko: string
  namaToko: string
  branch: string
  namaPic: string
}

type StoreData = StoreBase & {
  isDone: boolean
  submittedAt: string | null
  nilaiAkhir: number
  jmlTerceklist: number
  jmlTotal?: number
}

const RECAP_LABELS: Record<RecapType, string> = {
  fcpt: 'Rekap FCPT',
  chiller: 'Rekap Chiller',
  genset: 'Rekap Genset',
}

const FILTER_TYPE_MAP: Record<RecapType, string> = {
  fcpt: 'FCPT',
  chiller: 'Chiller',
  genset: 'Genset',
}

const COLORS = ['#0c539a', '#cc1e2c', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#94a3b8']

interface BMTRekapViewProps {
  nik?: string
  metadata?: any
  onSelectDetail?: (item: any, recapType?: string) => void
  onViewDetail?: (item: any, recapType?: string) => void
  defaultRecapType?: RecapType
}

export default function BMTRekapView({ nik, metadata, onSelectDetail, onViewDetail, defaultRecapType }: BMTRekapViewProps) {
  const [recapType, setRecapType] = useState<RecapType>(defaultRecapType || 'fcpt')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterKodeToko, setFilterKodeToko] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [storeBases, setStoreBases] = useState<StoreBase[]>([])
  const [fcptByKode, setFcptByKode] = useState<Record<string, { submitted_at: string; nilai_akhir: number; jml_terceklist: number }>>({})
  const [chillerByKode, setChillerByKode] = useState<
    Record<string, { types: Set<string>; latestAt: string | null; nilaiSum: number; nilaiCount: number }>
  >({})
  const [gensetByKode, setGensetByKode] = useState<
    Record<string, { submitted_at: string; nilai_akhir: number }>
  >({})
  const [loading, setLoading] = useState(true)

  const rawStoresData = useMemo((): StoreData[] => {
    return storeBases.map((store) => {
      if (recapType === 'chiller') {
        const progress = chillerByKode[store.kodeToko]
        const doneCount = progress?.types.size ?? 0
        const total = CHILLER_EQUIPMENT_CHECKLIST_TOTAL
        const avgNilai =
          progress && progress.nilaiCount > 0
            ? Math.round(progress.nilaiSum / progress.nilaiCount)
            : 0
        return {
          ...store,
          isDone: doneCount >= total,
          submittedAt: progress?.latestAt ?? null,
          nilaiAkhir: avgNilai,
          jmlTerceklist: doneCount,
          jmlTotal: total,
        }
      }

      if (recapType === 'genset') {
        const sub = gensetByKode[store.kodeToko]
        return {
          ...store,
          isDone: !!sub,
          submittedAt: sub?.submitted_at ?? null,
          nilaiAkhir: sub?.nilai_akhir ?? 0,
          jmlTerceklist: sub ? 1 : 0,
        }
      }

      const sub = fcptByKode[store.kodeToko]
      return {
        ...store,
        isDone: !!sub,
        submittedAt: sub?.submitted_at ?? null,
        nilaiAkhir: sub?.nilai_akhir ?? 0,
        jmlTerceklist: sub?.jml_terceklist ?? 0,
      }
    })
  }, [storeBases, fcptByKode, chillerByKode, gensetByKode, recapType])
  useEffect(() => {
    const fetchBMTData = async () => {
      try {
        setLoading(true)
        const { createClient } = await import('@/frontend/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const userNik = nik || user?.user_metadata?.nik || ''
        const userName = metadata?.full_name || user?.user_metadata?.full_name || ''

        let storeQuery = supabase
          .from('stores')
          .select('id, kode, nama, branch, nama_bmt, nik_bmt')

        if (metadata?.role === 'bmt' || !metadata?.role) {
          if (userNik && userName) {
            storeQuery = storeQuery.or(`nik_bmt.eq."${userNik}",nama_bmt.ilike."%${userName}%"`)
          } else if (userNik) {
            storeQuery = storeQuery.eq('nik_bmt', userNik)
          } else if (userName) {
            storeQuery = storeQuery.ilike('nama_bmt', `%${userName}%`)
          }
        } else if (metadata?.role === 'koordinator_cabang' || metadata?.role === 'manager_cabang') {
          if (userNik && userName) {
            storeQuery = storeQuery.or(`nik_coordinator.eq."${userNik}",nama_coordinator.ilike."%${userName}%"`)
          } else if (userNik) {
            storeQuery = storeQuery.eq('nik_coordinator', userNik)
          } else if (userName) {
            storeQuery = storeQuery.ilike('nama_coordinator', `%${userName}%`)
          } else if (metadata?.cabang) {
            storeQuery = storeQuery.eq('branch', metadata.cabang)
          }
        } else if (metadata?.role !== 'ho' && metadata?.cabang) {
          storeQuery = storeQuery.eq('branch', metadata.cabang)
        }

        const { data: storesData, error: storesError } = await storeQuery.order('kode', { ascending: true })

        if (storesError) {
          console.error('Stores Fetch Error Detail:', storesError.message, storesError.details)
          throw storesError
        }

        const storeCodes = (storesData || []).map(s => s.kode).filter(Boolean)
        const bases: StoreBase[] = (storesData || []).map((store) => ({
          id: store.id,
          kodeToko: store.kode,
          namaToko: store.nama,
          branch: store.branch || 'Unknown',
          namaPic: store.nama_bmt || userName || 'BMT Staff',
        }))

        if (storeCodes.length === 0) {
          setStoreBases([])
          setFcptByKode({})
          setChillerByKode({})
          setGensetByKode({})
          setLoading(false)
          return
        }

        setStoreBases(bases)

        const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString()
        const endDate = new Date(selectedYear, selectedMonth, 1).toISOString()

        const [fcptRes, chillerRes, gensetRes] = await Promise.all([
          supabase
            .from('view_rekap_fcpt')
            .select('store_kode, submitted_at, nilai_akhir, jml_terceklist')
            .in('store_kode', storeCodes)
            .gte('submitted_at', startDate)
            .lt('submitted_at', endDate),
          supabase
            .from('chiller_submissions')
            .select('store_kode, jenis_mesin, submitted_at, created_at, nilai_akhir')
            .in('store_kode', storeCodes)
            .gte('created_at', startDate)
            .lt('created_at', endDate),
          supabase
            .from('genset_submissions')
            .select('store_kode, submitted_at, created_at, nilai_akhir')
            .in('store_kode', storeCodes)
            .gte('created_at', startDate)
            .lt('created_at', endDate),
        ])

        if (fcptRes.error) {
          console.error('FCPT Fetch Error:', fcptRes.error.message, fcptRes.error.details)
          throw fcptRes.error
        }

        const fcptMap: typeof fcptByKode = {}
        fcptRes.data?.forEach((sub: any) => {
          fcptMap[sub.store_kode] = sub
        })
        setFcptByKode(fcptMap)

        if (chillerRes.error) {
          console.error('Chiller Fetch Error:', chillerRes.error.message, chillerRes.error.details)
        } else {
          const chillerMap: typeof chillerByKode = {}
          chillerRes.data?.forEach((sub: any) => {
            const kode = sub.store_kode
            if (!kode) return
            if (!chillerMap[kode]) {
              chillerMap[kode] = { types: new Set(), latestAt: null, nilaiSum: 0, nilaiCount: 0 }
            }
            const bucket = chillerMap[kode]
            const equipmentType = normalizeEquipmentTypeFromSubmission(sub.jenis_mesin)
            if (equipmentType) bucket.types.add(equipmentType)
            const ts = sub.submitted_at || sub.created_at
            if (ts && (!bucket.latestAt || ts > bucket.latestAt)) {
              bucket.latestAt = ts
            }
            if (typeof sub.nilai_akhir === 'number') {
              bucket.nilaiSum += sub.nilai_akhir
              bucket.nilaiCount += 1
            }
          })
          setChillerByKode(chillerMap)
        }

        if (gensetRes.error) {
          console.error('Genset Fetch Error:', gensetRes.error.message, gensetRes.error.details)
        } else {
          const gMap: typeof gensetByKode = {}
          gensetRes.data?.forEach((sub: any) => {
            const kode = sub.store_kode
            if (!kode) return
            const ts = sub.submitted_at || sub.created_at
            if (!gMap[kode] || (ts && ts > gMap[kode].submitted_at)) {
              gMap[kode] = { submitted_at: ts, nilai_akhir: sub.nilai_akhir ?? 0 }
            }
          })
          setGensetByKode(gMap)
        }
      } catch (error: any) {
        console.error('Error fetching BMT rekap data:', error?.message || error?.details || error)
      } finally {
        setLoading(false)
      }
    }

    fetchBMTData()
  }, [nik, metadata, selectedMonth, selectedYear])
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
  const kpiTerceklist = filteredData.filter(d => d.isDone).length
  const totalTokoPegangan = filteredData.length
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
  const pieChartData = useMemo(() => {
    if (totalTokoPegangan === 0) return []
    
    const percentageDone = Number(((kpiTerceklist / totalTokoPegangan) * 100).toFixed(1))
    const percentagePending = Number((((totalTokoPegangan - kpiTerceklist) / totalTokoPegangan) * 100).toFixed(1))
    
    return [
      { name: 'Sudah Dicek', value: percentageDone, fill: '#0c539a' },
      { name: 'Belum Dicek', value: percentagePending, fill: '#cc1e2c' }
    ].filter(item => item.value > 0)
  }, [kpiTerceklist, totalTokoPegangan])
  const handleSelectDetail = (item: StoreData) => {
    const currentFilterType = FILTER_TYPE_MAP[recapType] || 'FCPT'
    const itemWithRecap = {
      ...item,
      recapType,
      filterType: currentFilterType,
    }

    if (onViewDetail) {
      onViewDetail(itemWithRecap, recapType)
    } else if (onSelectDetail) {
      onSelectDetail(itemWithRecap, recapType)
    } else {
      setSelectedItem(itemWithRecap)
    }
  }

  if (selectedItem && !onSelectDetail && !onViewDetail) {
    return (
      <BMTRekapDetailView 
        data={selectedItem} 
        filterType={selectedItem.filterType || FILTER_TYPE_MAP[recapType] || 'FCPT'} 
        onBack={() => setSelectedItem(null)} 
      />
    )
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
            <h2 className="text-xl font-bold text-gray-800 flex flex-wrap items-center gap-2">
              <span>Rekapitulasi</span>
              <span className="relative inline-flex items-center">
                <LayoutList className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0c539a] pointer-events-none" size={16} />
                <select
                  value={recapType}
                  onChange={(e) => setRecapType(e.target.value as RecapType)}
                  className="appearance-none pl-9 pr-8 py-1.5 rounded-lg border-2 border-[#0c539a]/30 bg-blue-50/80 text-[#0c539a] text-base font-bold cursor-pointer focus:ring-2 focus:ring-[#0c539a] outline-none hover:bg-blue-50 transition-colors"
                  aria-label="Jenis rekapitulasi"
                >
                  <option value="fcpt">{RECAP_LABELS.fcpt}</option>
                  <option value="chiller">{RECAP_LABELS.chiller}</option>
                  <option value="genset">{RECAP_LABELS.genset}</option>
                </select>
              </span>
              <span>Area BMT</span>
            </h2>
            <div className="flex items-center gap-2 mt-3">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0c539a]"
              >
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0c539a]"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Menampilkan {totalTokoPegangan} toko yang ditugaskan kepada Anda.
              {recapType === 'chiller' && (
                <span className="block text-[11px] text-gray-400 mt-0.5">
                  Toko dianggap selesai jika seluruh {CHILLER_EQUIPMENT_CHECKLIST_TOTAL} jenis perangkat pendingin sudah diceklist.
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

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

          <div className="lg:col-span-1 flex flex-col justify-center">
            <div className="bg-gradient-to-br from-[#0c539a] to-blue-800 rounded-2xl p-6 text-white shadow-md text-center h-full flex flex-col justify-center transform transition hover:scale-105">
              <p className="text-blue-200 font-semibold mb-1 text-sm">Sudah Terceklist</p>
              <h3 className="text-5xl font-black tracking-tight">{kpiTerceklist} <span className="text-2xl font-normal text-blue-200">/ {totalTokoPegangan}</span></h3>
              <p className="text-[11px] text-blue-100 mt-2 font-medium">Toko Dalam Pengawasan Anda</p>
            </div>
          </div>

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
                        <ReCell key={`cell-${index}`} fill={entry.fill} />
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
                    <td className={`px-6 py-4 text-center font-bold ${
                      row.jmlTerceklist > 0
                        ? row.nilaiAkhir >= 90
                          ? 'text-emerald-600'
                          : 'text-red-600'
                        : 'text-gray-400'
                    }`}>
                      {row.jmlTerceklist > 0 ? row.nilaiAkhir : '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-800">
                      {recapType === 'chiller' && row.jmlTotal != null
                        ? `${row.jmlTerceklist} / ${row.jmlTotal}`
                        : row.isDone
                          ? row.jmlTerceklist
                          : '0'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleSelectDetail(row)} 
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0c539a] hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                      >
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