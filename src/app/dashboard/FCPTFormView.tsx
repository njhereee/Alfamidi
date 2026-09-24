'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, UploadCloud, CheckCircle } from 'lucide-react'

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

export default function FCPTFormView({ store, onBack }: { store: any, onBack: () => void }) {
  const [answers, setAnswers] = useState<any>({})
  const [currentStep, setCurrentStep] = useState(0)

  const handleRadioChange = (itemId: string, value: string) => {
    setAnswers({
      ...answers,
      [itemId]: { ...answers[itemId], status: value }
    })
  }

  const handleKeteranganChange = (itemId: string, value: string) => {
    setAnswers({
      ...answers,
      [itemId]: { ...answers[itemId], keterangan: value }
    })
  }

  const handleFileChange = (itemId: string, file: File | null) => {
    if (file) {
      setAnswers({
        ...answers,
        [itemId]: { ...answers[itemId], fotoName: file.name }
      })
    }
  }

  const section = formDataTemplate[currentStep]
  const isLastStep = currentStep === formDataTemplate.length - 1

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-20"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 border-t-8 border-t-[#cc1e2c] relative">
        <h1 className="text-3xl font-black text-gray-800 mb-2 pr-12">CEKLIST BANGUNAN DAN ELEKTRIKAL TOKO</h1>
        <p className="text-gray-500 mb-6">Form Ceklist Kondisi Bangunan untuk Toko: <span className="font-bold text-gray-800">{store?.nama} - {store?.kode}</span></p>
        <div className="text-sm text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-100 inline-block">
          * Menunjukkan pertanyaan yang wajib diisi
        </div>
      </div>

      {/* Navigasi Step */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-2">
        {formDataTemplate.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentStep === idx ? 'bg-[#cc1e2c] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            {s.category.split('.')[0]}
          </button>
        ))}
      </div>

      {/* Konten Segmen Aktif */}
      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-[#f8fafc] px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-800">{section.category}</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {section.items.map((item) => {
            const currentAnswer = answers[item.id] || {}
            const status = currentAnswer.status

            return (
              <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <p className="font-semibold text-gray-800 mb-4">{item.id}. {item.label} <span className="text-red-500">*</span></p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  {['BAIK', 'RUSAK MASIH DAPAT DIGUNAKAN', 'RUSAK TIDAK DAPAT DIGUNAKAN'].map((opt) => (
                    <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${status === opt ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${status === opt ? 'border-[#cc1e2c]' : 'border-gray-300'}`}>
                        {status === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#cc1e2c]" />}
                      </div>
                      <span className={`text-sm font-medium ${status === opt ? 'text-[#cc1e2c]' : 'text-gray-600'}`}>{opt}</span>
                      <input 
                        type="radio" 
                        name={item.id} 
                        value={opt}
                        className="hidden" 
                        onChange={() => handleRadioChange(item.id, opt)}
                      />
                    </label>
                  ))}
                </div>

                <div className="space-y-4 pt-2 border-t border-gray-100 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan / Estimasi <span className="text-red-500">*</span></label>
                    <textarea 
                      rows={2}
                      placeholder="Tuliskan keterangan detail..."
                      value={currentAnswer.keterangan || ''}
                      onChange={(e) => handleKeteranganChange(item.id, e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Foto <span className="text-red-500">*</span></label>
                    <label className="w-full border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-xl p-4 flex flex-col justify-center items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer group">
                      {currentAnswer.fotoName ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle size={20} />
                          <span className="font-semibold text-sm">{currentAnswer.fotoName}</span>
                        </div>
                      ) : (
                        <>
                          <Camera size={24} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                          <span className="text-gray-500 text-sm font-medium">Klik untuk upload foto</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(item.id, e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      <div className="flex justify-between items-center gap-4 mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <button 
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} 
          disabled={currentStep === 0}
          className={`px-6 py-3 font-bold rounded-xl transition-colors ${currentStep === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Sebelumnya
        </button>

        {!isLastStep ? (
          <button 
            onClick={() => setCurrentStep(Math.min(formDataTemplate.length - 1, currentStep + 1))} 
            className="px-8 py-3 bg-[#cc1e2c] text-white font-bold rounded-xl hover:bg-red-800 transition-colors shadow-sm"
          >
            Selanjutnya
          </button>
        ) : (
          <button className="px-8 py-3 bg-[#0c539a] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm">
            Kirim Form
          </button>
        )}
      </div>

    </motion.div>
  )
}
