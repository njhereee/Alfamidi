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
  Zap
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Menggabungkan props data dengan filterType dari BMTDashboard
interface BMTRekapDetailViewProps {
  data: any; 
  filterType: string; // 'Semua' | 'FCPT' | 'Chiller' | 'Genset'
  onBack: () => void;
}

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
  } else if (val.includes('TIDAK DAPAT') || val.includes('RUSAK') || val.includes('MATI') || val.includes('NOK')) {
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

export default function BMTRekapDetailView({ data, filterType, onBack }: BMTRekapDetailViewProps) {
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Data State
  const [fcptItems, setFcptItems] = useState<any[]>([])
  const [chillerData, setChillerData] = useState<any>(null)
  const [chillerItems, setChillerItems] = useState<any[]>([])
  const [gensetData, setGensetData] = useState<any>(null)
  const [gensetItems, setGensetItems] = useState<any[]>([])

  // Filter Logika Tab
  const availableTabs = useMemo(() => {
    const tabs = [];
    if (!filterType || filterType === 'Semua' || filterType === 'FCPT') {
      tabs.push({ id: 'fcpt', label: 'Bangunan (FCPT)' });
    }
    if (!filterType || filterType === 'Semua' || filterType === 'Chiller') {
      tabs.push({ id: 'chiller', label: 'Equipment Pendingin' });
    }
    if (!filterType || filterType === 'Semua' || filterType === 'Genset') {
      tabs.push({ id: 'genset', label: 'Genset' });
    }
    return tabs;
  }, [filterType]);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'fcpt');

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [filterType, availableTabs, activeTab]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        const { createClient } = await import('@/frontend/supabase/client')
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
          .eq('store_kode', storeKode)
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
          .eq('store_kode', storeKode)
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

  type PdfLoadedImage = { data: string; width: number; height: number; format: 'JPEG' | 'PNG' }

  const bitmapToPdfImage = async (
    bitmap: ImageBitmap,
    preferPng: boolean
  ): Promise<PdfLoadedImage> => {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas tidak tersedia')
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    const usePng = preferPng
    const data = canvas.toDataURL(usePng ? 'image/png' : 'image/jpeg', 0.92)
    return {
      data,
      width: canvas.width,
      height: canvas.height,
      format: usePng ? 'PNG' : 'JPEG',
    }
  }

  const loadImageForPdf = async (url: string): Promise<PdfLoadedImage | null> => {
    const preferPng = url.toLowerCase().includes('.png')

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)
      return await bitmapToPdfImage(bitmap, preferPng || blob.type.includes('png'))
    } catch (fetchErr) {
      console.warn('Fetch gambar gagal, coba fallback Image:', url, fetchErr)
    }

    try {
      const bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          createImageBitmap(img)
            .then(resolve)
            .catch(reject)
        }
        img.onerror = () => reject(new Error('Image onerror'))
        img.src = url
      })
      return await bitmapToPdfImage(bitmap, preferPng)
    } catch (err) {
      console.error('Gagal load gambar untuk PDF:', url, err)
      return null
    }
  }

  const fitImageMm = (
    pixelW: number,
    pixelH: number,
    maxWmm: number,
    maxHmm: number
  ) => {
    if (pixelW <= 0 || pixelH <= 0) return { w: 0, h: 0 }
    const aspect = pixelW / pixelH
    let w = maxWmm
    let h = w / aspect
    if (h > maxHmm) {
      h = maxHmm
      w = h * aspect
    }
    return { w, h }
  }

  const pdfItemRowCells = (item: {
    code: string
    label: string
    status: string
    nilaiItem: number | string
    keterangan?: string
  }) => [
    item.code,
    item.label,
    item.status,
    String(item.nilaiItem),
    item.keterangan || '-',
  ]

  const emptyPdfItemCells = () => ['—', '—', '—', '—', '—']

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const imageUrls = new Set<string>()
      fcptCalculations.groupedData.forEach(cat => {
        cat.items.forEach(item => {
          if (item.photo) imageUrls.add(item.photo)
        })
      })

      const imageMap: Record<string, PdfLoadedImage> = {}
      await Promise.all(
        Array.from(imageUrls).map(async (url) => {
          const loaded = await loadImageForPdf(url)
          if (loaded) imageMap[url] = loaded
        })
      )

      const pdfHalfWidthMm = 88
      const pdfImageMaxHmm = 42

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

        const pdfImagePlacements: Record<string, PdfLoadedImage> = {}
        const tableBody: any[] = []
        const items = cat.items as Array<{
          code: string
          label: string
          status: string
          nilaiItem: number | string
          keterangan?: string
          photo?: string
        }>

        for (let i = 0; i < items.length; i += 2) {
          const left = items[i]
          const right = items[i + 1]

          tableBody.push([
            ...pdfItemRowCells(left),
            ...(right ? pdfItemRowCells(right) : emptyPdfItemCells()),
          ])

          const leftImg = left.photo ? imageMap[left.photo] : undefined
          const rightImg = right?.photo ? imageMap[right.photo] : undefined

          if (leftImg || rightImg) {
            const leftSize = leftImg
              ? fitImageMm(leftImg.width, leftImg.height, pdfHalfWidthMm - 4, pdfImageMaxHmm)
              : { w: 0, h: 0 }
            const rightSize = rightImg
              ? fitImageMm(rightImg.width, rightImg.height, pdfHalfWidthMm - 4, pdfImageMaxHmm)
              : { w: 0, h: 0 }
            const rowHmm = Math.max(leftSize.h, rightSize.h, 18) + 6
            const imageRowIndex = tableBody.length

            tableBody.push([
              {
                content: '',
                colSpan: 5,
                styles: { minCellHeight: rowHmm, fillColor: [249, 250, 251] },
              },
              {
                content: '',
                colSpan: 5,
                styles: { minCellHeight: rowHmm, fillColor: [249, 250, 251] },
              },
            ])

            if (leftImg) {
              pdfImagePlacements[`${cat.id}:${imageRowIndex}:left`] = leftImg
            }
            if (rightImg) {
              pdfImagePlacements[`${cat.id}:${imageRowIndex}:right`] = rightImg
            }
          }
        }

        if (tableBody.length === 0) {
          startY += 8
          return
        }

        autoTable(doc, {
          startY: startY + 4,
          head: [[
            'Kode', 'Item Pengecekan', 'Kondisi', 'Skor', 'Ket',
            'Kode', 'Item Pengecekan', 'Kondisi', 'Skor', 'Ket',
          ]],
          body: tableBody,
          theme: 'grid',
          tableWidth: 176,
          rowPageBreak: 'avoid',
          margin: { top: 20, bottom: 20, left: 14, right: 20 },
          styles: { fontSize: 7, cellPadding: 2.5, valign: 'top' },
          headStyles: { fillColor: [12, 83, 154], textColor: 255, fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 11 },
            1: { cellWidth: 30 },
            2: { cellWidth: 20 },
            3: { cellWidth: 9, halign: 'center' },
            4: { cellWidth: 18 },
            5: { cellWidth: 11 },
            6: { cellWidth: 30 },
            7: { cellWidth: 20 },
            8: { cellWidth: 9, halign: 'center' },
            9: { cellWidth: 18 },
          },
          didParseCell(d) {
            if (d.section !== 'body' || d.cell.colSpan !== 5) return
            const side = d.column.index < 5 ? 'left' : 'right'
            const key = `${cat.id}:${d.row.index}:${side}`
            if (pdfImagePlacements[key]) d.cell.text = []
          },
          didDrawCell(d) {
            if (d.section !== 'body' || d.cell.colSpan !== 5) return
            const side = d.column.index < 5 ? 'left' : 'right'
            const img = pdfImagePlacements[`${cat.id}:${d.row.index}:${side}`]
            if (!img?.data) return

            const pad = 2
            const maxW = d.cell.width - pad * 2
            const maxH = d.cell.height - pad * 2
            const { w, h } = fitImageMm(img.width, img.height, maxW, maxH)
            if (w <= 0 || h <= 0) return

            const x = d.cell.x + (d.cell.width - w) / 2
            const y = d.cell.y + (d.cell.height - h) / 2
            try {
              doc.addImage(img.data, img.format, x, y, w, h)
            } catch (drawErr) {
              console.error(
                'Gagal menempel gambar ke PDF:',
                `${cat.id}:${d.row.index}:${side}`,
                drawErr
              )
            }
          },
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
      console.error('Gagal melakukan export PDF:', error)
      const detail = error instanceof Error ? error.message : String(error)
      alert(`Export PDF gagal: ${detail}`)
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

        {/* TAB SWITCHER (Dinamis berdasarkan availableTabs) */}
        {availableTabs.length > 1 && (
          <div className="flex rounded-2xl bg-gray-200/80 p-1.5 gap-1.5 border border-gray-200 shadow-inner">
            {availableTabs.some(t => t.id === 'fcpt') && (
              <button
                onClick={() => setActiveTab('fcpt')}
                className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'fcpt'
                    ? 'bg-white text-[#0c539a] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Building2 size={16} />
                <span className="hidden sm:inline">Bangunan (FCPT)</span>
                <span className="sm:hidden">FCPT</span>
              </button>
            )}

            {availableTabs.some(t => t.id === 'chiller') && (
              <button
                onClick={() => setActiveTab('chiller')}
                className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'chiller'
                    ? 'bg-white text-[#0c539a] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Snowflake size={16} />
                <span className="hidden sm:inline">Eq. Pendingin</span>
                <span className="sm:hidden">Chiller</span>
              </button>
            )}

            {availableTabs.some(t => t.id === 'genset') && (
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
            )}
          </div>
        )}

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
                      <p className="text-gray-400 font-bold uppercase">Status Tagging</p>
                      <p className="font-bold text-gray-800 text-sm mt-0.5">
                        {chillerData.status_tagging || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* List Item Chiller */}
                {chillerItems.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="font-bold text-gray-800">Detail Pengecekan Item</h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {chillerItems.map((item, idx) => (
                        <div key={idx} className="p-6 space-y-3 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between gap-2">
                            <p className="font-bold text-sm text-gray-800">{item.item_label || `Item ${idx + 1}`}</p>
                            <div className="shrink-0">
                              <StatusBadge status={item.kondisi} />
                            </div>
                          </div>
                          
                          {item.keterangan && (
                            <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                              <p className="text-gray-600 text-sm"><span className="font-bold text-gray-700">Ket:</span> {item.keterangan}</p>
                            </div>
                          )}
                          
                          {item.foto_url && (
                            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative max-w-sm mt-2">
                              <img src={item.foto_url} alt="Foto Chiller" className="w-full h-auto object-cover max-h-[250px]" loading="lazy" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                <p className="text-gray-400 text-xs mt-1">Checklist dan inspeksi genset belum dilakukan untuk toko ini.</p>
              </div>
            ) : (
              <>
                {/* Summary Card Genset */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase">
                        {gensetData.jenis_genset || 'Genset Standar'}
                      </span>
                      <h3 className="text-lg font-black text-gray-800 mt-2">{gensetData.merk_mesin || 'Merk Tidak Tercatat'}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold">Nilai Akhir</p>
                      <p className="text-2xl font-black text-[#0c539a]">{gensetData.nilai_akhir ?? 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-bold uppercase">Status Pemanasan</p>
                      <p className="font-bold text-gray-800 text-sm mt-0.5">
                        {gensetData.pemanasan_unit || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase">Status Unit</p>
                      <p className="font-bold text-gray-800 text-sm mt-0.5">
                        {gensetData.status_unit || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* List Item Genset */}
                {gensetItems.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="font-bold text-gray-800">Detail Pengecekan Item</h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {gensetItems.map((item, idx) => (
                        <div key={idx} className="p-6 space-y-3 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between gap-2">
                            <p className="font-bold text-sm text-gray-800">{item.item_label || `Item ${idx + 1}`}</p>
                            <div className="shrink-0">
                              <StatusBadge status={item.kondisi} />
                            </div>
                          </div>
                          
                          {item.keterangan && (
                            <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                              <p className="text-gray-600 text-sm"><span className="font-bold text-gray-700">Ket:</span> {item.keterangan}</p>
                            </div>
                          )}
                          
                          {item.foto_url && (
                            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative max-w-sm mt-2">
                              <img src={item.foto_url} alt="Foto Genset" className="w-full h-auto object-cover max-h-[250px]" loading="lazy" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </motion.div>
    </div>
  )
}