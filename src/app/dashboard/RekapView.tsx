'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Calendar, Building, User, Hash, ChevronRight } from 'lucide-react'

// Dummy Data untuk Table
const dummyTableData = [
  { id: 1, kodeToko: 'SG1Z', namaToko: 'PIERRE TENDEAN BJM', namaPic: 'Budi Santoso', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 2, kodeToko: 'AK1N', namaToko: 'KAPITU MEDAN', namaPic: 'Andi Saputra', nilaiAkhir: 85, jmlTerceklist: 10 },
  { id: 3, kodeToko: 'SK16', namaToko: 'SEA MANADO', namaPic: 'Siti Aminah', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 4, kodeToko: 'SQ2T', namaToko: 'BALANPULANG', namaPic: 'Rudi Hermawan', nilaiAkhir: 92, jmlTerceklist: 10 },
  { id: 5, kodeToko: 'AK34', namaToko: 'TUMPAAN', namaPic: 'Budi Santoso', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 6, kodeToko: 'SC2F', namaToko: 'RAYA PESANTREN', namaPic: 'Andi Saputra', nilaiAkhir: 78, jmlTerceklist: 10 },
  { id: 7, kodeToko: 'SS1I', namaToko: 'POB UNDAYAN', namaPic: 'Siti Aminah', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 8, kodeToko: 'SG2F', namaToko: 'PERUM 1000 MARTA', namaPic: 'Rudi Hermawan', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 9, kodeToko: 'SK2C', namaToko: 'BUYUNGON', namaPic: 'Budi Santoso', nilaiAkhir: 95, jmlTerceklist: 10 },
  { id: 10, kodeToko: 'SQ2C', namaToko: 'RAYA SINGKIL', namaPic: 'Andi Saputra', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 11, kodeToko: 'SC2C', namaToko: 'TELUK MANDAR', namaPic: 'Siti Aminah', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 12, kodeToko: 'DC25', namaToko: 'HULUBANTENG', namaPic: 'Budi Santoso', nilaiAkhir: 60, jmlTerceklist: 10 },
  { id: 13, kodeToko: 'SK1E', namaToko: 'PAHALETEN', namaPic: 'Rudi Hermawan', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 14, kodeToko: 'SO2H', namaToko: 'MERDEKA', namaPic: 'Andi Saputra', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 15, kodeToko: 'SD1A', namaToko: 'PONDOK GEDE', namaPic: 'Siti Aminah', nilaiAkhir: 88, jmlTerceklist: 10 },
  { id: 16, kodeToko: 'SA2B', namaToko: 'JATIWARINGIN', namaPic: 'Rudi Hermawan', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 17, kodeToko: 'SB3C', namaToko: 'CIBUBUR', namaPic: 'Budi Santoso', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 18, kodeToko: 'SC4D', namaToko: 'BOGOR RAYA', namaPic: 'Andi Saputra', nilaiAkhir: 75, jmlTerceklist: 10 },
  { id: 19, kodeToko: 'SD5E', namaToko: 'DEPOK LAMA', namaPic: 'Siti Aminah', nilaiAkhir: 100, jmlTerceklist: 10 },
  { id: 20, kodeToko: 'SE6F', namaToko: 'CIPUTAT', namaPic: 'Rudi Hermawan', nilaiAkhir: 99, jmlTerceklist: 10 },
]

// Dummy Data untuk Bar Chart
const dummyBarData = [
  { name: 'AMBON', terceklist: 63, belumTerceklist: 45 },
  { name: 'KENDARI', terceklist: 64, belumTerceklist: 58 },
  { name: 'SAMARINDA', terceklist: 81, belumTerceklist: 119 },
  { name: 'BOYOLALI', terceklist: 86, belumTerceklist: 81 },
  { name: 'MANADO', terceklist: 114, belumTerceklist: 75 },
  { name: 'PALU', terceklist: 145, belumTerceklist: 82 },
  { name: 'MEDAN', terceklist: 147, belumTerceklist: 104 },
  { name: 'PASURUAN', terceklist: 158, belumTerceklist: 77 },
  { name: 'MAKASAR', terceklist: 187, belumTerceklist: 90 },
  { name: 'BEKASI', terceklist: 241, belumTerceklist: 166 },
  { name: 'BITUNG', terceklist: 251, belumTerceklist: 156 },
]

// Dummy Data untuk Pie Chart
const dummyPieData = [
  { name: 'BITUNG', value: 16.3 },
  { name: 'BEKASI', value: 15.5 },
  { name: 'MAKASAR', value: 10.7 },
  { name: 'MEDAN', value: 9.8 },
  { name: 'PASURUAN', value: 9.0 },
  { name: 'PALU 2', value: 8.7 },
  { name: 'Lainnya', value: 30.0 },
]

const COLORS = ['#0c539a', '#cc1e2c', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#94a3b8']

import RekapDetailView from './RekapDetailView'

export default function RekapView({ onSelectDetail }: { onSelectDetail?: (item: any) => void }) {
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterPic, setFilterPic] = useState('')
  const [filterKodeToko, setFilterKodeToko] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Use local state if no prop is provided, otherwise use prop (for HODashboard integration)
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
                <input type="date" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Branch</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none appearance-none">
                  <option value="">Semua Branch</option>
                  <option value="AMBON">AMBON</option>
                  <option value="BEKASI">BEKASI</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama PIC</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none appearance-none">
                  <option value="">Semua PIC</option>
                  <option value="pic1">PIC 1</option>
                  <option value="pic2">PIC 2</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kode Toko</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
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
              <h3 className="text-5xl font-black tracking-tight">2.665</h3>
            </div>
          </div>

          {/* Kolom Kanan: Donut Chart */}
          <div className="lg:col-span-2 flex justify-center items-center bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dummyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`}
                  >
                    {dummyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `${value}%`} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
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
              {dummyTableData.map((row, i) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                  <td className="px-6 py-4 text-gray-500 font-medium">{i + 1}.</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{row.kodeToko}</td>
                  <td className="px-6 py-4 text-gray-600">{row.namaToko}</td>
                  <td className="px-6 py-4 text-gray-600">{row.namaPic}</td>
                  <td className={`px-6 py-4 text-center font-bold ${row.nilaiAkhir === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {row.nilaiAkhir}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-800">{row.jmlTerceklist}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleSelectDetail(row)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0c539a] hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
                      Detail <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dummyBarData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
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
        </div>
      </div>

    </motion.div>
  )
}
