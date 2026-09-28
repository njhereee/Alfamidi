'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon, 
  ArrowLeft, 
  Printer, 
  Share2, 
  Loader2,
  Building2,
  Snowflake,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── TEMPLATE FORM FCPT (A - J Categories) ───────────────────────────────────
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

function StatusBadge({ status }: { status: string }) {
  let styles = 'bg-gray-100 text-gray-500 border-gray-200'
  const val = (status || '').toUpperCase()
  
  if (val.includes('BAIK') || val.includes('NORMAL') || val.includes('OK')) {
    styles = 'bg-emerald-100 text-emerald-700 border-emerald-200'
  } else if (val.includes('DAPAT DIGUNAKAN') || val.includes('PERLU PERBAIKAN') || val.includes('SEDANG')) {
    styles = 'bg-amber-100 text-amber-700 border-amber-200'
  } else if (val.includes('TIDAK DAPAT') || val.includes('RUSAK') || val.includes('MATI')) {
    styles = 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <span className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border text-center leading-tight shadow-xs ${styles}`}>
      {status || 'N/A'}
    </span>
  )
}

function CategoryAccordion({ cat }: { cat: any }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs">
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
          {open ? <ChevronUp size={18} className="text-white" /> : <ChevronDown size={18} className="text-gray-500" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-white">
            <div className="divide-y divide-gray-100">
              {cat.items.map((item: any) => (
                <div key={item.code} className="p-5 space-y-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <p className="font-bold text-gray-800 text-sm leading-snug flex-1">
                      {item.code}. {item.label}
                    </p>
                    <div className="shrink-0 flex items-center sm:items-end flex-row sm:flex-col gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs font-bold text-gray-400">Skor: {item.nilaiItem}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-700">Keterangan:</span> {item.keterangan}</p>
                  </div>
                  
                  {item.photo ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative max-w-sm">
                      <img src={item.photo} alt={`Foto ${item.code}`} className="w-full h-auto object-cover max-h-[300px]" loading="lazy" />
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 flex items-center gap-2 text-gray-400 max-w-sm">
                      <ImageIcon size={18} className="opacity-50 shrink-0" />
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

export default function BMTRekapDetailView({ data, onBack }: { data: any, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'fcpt' | 'chiller' | 'genset'>('fcpt')
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Data State
  const [fcptItems, setFcptItems] = useState<any[]>([])
  const [chillerData, setChillerData] = useState<any>(null)
  const [chillerItems, setChillerItems] = useState<any[]>([])
  const [gensetData, setGensetData] = useState<any>(null)
  const [gensetItems, setGensetItems] = useState<any[]>([])

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const storeKode = data?.kodeToko

        if (!storeKode) return

        // 1. Fetch FCPT (Bangunan)
        const { data: fcptSub } = await supabase
          .from('fcpt_submissions')
          .select('id')
          .eq('store_kode', storeKode)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fcptSub?.id) {
          const { data: details } = await supabase
            .from('fcpt_item_details')
            .select('*')
            .eq('submission_id', fcptSub.id)
          setFcptItems(details || [])
        }

        // 2. Fetch Chiller (Equipment Pendingin)
        const { data: chillerSub } = await supabase
          .from('chiller_submissions')
          .select('*')
          .eq('kode_toko', storeKode)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (chillerSub?.id) {
          setChillerData(chillerSub)
          const { data: cDetails } = await supabase
            .from('chiller_item_details')
            .select('*')
            .eq('submission_id', chillerSub.id)
          setChillerItems(cDetails || [])
        }

        // 3. Fetch Genset
        const { data: gSub } = await supabase
          .from('genset_submissions')
          .select('*')
          .eq('kode_toko', storeKode)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (gSub?.id) {
          setGensetData(gSub)
          const { data: gDetails } = await supabase
            .from('genset_item_details')
            .select('*')
            .eq('submission_id', gSub.id)
          setGensetItems(gDetails || [])
        }

      } catch (error) {
        console.error('Error fetching checklist details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [data])

  // Calculation FCPT
  const fcptCalculations = useMemo(() => {
    const sipilItems = fcptItems.filter(item => /^[A-F]/.test(item.item_id) && item.nilai !== null)
    const mepItems = fcptItems.filter(item => /^[G-J]/.test(item.item_id) && item.nilai !== null)

    const avgSipil = sipilItems.length > 0 ? sipilItems.reduce((acc, curr) => acc + curr.nilai, 0) / sipilItems.length : 0
    const avgMep = mepItems.length > 0 ? mepItems.reduce((acc, curr) => acc + curr.nilai, 0) / mepItems.length : 0

    const nilaiAkhir = (avgSipil * 0.75) + (avgMep * 0.25)

    const groupedData = formDataTemplate.map(section => {
      const answeredItems = fcptItems.filter(dbItem => section.items.some(t => t.id === dbItem.item_id))
      const validAnswers = answeredItems.filter(i => i.nilai !== null)
      
      const avgCategory = validAnswers.length > 0
        ? validAnswers.reduce((acc, curr) => acc + curr.nilai, 0) / validAnswers.length
        : 0

      const splitCat = section.category.split('. ')
      const catId = splitCat[0]
      const catTitle = splitCat[1] || section.category

      const displayItems = section.items.map(templateItem => {
        const dbAnswer = fcptItems.find(i => i.item_id === templateItem.id)
        return {
          code: templateItem.id,
          label: templateItem.label,
          status: dbAnswer?.kondisi || 'Belum Diisi',
          keterangan: dbAnswer?.keterangan || '-',
          photo: dbAnswer?.foto_url || null,
          nilaiItem: dbAnswer?.nilai || 0
        }
      }).filter(item => item.status !== 'Belum Diisi')

      return {
        id: catId,
        title: catTitle,
        nilai: Math.round(avgCategory),
        items: displayItems
      }
    }).filter(cat => cat.items.length > 0)

    return { 
      avgSipil: Math.round(avgSipil), 
      avgMep: Math.round(avgMep), 
      nilaiAkhir: Math.round(nilaiAkhir), 
      groupedData 
    }
  }, [fcptItems])

  const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg'))
      }
      img.onerror = (error) => reject(error)
      img.src = url
    })
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const imageUrls = new Set<string>()
      fcptCalculations.groupedData.forEach(cat => {
        cat.items.forEach(item => {
          if (item.photo) imageUrls.add(item.photo)
        })
      })

      const base64Map: Record<string, string> = {}
      await Promise.all(
        Array.from(imageUrls).map(async (url) => {
          try {
            base64Map[url] = await getBase64ImageFromURL(url)
          } catch (error) {
            console.error("Gagal load gambar:", url)
          }
        })
      )

      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('LAPORAN HASIL INSPEKSI FCPT', 14, 20)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Kode Toko   : ${data?.kodeToko || '-'}`, 14, 30)
      doc.text(`Nama Toko : ${data?.namaToko || '-'}`, 14, 36)
      doc.text(`PIC BMT   : ${data?.namaPic || '-'}`, 110, 30)
      doc.text(`Tanggal   : ${new Date().toLocaleDateString('id-ID')}`, 110, 36)

      doc.setFillColor(245, 247, 250)
      doc.roundedRect(14, 42, 182, 18, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(12, 83, 154)
      doc.text(`NILAI AKHIR: ${fcptCalculations.nilaiAkhir}`, 18, 52)
      doc.setTextColor(0, 0, 0)
      doc.text(`Rataan Sipil: ${fcptCalculations.avgSipil}`, 80, 52)
      doc.text(`Rataan MEP: ${fcptCalculations.avgMep}`, 140, 52)

      let startY = 70

      fcptCalculations.groupedData.forEach((cat) => {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${cat.id}. ${cat.title} (Nilai: ${cat.nilai})`, 14, startY)

        const tableBody: any[] = []
        cat.items.forEach(item => {
          tableBody.push([
            item.code,
            item.label,
            item.status,
            item.nilaiItem,
            item.keterangan || '-'
          ])

          const base64Data = item.photo && base64Map[item.photo] ? base64Map[item.photo] : null
          if (base64Data) {
            tableBody.push([
              {
                content: base64Data, 
                colSpan: 5,          
                styles: { minCellHeight: 36, fillColor: [249, 250, 251] } 
              }
            ])
          }
        })

        autoTable(doc, {
          startY: startY + 4,
          head: [['Kode', 'Item Pengecekan', 'Kondisi', 'Skor', 'Keterangan']],
          body: tableBody,
          theme: 'grid',
          rowPageBreak: 'avoid',
          margin: { top: 20, bottom: 20 },
          styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
          headStyles: { fillColor: [12, 83, 154], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 70 },
            2: { cellWidth: 40 },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 'auto' }, 
          },
          didParseCell: function(d) {
            if (d.section === 'body' && d.cell.colSpan === 5) {
              d.cell.text = [] 
            }
          },
          didDrawCell: function (d) {
            if (d.section === 'body' && d.cell.colSpan === 5) {
              const base64Data = d.row.raw[0].content
              if (base64Data && typeof base64Data === 'string' && base64Data.startsWith('data:image')) {
                const imgWidth = 50
                const imgHeight = 30
                const xPos = d.cell.x + (d.cell.width / 2) - (imgWidth / 2)
                const yPos = d.cell.y + 3
                doc.addImage(base64Data, 'JPEG', xPos, yPos, imgWidth, imgHeight)
              }
            }
          }
        })

        // @ts-ignore
        startY = doc.lastAutoTable.finalY + 12
        if (startY > 270) {
          doc.addPage()
          startY = 20
        }
      })

      doc.save(`Laporan_FCPT_${data?.kodeToko || 'Toko'}.pdf`)
    } catch (error) {
      console.error("Gagal melakukan export PDF:", error)
      alert("Terjadi kesalahan saat memuat gambar untuk PDF.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    const textToShare = 
`*Laporan Checklist Toko*\n
🏢 Toko: ${data?.kodeToko} - ${data?.namaToko}
👨‍🔧 PIC: ${data?.namaPic || '-'}
📊 Nilai Akhir FCPT: *${fcptCalculations.nilaiAkhir}*
\nSilakan cek detail lengkapnya di sistem.`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Laporan FCPT ${data?.kodeToko}`,
          text: textToShare,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share dibatalkan', error)
      }
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(textToShare + '\n\n' + window.location.href)}`
      window.open(waUrl, '_blank')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f7fb] gap-4">
      <div className="animate-spin w-10 h-10 border-4 border-[#0c539a] border-t-transparent rounded-full shadow-md" />
      <p className="text-gray-500 font-medium animate-pulse text-xs">Memuat data checklist toko...</p>
    </div>
  )

  const nilaiColor = fcptCalculations.nilaiAkhir < 90 ? 'bg-[#cc1e2c]' : 'bg-[#0c539a]'

  return (
    <div className="w-full min-h-screen bg-[#f4f7fb]">
      
      {/* Header Bar */}
      <div className="bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <button onClick={onBack} className="flex items-center gap-2 font-bold text-xs text-gray-700 hover:text-[#0c539a] transition">
          <ArrowLeft size={16} /> Kembali
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#0c539a] bg-blue-50 border border-blue-100 rounded-lg hover:bg-[#0c539a] hover:text-white transition-all shadow-xs disabled:opacity-50"
          >
            <Share2 size={14} /> <span className="hidden sm:inline">Bagikan</span>
          </button>
          
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-gray-800 border border-gray-900 rounded-lg hover:bg-black transition-all shadow-xs disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span className="hidden sm:inline">Memproses...</span>
              </>
            ) : (
              <>
                <Printer size={14} />
                <span className="hidden sm:inline">Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-24 px-4 pt-6 space-y-6">
        
        {/* Info Card Toko */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-4">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-1">Kode Toko</p>
              <p className="font-bold text-gray-800 text-base">{data?.kodeToko || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-1">Nama Toko</p>
              <p className="font-bold text-gray-800 text-base">{data?.namaToko || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-1">PIC BMT</p>
              <p className="font-bold text-gray-800 text-sm">{data?.namaPic || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-1">Status Laporan</p>
              <p className="font-bold text-emerald-600 text-sm">{data?.isDone ? 'Selesai' : 'Aktif'}</p>
            </div>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex rounded-2xl bg-gray-200/80 p-1.5 gap-1.5 border border-gray-200 shadow-inner">
          <button
            onClick={() => setActiveTab('fcpt')}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'fcpt'
                ? 'bg-white text-[#0c539a] shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Building2 size={16} />
            <span>Bangunan (FCPT)</span>
          </button>

          <button
            onClick={() => setActiveTab('chiller')}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'chiller'
                ? 'bg-white text-[#0c539a] shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Snowflake size={16} />
            <span>Eq. Pendingin</span>
          </button>

          <button
            onClick={() => setActiveTab('genset')}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'genset'
                ? 'bg-white text-[#0c539a] shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Zap size={16} />
            <span>Genset</span>
          </button>
        </div>

        {/* TAB CONTENT 1: FCPT / BANGUNAN */}
        {activeTab === 'fcpt' && (
          <div className="space-y-6">
            {/* Skor Akhir & Rataan */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between flex-1 sm:pr-4 sm:border-r border-gray-100">
                <span className="font-black text-gray-800 text-sm uppercase tracking-wide">Nilai Akhir</span>
                <span className={`${nilaiColor} text-white font-black text-xl px-4 py-1.5 rounded-xl shadow-md`}>
                  {fcptCalculations.nilaiAkhir}
                </span>
              </div>
              <div className="flex items-center justify-between flex-1">
                <span className="font-black text-gray-800 text-sm uppercase tracking-wide">Rataan Sipil</span>
                <span className="bg-[#0c539a] text-white font-black text-xl px-4 py-1.5 rounded-xl shadow-md">
                  {fcptCalculations.avgSipil}
                </span>
              </div>
            </div>

            {/* Accordions Kategori A-J */}
            <div className="space-y-3">
              {fcptCalculations.groupedData.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500 font-medium text-xs">Belum ada data FCPT yang tersimpan untuk toko ini.</p>
                </div>
              ) : (
                fcptCalculations.groupedData.map((cat) => (
                  <CategoryAccordion key={cat.id} cat={cat} />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: EQUIPMENT PENDINGIN (CHILLER) */}
        {activeTab === 'chiller' && (
          <div className="space-y-6">
            {!chillerData ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-6">
                <Snowflake size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 font-bold text-sm">Belum Ada Data Equipment Pendingin</p>
                <p className="text-gray-400 text-xs mt-1">Checklist chiller/freezer belum diisi untuk toko ini.</p>
              </div>
            ) : (
              <>
                {/* Summary Card Chiller */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase">
                        {chillerData.jenis_mesin || 'Pendingin'}
                      </span>
                      <h3 className="text-lg font-black text-gray-800 mt-2">{chillerData.merk_mesin || 'Merk Tidak Tercatat'}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Nilai Akhir</p>
                      <p className="text-2xl font-black text-[#0c539a]">{chillerData.nilai_akhir ?? 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-bold uppercase">Suhu Tercatat</p>
                      <p className="font-bold text-gray-800 text-sm mt-0.5">
                        {chillerData.suhu_tercatat !== null ? `${chillerData.suhu_tercatat}°C` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase">Status Unit</p>
                      <div className="mt-0.5"><StatusBadge status={chillerData.status_unit || '-'} /></div>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase">Status Tagging</p>
                      <p className="font-bold text-gray-800 mt-0.5">{chillerData.status_tagging || '-'}</p>
                    </div>
                  </div>

                  {chillerData.keterangan_unit && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                      <span className="font-bold text-gray-700">Catatan Unit: </span>
                      <span className="text-gray-600">{chillerData.keterangan_unit}</span>
                    </div>
                  )}

                  {chillerData.foto_unit_url && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">Foto Unit Utama</p>
                      <img src={chillerData.foto_unit_url} alt="Foto Unit Chiller" className="w-full max-w-sm rounded-xl border border-gray-200 object-cover max-h-56" />
                    </div>
                  )}
                </div>

                {/* Detail Item Checklist Chiller */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-xs uppercase text-gray-600 tracking-wider">Item Pengecekan Equipment Pendingin</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {chillerItems.length === 0 ? (
                      <p className="p-5 text-xs text-gray-400 text-center">Tidak ada item detail tercatat.</p>
                    ) : (
                      chillerItems.map((item, idx) => (
                        <div key={item.id || idx} className="p-5 space-y-3 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <p className="font-bold text-gray-800 text-sm flex-1">
                              {item.item_label || item.item_id}
                            </p>
                            <div className="shrink-0 flex items-center gap-2">
                              <StatusBadge status={item.kondisi} />
                              <span className="text-xs font-bold text-gray-400">Skor: {item.skor ?? 0}</span>
                            </div>
                          </div>
                          {item.foto_url && (
                            <img src={item.foto_url} alt="Foto Item" className="w-full max-w-xs rounded-lg border border-gray-200 max-h-48 object-cover" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB CONTENT 3: GENSET */}
        {activeTab === 'genset' && (
          <div className="space-y-6">
            {!gensetData ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-6">
                <Zap size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 font-bold text-sm">Belum Ada Data Genset</p>
                <p className="text-gray-400 text-xs mt-1">Checklist genset belum diisi untuk toko ini.</p>
              </div>
            ) : (
              <>
                {/* Summary Card Genset */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase">
                        {gensetData.jenis_genset || 'Genset'}
                      </span>
                      <h3 className="text-lg font-black text-gray-800 mt-2">{gensetData.merk_model || 'Merk Tidak Tercatat'}</h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">No. Genset: {gensetData.no_genset || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Nilai Akhir</p>
                      <p className="text-2xl font-black text-[#0c539a]">{gensetData.nilai_akhir ?? 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-bold uppercase">Status Unit</p>
                      <div className="mt-0.5"><StatusBadge status={gensetData.status_unit || '-'} /></div>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase">Pemanasan Unit</p>
                      <p className="font-bold text-gray-800 mt-0.5">{gensetData.pemanasan_unit || '-'}</p>
                    </div>
                  </div>

                  {gensetData.keterangan_unit && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                      <span className="font-bold text-gray-700">Catatan Unit: </span>
                      <span className="text-gray-600">{gensetData.keterangan_unit}</span>
                    </div>
                  )}
                </div>

                {/* Detail Item Checklist Genset */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-xs uppercase text-gray-600 tracking-wider">Item Pengecekan Genset</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {gensetItems.length === 0 ? (
                      <p className="p-5 text-xs text-gray-400 text-center">Tidak ada item detail tercatat.</p>
                    ) : (
                      gensetItems.map((item, idx) => (
                        <div key={item.id || idx} className="p-5 space-y-3 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <p className="font-bold text-gray-800 text-sm flex-1">
                              {item.item_label || item.item_id}
                            </p>
                            <div className="shrink-0 flex items-center gap-2">
                              <StatusBadge status={item.kondisi} />
                              <span className="text-xs font-bold text-gray-400">Skor: {item.skor ?? 0}</span>
                            </div>
                          </div>
                          {item.keterangan && (
                            <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                              <span className="font-bold text-gray-700">Ket:</span> {item.keterangan}
                            </p>
                          )}
                          {item.foto_url && (
                            <img src={item.foto_url} alt="Foto Item Genset" className="w-full max-w-xs rounded-lg border border-gray-200 max-h-48 object-cover" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </motion.div>
    </div>
  )
}