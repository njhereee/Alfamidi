import React, { useState, useEffect } from 'react'
import { MapPin, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DPMHistoryView({ storesData }: { storesData?: any[] }) {
  const [history, setHistory] = useState<any[]>([])
  const [localStores, setLocalStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  const activeStores = storesData || localStores

  const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { createClient } = await import('@/frontend/supabase/client')
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('dpm_submissions')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error("Error fetching DPM history:", error)
          setHistory([])
        } else {
          setHistory(data || [])
        }

        if (!storesData) {
          const { data: stores } = await supabase.from('stores').select('kode, nama, branch')
          if (stores) {
            setLocalStores(stores)
          }
        }
      } catch (e) {
        console.error("Exception fetching DPM history:", e)
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [storesData])

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Memuat Riwayat DPM...</div>
  }

  if (history.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium border border-gray-100 rounded-xl bg-white mt-4 shadow-sm">
        Belum ada data
      </div>
    )
  }

  // Filter by selected month/year
  const filteredHistory = history.filter(row => {
    const dateStr = row.tanggal_kunjungan || row.created_at
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear
  })

  const exportToPDF = () => {
    const doc = new jsPDF('landscape')
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN RIWAYAT DPM', 14, 20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28)

    const tableBody = filteredHistory.map((row) => {
      const storeInfo = activeStores?.find(s => s.kode === row.store_kode || s.kodeToko === row.store_kode)
      const namaToko = storeInfo?.nama || storeInfo?.namaToko || '-'
      const branch = row.branch || storeInfo?.branch || 'MIDI BOYOLALI'
      
      const dateStr = row.tanggal_kunjungan || row.created_at
      let formattedDate = dateStr
      if (dateStr) {
        const d = new Date(dateStr)
        formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`
      }

      return [
        row.nik_teknisi || '-',
        row.nama_lengkap || '-',
        formattedDate,
        row.store_kode || '-',
        namaToko,
        branch,
        row.pekerjaan_rutin || '-',
        row.pekerjaan_rutin_lainnya || '-',
        row.pekerjaan_non_rutin || '-',
        row.pekerjaan_non_rutin_lainnya || '-'
      ]
    })

    autoTable(doc, {
      startY: 35,
      head: [['NIK', 'Nama Lengkap', 'Tgl Kunjungan', 'Kode Toko', 'Nama Toko', 'Branch', 'Pekerjaan Rutin', 'Rutin Lainnya', 'Pekerjaan Non Rutin', 'Non Rutin Lainnya']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [12, 83, 154], textColor: 255 },
      styles: { fontSize: 8 },
    })

    doc.save(`Riwayat_DPM_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Month tabs */}
          <div className="flex gap-1 flex-wrap">
            {MONTHS.map((m, i) => (
              <button
                key={i}
                onClick={() => setFilterMonth(i + 1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMonth === i + 1
                    ? 'bg-[#cc1e2c] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-[#cc1e2c] hover:text-[#cc1e2c]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {/* Year selector */}
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => setFilterYear(y => y - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold">‹</button>
            <span className="text-sm font-bold text-gray-700 px-1">{filterYear}</span>
            <button onClick={() => setFilterYear(y => y + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold">›</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">{filteredHistory.length} data</span>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-[#0c539a] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-800 transition-all active:scale-95"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold text-xs tracking-wider">
            <th className="px-6 py-4">NIK</th>
            <th className="px-6 py-4">Nama Lengkap</th>
            <th className="px-6 py-4">Tanggal Kunjungan</th>
            <th className="px-4 py-4 text-center"><MapPin size={16} className="inline" /></th>
            <th className="px-6 py-4">Kode Toko</th>
            <th className="px-6 py-4">Nama Toko</th>
            <th className="px-6 py-4">Branch</th>
            <th className="px-6 py-4">Pekerjaan Rutin</th>
            <th className="px-6 py-4">Pekerjaan Rutin Lainnya</th>
            <th className="px-6 py-4">Pekerjaan Non Rutin</th>
            <th className="px-6 py-4">Pekerjaan Non Rutin Lainnya</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filteredHistory.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-6 py-12 text-center text-gray-400 font-medium">
                Belum ada data DPM untuk {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][filterMonth-1]} {filterYear}
              </td>
            </tr>
          ) : filteredHistory.map((row, i) => {
            // Find store name and branch from activeStores if available
            const storeInfo = activeStores?.find(s => s.kode === row.store_kode || s.kodeToko === row.store_kode)
            const namaToko = storeInfo?.nama || storeInfo?.namaToko || '-'
            const branch = row.branch || storeInfo?.branch || 'MIDI BOYOLALI'

            const dateStr = row.tanggal_kunjungan || row.created_at
            let formattedDate = dateStr
            if (dateStr) {
              const d = new Date(dateStr)
              formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`
            }

            return (
              <tr key={row.id || i} className="hover:bg-red-50/30 transition-colors">
                <td className="px-6 py-4 text-gray-600">{row.nik_teknisi || '-'}</td>
                <td className="px-6 py-4 text-gray-800 font-medium">{row.nama_lengkap || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{formattedDate}</td>
                <td className="px-4 py-4 text-center">
                  {(row.latitude && row.longitude) ? (
                    <a 
                      href={`https://maps.google.com/maps?q=${row.latitude},${row.longitude}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex text-gray-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                      title={`${row.latitude}, ${row.longitude}`}
                    >
                      <MapPin size={16} />
                    </a>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-800 font-bold">{row.store_kode || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{namaToko}</td>
                <td className="px-6 py-4 text-gray-600">{branch}</td>
                <td className="px-6 py-4 text-gray-800">{row.pekerjaan_rutin || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{row.pekerjaan_rutin_lainnya || '-'}</td>
                <td className="px-6 py-4 text-gray-800">{row.pekerjaan_non_rutin || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{row.pekerjaan_non_rutin_lainnya || '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </div>
  )
}
