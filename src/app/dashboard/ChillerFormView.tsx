'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, CheckCircle, Thermometer, Box, Wrench } from 'lucide-react'

const chillerTemplate = [
  {
    category: '1. Spesifikasi Unit',
    isSpecsStep: true,
  },
  {
    category: 'A. Bodi & Aksesoris',
    items: [
      { id: 'A1', label: 'Kondisi Pintu' },
      { id: 'A2', label: 'Kondisi Gasket (Karet Pintu)' },
      { id: 'A3', label: 'Kondisi Body' },
      { id: 'A4', label: 'Kondisi Roda' },
      { id: 'A5', label: 'Kondisi Lampu' },
    ]
  },
  {
    category: 'B. Sistem Pendingin & Mekanikal',
    items: [
      { id: 'B1', label: 'Kondisi Kondensor' },
      { id: 'B2', label: 'Kondisi Fan Kondensor' },
      { id: 'B3', label: 'Kondisi Filter Kondensor' },
      { id: 'B4', label: 'Kondisi Evaporator' },
      { id: 'B5', label: 'Kondisi Fan Evaporator' },
      { id: 'B6', label: 'Kondisi Kompressor' },
      { id: 'B7', label: 'Kondisi Thermostat / Pengatur Suhu' },
      { id: 'B8', label: 'Kondisi Honey Comb' },
    ]
  }
]

export default function ChillerFormView({ 
  store, 
  userNik, 
  userNama, 
  onBack 
}: { 
  store: any, 
  userNik: string, 
  userNama: string, 
  onBack: () => void 
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State Spesifikasi Unit
  const [specsData, setSpecsData] = useState({
    merk_mesin: '',
    jenis_mesin: '',
    suhu_tercatat: '',
    status_tagging: 'MEMILIKI TAGGING',
    scan_tagging: '',
    status_unit: 'NORMAL',
    keterangan_unit: ''
  })

  // State Jawaban Sub-Item (Kondisi, Nilai, Keterangan, Foto)
  const [answers, setAnswers] = useState<Record<string, { 
    status?: string; 
    nilai?: number; 
    keterangan?: string; 
    fotoFile?: File; 
    fotoName?: string; 
    fotoPreview?: string 
  }>>({})

  const handleSpecsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setSpecsData({ ...specsData, [e.target.name]: e.target.value })
  }

  // Handle Radio Option & Set Default Nilai Slider
  const handleRadioChange = (itemId: string, value: string) => {
    let defaultNilai = 100
    if (value === 'RUSAK MASIH DAPAT DIGUNAKAN') defaultNilai = 70
    if (value === 'RUSAK TIDAK DAPAT DIGUNAKAN') defaultNilai = 0

    setAnswers(prev => ({ 
      ...prev, 
      [itemId]: { ...prev[itemId], status: value, nilai: defaultNilai } 
    }))
  }

  const handleNilaiChange = (itemId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: { ...prev[itemId], nilai: value } }))
  }

  const handleKeteranganChange = (itemId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [itemId]: { ...prev[itemId], keterangan: value } }))
  }

  const handleFileChange = (itemId: string, file: File | null) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAnswers(prev => ({ 
      ...prev, 
      [itemId]: { ...prev[itemId], fotoFile: file, fotoName: file.name, fotoPreview: preview } 
    }))
  }

  // Upload Foto per Sub-Item ke Storage Supabase
  const uploadFoto = async (supabase: any, itemId: string, file: File, storeKode: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `chiller/${storeKode}/${itemId}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('chiller_photos').upload(path, file, { upsert: true })
    if (error) { 
      console.error('Upload foto error:', error)
      return null 
    }
    const { data } = supabase.storage.from('chiller_photos').getPublicUrl(path)
    return data?.publicUrl ?? null
  }

  // Submit Ke Supabase
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      // 1. Kalkulasi Nilai Akhir
      const answeredItems = Object.values(answers).filter(a => a.nilai !== undefined)
      const totalSkor = answeredItems.reduce((acc, curr) => acc + (curr.nilai || 0), 0)
      const nilaiAkhir = answeredItems.length > 0 ? Math.round(totalSkor / 13) : 0

      // 2. Insert ke Tabel Induk (chiller_submissions)
      const { data: submission, error: subErr } = await supabase
        .from('chiller_submissions')
        .insert([{
          nik: userNik,
          nama_pic: userNama,
          kode_toko: store?.kode,
          nama_toko: store?.nama,
          kode_branch: store?.branch_code || '',
          nama_branch: store?.branch_name || '',
          merk_mesin: specsData.merk_mesin,
          jenis_mesin: specsData.jenis_mesin,
          suhu_tercatat: parseFloat(specsData.suhu_tercatat) || 0,
          status_tagging: specsData.status_tagging,
          scan_tagging: specsData.scan_tagging,
          status_unit: specsData.status_unit,
          keterangan_unit: specsData.keterangan_unit,
          nilai_akhir: nilaiAkhir
        }])
        .select('id')
        .single()

      if (subErr) throw subErr

      // 3. Upload Foto & Insert Details per Item
      const itemInserts = []
      for (const [itemId, ans] of Object.entries(answers)) {
        let fotoUrl: string | null = null
        if (ans.fotoFile) {
          fotoUrl = await uploadFoto(supabase, itemId, ans.fotoFile, store?.kode)
        }
        itemInserts.push({
          submission_id: submission.id,
          item_id: itemId,
          item_label: itemId,
          kondisi: ans.status ?? 'Belum Diisi',
          skor: ans.nilai ?? 0,
          keterangan: ans.keterangan ?? '',
          foto_url: fotoUrl
        })
      }

      if (itemInserts.length > 0) {
        const { error: detailErr } = await supabase.from('chiller_item_details').insert(itemInserts)
        if (detailErr) throw detailErr
      }

      alert('Form Checklist Equipment Pendingin berhasil dikirim!')
      onBack()
    } catch (err: any) {
      console.error(err)
      alert('Gagal mengirim form: ' + (err.message || JSON.stringify(err)))
    } finally {
      setIsSubmitting(false)
    }
  }

  const section = chillerTemplate[currentStep]
  const isLastStep = currentStep === chillerTemplate.length - 1

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-20 font-sans"
    >
      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 border-t-8 border-t-[#cc1e2c] relative">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#cc1e2c] text-xs font-bold mb-4 transition-colors">
          <ArrowLeft size={16} /> Kembali
        </button>
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">INSPEKSI MESIN PENDINGIN (CHILLER & FREEZER)</h1>
        <p className="text-gray-500 text-sm mb-6">
          Checklist Equipment Pendingin untuk Toko: <span className="font-bold text-gray-800">{store?.nama} ({store?.kode})</span>
        </p>

        {/* IDENTITAS (AUTOMATIC & READ ONLY) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-800">
          <div>
            <span className="block text-gray-400 font-bold uppercase">NIK</span>
            <span className="font-bold text-gray-900 text-sm">{userNik || '-'}</span>
          </div>
          <div>
            <span className="block text-gray-400 font-bold uppercase">Nama PIC</span>
            <span className="font-bold text-gray-900 text-sm">{userNama || '-'}</span>
          </div>
          <div>
            <span className="block text-gray-400 font-bold uppercase">Kode Toko</span>
            <span className="font-bold text-gray-900 text-sm">{store?.kode || '-'}</span>
          </div>
          <div>
            <span className="block text-gray-400 font-bold uppercase">Nama Toko</span>
            <span className="font-bold text-gray-900 text-sm">{store?.nama || '-'}</span>
          </div>
        </div>
      </div>

      {/* NAVIGASI STEP TAB */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-2">
        {chillerTemplate.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentStep === idx ? 'bg-[#cc1e2c] text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s.category}
          </button>
        ))}
      </div>

      {/* CONTENT STEP */}
      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-[#f8fafc] px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          {section.isSpecsStep ? <Thermometer size={20} className="text-[#cc1e2c]" /> : <Wrench size={20} className="text-[#cc1e2c]" />}
          <h3 className="font-bold text-lg text-gray-800">{section.category}</h3>
        </div>

        {/* STEP 1: INPUT SPESIFIKASI MESIN */}
        {section.isSpecsStep ? (
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Merk Mesin <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="merk_mesin" 
                value={specsData.merk_mesin} 
                onChange={handleSpecsChange} 
                placeholder="Ex: PANASONIC SAR-CD361" 
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Jenis Mesin <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="jenis_mesin" 
                  value={specsData.jenis_mesin} 
                  onChange={handleSpecsChange} 
                  placeholder="Ex: OPEN CHILLER" 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Suhu Tercatat (°C) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="suhu_tercatat" 
                  value={specsData.suhu_tercatat} 
                  onChange={handleSpecsChange} 
                  placeholder="Ex: 5.00" 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Status Tagging</label>
                <select 
                  name="status_tagging" 
                  value={specsData.status_tagging} 
                  onChange={handleSpecsChange} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]"
                >
                  <option value="MEMILIKI TAGGING">Memiliki Tagging</option>
                  <option value="TIDAK ADA TAGGING">Tidak Ada Tagging</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Scan Tagging / SN</label>
                <input 
                  type="text" 
                  name="scan_tagging" 
                  value={specsData.scan_tagging} 
                  onChange={handleSpecsChange} 
                  placeholder="Ex: S/UC82/1509/126" 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]" 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Status Unit Keseluruhan</label>
                <select 
                  name="status_unit" 
                  value={specsData.status_unit} 
                  onChange={handleSpecsChange} 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="ABNORMAL">ABNORMAL / RUSAK</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Keterangan Tambahan Unit</label>
                <textarea 
                  rows={2} 
                  name="keterangan_unit" 
                  value={specsData.keterangan_unit} 
                  onChange={handleSpecsChange} 
                  placeholder="Catatan umum mengenai kondisi mesin..." 
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c] resize-none" 
                />
              </div>
            </div>
          </div>
        ) : (

          /* CHECKLIST ITEM PER CATEGORY */
          <div className="divide-y divide-gray-100">
            {section.items?.map((item) => {
              const currentAnswer = answers[item.id] || {}
              const status = currentAnswer.status

              return (
                <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <p className="font-semibold text-gray-800 mb-4">{item.id}. {item.label} <span className="text-red-500">*</span></p>

                  {/* RADIO SELECTION */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    {['BAIK', 'RUSAK MASIH DAPAT DIGUNAKAN', 'RUSAK TIDAK DAPAT DIGUNAKAN'].map((opt) => (
                      <label 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          status === opt ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${status === opt ? 'border-[#cc1e2c]' : 'border-gray-300'}`}>
                          {status === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#cc1e2c]" />}
                        </div>
                        <span className={`text-sm font-medium ${status === opt ? 'text-[#cc1e2c] font-bold' : 'text-gray-700'}`}>{opt}</span>
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

                  {/* RANGE SLIDER NILAI */}
                  <AnimatePresence>
                    {status && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 bg-blue-50/50 p-5 rounded-xl border border-blue-100"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nilai Kondisi (Kelipatan 5)</label>
                          <span className="text-xl font-black text-[#0c539a]">{currentAnswer.nilai ?? 0}</span>
                        </div>
                        
                        {status === 'BAIK' && (
                          <input 
                            type="range" min="80" max="100" step="5" 
                            value={currentAnswer.nilai ?? 100}
                            onChange={(e) => handleNilaiChange(item.id, parseInt(e.target.value))}
                            className="w-full accent-[#0c539a] cursor-pointer"
                          />
                        )}
                        
                        {status === 'RUSAK MASIH DAPAT DIGUNAKAN' && (
                          <input 
                            type="range" min="50" max="70" step="5" 
                            value={currentAnswer.nilai ?? 70}
                            onChange={(e) => handleNilaiChange(item.id, parseInt(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        )}
                        
                        {status === 'RUSAK TIDAK DAPAT DIGUNAKAN' && (
                          <input 
                            type="range" min="0" max="50" step="5" 
                            value={currentAnswer.nilai ?? 0}
                            onChange={(e) => handleNilaiChange(item.id, parseInt(e.target.value))}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        )}

                        <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2">
                          <span>Min: {status === 'BAIK' ? 80 : status === 'RUSAK MASIH DAPAT DIGUNAKAN' ? 50 : 0}</span>
                          <span>Max: {status === 'BAIK' ? 100 : status === 'RUSAK MASIH DAPAT DIGUNAKAN' ? 70 : 50}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* KETERANGAN & UPLOAD FOTO PER ITEM */}
                  <div className="space-y-4 pt-2 border-t border-gray-100 mt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan Detail</label>
                      <textarea 
                        rows={2}
                        placeholder="Tuliskan catatan kondisi item..."
                        value={currentAnswer.keterangan || ''}
                        onChange={(e) => handleKeteranganChange(item.id, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Foto Sub-Item</label>
                      <label className="w-full border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-xl p-4 flex flex-col justify-center items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer group">
                        {currentAnswer.fotoPreview ? (
                          <div className="w-full">
                            <img src={currentAnswer.fotoPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg mb-2" />
                            <div className="flex items-center gap-2 text-emerald-600 justify-center">
                              <CheckCircle size={16} />
                              <span className="text-xs font-semibold truncate">{currentAnswer.fotoName}</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Camera size={24} className="text-gray-400 group-hover:text-[#cc1e2c] transition-colors" />
                            <span className="text-gray-600 text-sm font-medium">Klik untuk upload foto item ini</span>
                            <span className="text-xs text-gray-400">JPG, PNG, HEIC — maks 10MB</span>
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
        )}
      </motion.div>

      {/* FOOTER BUTTONS */}
      <div className="flex justify-between items-center gap-4 mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <button 
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} 
          disabled={currentStep === 0}
          className={`px-6 py-3 font-bold rounded-xl transition-colors ${
            currentStep === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sebelumnya
        </button>

        {!isLastStep ? (
          <button 
            onClick={() => setCurrentStep(Math.min(chillerTemplate.length - 1, currentStep + 1))} 
            className="px-8 py-3 bg-[#cc1e2c] text-white font-bold rounded-xl hover:bg-red-800 transition-colors shadow-sm"
          >
            Selanjutnya
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#0c539a] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Form'}
          </button>
        )}
      </div>
    </motion.div>
  )
}