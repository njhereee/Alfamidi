'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ImageIcon } from 'lucide-react'

// ─── Dummy foto placeholder (unsplash CDN) ────────────────────────────────────
const PHOTO_URLS = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
  'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=400&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
]

type Status = 'Baik' | 'Rusak Sebagian' | 'Rusak Total'

interface SubItem {
  code: string
  label: string
  status: Status
  keterangan: string
  photo: string
}

interface Category {
  id: string
  title: string
  nilai: number
  items: SubItem[]
}

// ─── Dummy data semua kategori ─────────────────────────────────────────────────
const dummyCategories: Category[] = [
  {
    id: 'A', title: 'Area Parkir dan Fasade', nilai: 89,
    items: [
      { code: 'A1', label: 'HALAMAN PARKIR (Rabat beton/aspal/paving, ambles, retak, gelombang)', status: 'Rusak Sebagian', keterangan: 'Terdapat retak pada 6x12m area parkir', photo: PHOTO_URLS[0] },
      { code: 'A2', label: 'DRAINASE (Grill, saluran, tutup saluran, kelancaran aliran)', status: 'Baik', keterangan: 'Keadaan baik', photo: PHOTO_URLS[1] },
      { code: 'A3', label: 'KANOPI (Tiang, rangka, cat, baut, korosi)', status: 'Baik', keterangan: 'Tidak ada korosi', photo: PHOTO_URLS[2] },
      { code: 'A4', label: 'SIGNAGE (Papan nama toko, spanduk, tenant)', status: 'Baik', keterangan: 'Signage terlihat jelas', photo: PHOTO_URLS[3] },
      { code: 'A5', label: 'FINISHING (Pengecatan Area Facade)', status: 'Rusak Sebagian', keterangan: 'Cat mengelupas di beberapa sisi', photo: PHOTO_URLS[4] },
    ]
  },
  {
    id: 'B', title: 'Area Teras dan Area Sales', nilai: 91,
    items: [
      { code: 'B1', label: 'STRUKTUR (Kolom, balok, sloof dan Pondasi, dinding, retak, cat)', status: 'Baik', keterangan: 'Struktur dalam kondisi baik', photo: PHOTO_URLS[0] },
      { code: 'B2', label: 'LANTAI (Keramik, nat, level lantai)', status: 'Baik', keterangan: 'Keramik rata dan tidak retak', photo: PHOTO_URLS[1] },
      { code: 'B3', label: 'PLAFON (Drop ceiling, gutter, finishing)', status: 'Rusak Sebagian', keterangan: 'Ada kebocoran di sudut barat', photo: PHOTO_URLS[2] },
      { code: 'B4', label: 'FURNITURE (Meja kasir, rak tetap, partisi)', status: 'Baik', keterangan: 'Furniture dalam kondisi baik', photo: PHOTO_URLS[3] },
      { code: 'B5', label: 'DRAIN AC (Drain, bak kontrol, kebocoran)', status: 'Baik', keterangan: 'Tidak ada kebocoran', photo: PHOTO_URLS[4] },
      { code: 'B6', label: 'FOLDING GATE (Daun Folding Gate, Rel, Rangka, Cat)', status: 'Baik', keterangan: 'Gate berfungsi normal', photo: PHOTO_URLS[0] },
      { code: 'B7', label: 'FINISHING (Pengecatan Kolom dinding dan Plafon)', status: 'Baik', keterangan: 'Cat rata dan bersih', photo: PHOTO_URLS[1] },
    ]
  },
  {
    id: 'C', title: 'Area Service', nilai: 90,
    items: [
      { code: 'C1', label: 'FINISHING (Pengecatan Kolom, dinding, plafon)', status: 'Baik', keterangan: 'Pengecatan dalam kondisi baik', photo: PHOTO_URLS[2] },
      { code: 'C2', label: 'GUDANG (Janitor, tangga)', status: 'Rusak Sebagian', keterangan: 'Tangga perlu perbaikan cat', photo: PHOTO_URLS[3] },
      { code: 'C3', label: 'Utilitas (Sarana dan Instalasi Air Bersih dan Air Kotor)', status: 'Baik', keterangan: 'Instalasi berfungsi baik', photo: PHOTO_URLS[4] },
      { code: 'C4', label: 'LANTAI (Keramik, nat, level lantai)', status: 'Baik', keterangan: 'Lantai rata', photo: PHOTO_URLS[0] },
    ]
  },
  {
    id: 'D', title: 'KM/WC Sanitary', nilai: 94,
    items: [
      { code: 'D1', label: 'FINISHING (Lantai, dinding, plafon)', status: 'Baik', keterangan: 'Bersih dan rapi', photo: PHOTO_URLS[1] },
      { code: 'D2', label: 'SANITARY (Closet, urinoir, kran, shower, floor drain)', status: 'Baik', keterangan: 'Semua sanitary berfungsi', photo: PHOTO_URLS[2] },
      { code: 'D3', label: 'AIR BERSIH (Pompa, tower, tandon, sumur, PAM, dan Kualitas Air)', status: 'Rusak Sebagian', keterangan: 'Pompa air perlu servis berkala', photo: PHOTO_URLS[3] },
    ]
  },
  {
    id: 'E', title: 'Pintu', nilai: 94,
    items: [
      { code: 'E1', label: 'PINTU KACA (Handle, lock, floor hinge, seal)', status: 'Baik', keterangan: 'Pintu kaca berfungsi baik', photo: PHOTO_URLS[4] },
      { code: 'E2', label: 'PINTU AREA SERVICE (Engsel, handle, cat)', status: 'Baik', keterangan: 'Engsel tidak berkarat', photo: PHOTO_URLS[0] },
      { code: 'E3', label: 'HARDWARE (Door closer, bowdigit, slot)', status: 'Baik', keterangan: 'Door closer berfungsi normal', photo: PHOTO_URLS[1] },
    ]
  },
  {
    id: 'F', title: 'Penutup Bangunan', nilai: 91,
    items: [
      { code: 'F1', label: 'ATAP (Atap, nok, talang, roof drain)', status: 'Rusak Total', keterangan: 'Talang bocor parah, perlu penggantian', photo: PHOTO_URLS[2] },
      { code: 'F2', label: 'CLADDING (Cladding Merah/Silver, Flushing)', status: 'Baik', keterangan: 'Cladding masih baik', photo: PHOTO_URLS[3] },
    ]
  },
  {
    id: 'G', title: 'Material Elektrikal Luar', nilai: 89,
    items: [
      { code: 'G1', label: 'PENERANGAN (Lampu luar, sign, parkir)', status: 'Rusak Sebagian', keterangan: '2 lampu parkir mati', photo: PHOTO_URLS[4] },
      { code: 'G2', label: 'INSTALASI (Stop kontak, outdoor AC)', status: 'Baik', keterangan: 'Instalasi aman', photo: PHOTO_URLS[0] },
    ]
  },
  {
    id: 'H', title: 'Material Elektrikal Sales', nilai: 92,
    items: [
      { code: 'H1', label: 'PENCAHAYAAN (TL, LED, downlight)', status: 'Baik', keterangan: 'Semua lampu menyala', photo: PHOTO_URLS[1] },
      { code: 'H2', label: 'PERALATAN (Speaker, CCTV, Air Curtain, APAR)', status: 'Baik', keterangan: 'CCTV aktif, APAR terisi', photo: PHOTO_URLS[2] },
      { code: 'H3', label: 'INSTALASI (Saklar, stop kontak, kabel)', status: 'Baik', keterangan: 'Kabel rapi dan aman', photo: PHOTO_URLS[3] },
    ]
  },
  {
    id: 'I', title: 'Material Elektrikal Service', nilai: 95,
    items: [
      { code: 'I1', label: 'ELEKTRIKAL (exhaust, saklar, stop kontak)', status: 'Baik', keterangan: 'Semua berfungsi baik', photo: PHOTO_URLS[4] },
      { code: 'I2', label: 'PENCAHAYAAN (lampu)', status: 'Baik', keterangan: 'Penerangan cukup', photo: PHOTO_URLS[0] },
    ]
  },
  {
    id: 'J', title: 'Panel & Genset', nilai: 100,
    items: [
      { code: 'J1', label: 'PANEL LV (Volt, Ampere, CT, Timer, Pilot Lamp)', status: 'Baik', keterangan: 'Panel dalam kondisi prima', photo: PHOTO_URLS[1] },
      { code: 'J2', label: 'PROTEKSI (MCB, MCCB, COS, Kontaktor)', status: 'Baik', keterangan: 'Proteksi berfungsi normal', photo: PHOTO_URLS[2] },
      { code: 'J3', label: 'GENSET (Earthing, Wiring, Steker)', status: 'Baik', keterangan: 'Genset siap pakai', photo: PHOTO_URLS[3] },
    ]
  },
]

// ─── Badge warna status ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    'Baik': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'Rusak Sebagian': 'bg-amber-100 text-amber-700 border border-amber-200',
    'Rusak Total': 'bg-red-100 text-red-700 border border-red-200',
  }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${styles[status]}`}>
      {status}
    </span>
  )
}

// ─── Category Accordion ────────────────────────────────────────────────────────
function CategoryAccordion({ cat }: { cat: Category }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-5 py-4 flex justify-between items-center transition-colors ${open ? 'bg-[#0c539a] text-white' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-gray-800'}`}
      >
        <span className="font-bold text-sm uppercase tracking-wide">
          {cat.id}. {cat.title}
        </span>
        <div className="flex items-center gap-3">
          <span className={`font-black text-lg ${cat.nilai < 90 ? (open ? 'text-red-200' : 'text-red-500') : (open ? 'text-white' : 'text-emerald-600')}`}>
            {cat.nilai}
          </span>
          {open
            ? <ChevronUp size={18} className="text-white" />
            : <ChevronDown size={18} className="text-gray-500" />
          }
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-white"
          >
            <div className="divide-y divide-gray-100">
              {cat.items.map((item) => (
                <div key={item.code} className="p-5 space-y-3">
                  {/* Sub-item title */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{item.code}. {item.label}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  {/* Keterangan */}
                  <p className="text-gray-500 text-sm">{item.keterangan}</p>
                  {/* Foto */}
                  <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-video relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photo}
                      alt={item.code}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RekapDetailView({ data, onBack }: { data: any, onBack: () => void }) {
  const [achievementOpen, setAchievementOpen] = useState(false)

  const nilaiAkhir = data?.nilaiAkhir ?? 100
  const nilaiColor = nilaiAkhir < 90 ? 'bg-red-600' : 'bg-[#0c539a]'

  return (
    <div className="w-full min-h-screen bg-[#f4f7fb]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto pb-24 px-4 pt-4 space-y-6"
      >

        {/* ── Info Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Kode Branch</p>
              <p className="font-bold text-gray-800">{data?.kodeToko || 'SG1Z'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Nama Branch</p>
              <p className="font-bold text-gray-800">{data?.namaToko || 'Medan'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Nama PIC</p>
              <p className="font-bold text-gray-800">{data?.namaPic || 'Budi Santoso'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Periode</p>
              <p className="font-bold text-gray-800">Kuartal III – 2026</p>
            </div>
          </div>
        </div>

        {/* ── Achievement Accordion ── */}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => setAchievementOpen(!achievementOpen)}
            className={`w-full px-5 py-4 flex justify-between items-center transition-colors ${achievementOpen ? 'bg-[#eef2f6]' : 'bg-white hover:bg-gray-50'}`}
          >
            <span className="font-bold text-gray-800 uppercase tracking-wide">Achievement</span>
            <div className="flex items-center gap-3">
              <span className="font-black text-gray-800">99.7%</span>
              {achievementOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          <AnimatePresence>
            {achievementOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-600 font-medium">Target Checklist</span><span className="font-bold">407</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600 font-medium">Toko Terchecklist</span><span className="font-bold text-emerald-600">244</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600 font-medium">Toko Tidak Terchecklist</span><span className="font-bold text-red-500">163</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Nilai Akhir ── */}
        <div className="flex items-center gap-4 px-1">
          <span className="font-black text-gray-800 text-lg uppercase tracking-wide">Nilai Akhir</span>
          <span className={`${nilaiColor} text-white font-black text-xl px-4 py-1.5 rounded-xl shadow-md`}>
            {nilaiAkhir}
          </span>
        </div>

        {/* ── Nilai Sipil label ── */}
        <div className="flex items-center gap-3 px-1">
          <span className="font-black text-gray-800 text-lg uppercase tracking-wide">Nilai Sipil Rataan</span>
          <span className="bg-[#0c539a] text-white font-black text-lg px-4 py-1.5 rounded-xl shadow-md">93</span>
        </div>

        {/* ── Category Accordions ── */}
        <div className="space-y-3">
          {dummyCategories.map((cat) => (
            <CategoryAccordion key={cat.id} cat={cat} />
          ))}
        </div>

      </motion.div>
    </div>
  )
}
