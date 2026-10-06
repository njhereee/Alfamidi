'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, CheckCircle, Zap, Wrench } from 'lucide-react'
import {
  GENSET_FORM_STEPS,
  GENSET_TL_STEPS,
  GENSET_KETERANGAN_OPTIONS,
  GENSET_KONDISI_OPTIONS,
  GENSET_TAGGING_OPTIONS,
  allGensetChecklistItems,
  computeGensetNilaiAkhir,
  scoreFromGensetKondisi,
  tlKeteranganKey,
  tlPhotoKey,
  type GensetTlStep,
} from './gensetChecklistConfig'

type AnswerEntry = {
  status?: string
  nilai?: number
  keterangan?: string
  fotoFile?: File
  fotoName?: string
  fotoPreview?: string
}

export default function GensetFormView({
  store,
  userNik,
  userNama,
  onBack,
}: {
  store: any
  userNik: string
  userNama: string
  onBack: () => void
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [specsData, setSpecsData] = useState({
    no_genset: 'GENSET 1',
    jenis_genset: 'BENSIN',
    status_tagging: '',
    merk_model: '',
    keterangan_unit: '',
  })

  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({})

  const handleSpecsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setSpecsData({ ...specsData, [e.target.name]: e.target.value })
  }

  const setSpecField = (name: keyof typeof specsData, value: string) => {
    setSpecsData((prev) => ({ ...prev, [name]: value }))
  }

  const handleKondisiChange = (itemId: string, value: string) => {
    const nilai = scoreFromGensetKondisi(value)
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], status: value, nilai },
    }))
  }

  const handleTlKeteranganChange = (tlId: string, value: string) => {
    const key = tlKeteranganKey(tlId)
    setAnswers((prev) => ({
      ...prev,
      [key]: { ...prev[key], keterangan: value },
    }))
  }

  const handleFileChange = (key: string, file: File | null) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAnswers((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        fotoFile: file,
        fotoName: file.name,
        fotoPreview: preview,
      },
    }))
  }

  const uploadFoto = async (
    supabase: any,
    itemId: string,
    file: File,
    storeKode: string
  ): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const path = `genset/${storeKode}/${itemId}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('genset-photos').upload(path, file, { upsert: true })
    if (error) {
      console.error('Upload foto error:', error)
      return null
    }
    const { data } = supabase.storage.from('genset-photos').getPublicUrl(path)
    return data?.publicUrl ?? null
  }

  const validateSpecs = (): boolean => {
    if (!specsData.no_genset) {
      alert('Pilih nomor genset.')
      return false
    }
    if (!specsData.jenis_genset) {
      alert('Pilih jenis genset.')
      return false
    }
    if (!specsData.status_tagging) {
      alert('Pilih status tagging.')
      return false
    }
    if (!specsData.merk_model.trim()) {
      alert('Merk / model harus diisi.')
      return false
    }
    return true
  }

  const validateTlStep = (tl: GensetTlStep): boolean => {
    const photoKey = tlPhotoKey(tl.tlId)
    if (!answers[photoKey]?.fotoFile && !answers[photoKey]?.fotoPreview) {
      alert(`Upload foto untuk ${tl.category}.`)
      return false
    }
    for (const item of tl.items) {
      if (!answers[item.id]?.status) {
        alert(`Pilih kondisi OK/NOK untuk: ${item.label}`)
        return false
      }
    }
    const ketKey = tlKeteranganKey(tl.tlId)
    if (!answers[ketKey]?.keterangan) {
      alert(`Pilih keterangan tindak lanjut untuk ${tl.category}.`)
      return false
    }
    return true
  }

  const goNext = () => {
    const section = GENSET_FORM_STEPS[currentStep]
    if (section.isSpecsStep) {
      if (!validateSpecs()) return
    } else if ('tlStep' in section && section.tlStep) {
      if (!validateTlStep(section.tlStep)) return
    }
    setCurrentStep(Math.min(GENSET_FORM_STEPS.length - 1, currentStep + 1))
  }

  const handleSubmit = async () => {
    if (!validateSpecs()) return
    for (const tl of GENSET_TL_STEPS) {
      if (!validateTlStep(tl)) return
    }

    setIsSubmitting(true)
    try {
      const { createClient } = await import('@/frontend/supabase/client')
      const supabase = createClient()

      const checklistItems = allGensetChecklistItems()
      const nilaiAkhir = computeGensetNilaiAkhir(answers)

      let submitPayload: any = {
            nik: userNik,
            nama_pic: userNama,
            kode_branch: store?.branch_code || '',
            nama_branch: store?.branch_name || '',
            store_kode: store?.kode,
            nama_toko: store?.nama,
            no_genset: specsData.no_genset,
            jenis_genset: specsData.jenis_genset,
            merk_model: specsData.merk_model,
            pemanasan_unit: '-',
            status_unit: 'NORMAL',
            keterangan_unit: specsData.keterangan_unit || '',
            nilai_akhir: nilaiAkhir,
      }
      if (store?.selectedPeriod) {
        const dateOverride = new Date(store.selectedPeriod.year, store.selectedPeriod.month - 1, 15).toISOString()
        submitPayload.created_at = dateOverride
        submitPayload.submitted_at = dateOverride
      }

      const { data: submission, error: subErr } = await supabase
        .from('genset_submissions')
        .insert([submitPayload])
        .select('id')
        .single()

      if (subErr) throw subErr

      const labelById = Object.fromEntries(checklistItems.map((i) => [i.id, i.label]))
      const itemInserts: Record<string, unknown>[] = []

      for (const item of checklistItems) {
        const ans = answers[item.id]
        itemInserts.push({
          submission_id: submission.id,
          item_id: item.id,
          item_label: labelById[item.id] ?? item.label,
          kondisi: ans?.status ?? 'Belum Diisi',
          skor: ans?.nilai ?? 0,
          keterangan: '',
          foto_url: null,
        })
      }

      for (const tl of GENSET_TL_STEPS) {
        const photoKey = tlPhotoKey(tl.tlId)
        const ketKey = tlKeteranganKey(tl.tlId)
        const photoAns = answers[photoKey]
        let fotoUrl: string | null = null
        if (photoAns?.fotoFile) {
          fotoUrl = await uploadFoto(supabase, photoKey, photoAns.fotoFile, store?.kode)
        }
        itemInserts.push({
          submission_id: submission.id,
          item_id: photoKey,
          item_label: `${tl.category} — Foto`,
          kondisi: '-',
          skor: 0,
          keterangan: answers[ketKey]?.keterangan ?? '',
          foto_url: fotoUrl,
        })
      }

      if (itemInserts.length > 0) {
        const { error: detailErr } = await supabase.from('genset_item_details').insert(itemInserts)
        if (detailErr) throw detailErr
      }

      alert('Form Checklist Genset berhasil dikirim!')
      onBack()
    } catch (err: any) {
      console.error(err)
      alert('Gagal mengirim form: ' + (err.message || JSON.stringify(err)))
    } finally {
      setIsSubmitting(false)
    }
  }

  const section = GENSET_FORM_STEPS[currentStep]
  const isLastStep = currentStep === GENSET_FORM_STEPS.length - 1
  const tlStep = 'tlStep' in section ? section.tlStep : undefined

  const renderChoiceButtons = (
    label: string,
    name: keyof typeof specsData,
    options: readonly string[],
    required?: boolean
  ) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const selected = specsData[name] === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setSpecField(name, opt)}
              className={`py-3 px-4 rounded-lg border-2 text-sm font-bold transition-all ${
                selected
                  ? 'border-[#cc1e2c] bg-red-50 text-[#cc1e2c]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-20 font-sans"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 border-t-8 border-t-[#cc1e2c] relative">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-[#cc1e2c] text-xs font-bold mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">CHECKLIST MESIN GENSET TOKO</h1>
        <p className="text-gray-500 text-sm mb-6">
          Form Pengecekan Maintenance Genset untuk Toko:{' '}
          <span className="font-bold text-gray-800">
            {store?.nama} ({store?.kode})
          </span>
        </p>

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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-2">
        {GENSET_FORM_STEPS.map((s, idx) => (
          <button
            key={s.category}
            type="button"
            onClick={() => {
              if (idx > 0 && !validateSpecs()) return
              setCurrentStep(idx)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentStep === idx ? 'bg-[#cc1e2c] text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s.category}
          </button>
        ))}
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-[#f8fafc] px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          {section.isSpecsStep ? (
            <Zap size={20} className="text-[#cc1e2c]" />
          ) : (
            <Wrench size={20} className="text-[#cc1e2c]" />
          )}
          <h3 className="font-bold text-lg text-gray-800">{section.category}</h3>
        </div>

        {section.isSpecsStep ? (
          <div className="p-6 space-y-6">
            {renderChoiceButtons('No. Genset', 'no_genset', ['GENSET 1', 'GENSET 2'], true)}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Jenis Genset <span className="text-red-500">*</span>
              </label>
              <select
                name="jenis_genset"
                value={specsData.jenis_genset}
                onChange={handleSpecsChange}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]"
              >
                <option value="BENSIN">BENSIN</option>
                <option value="DIESEL">DIESEL</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Tagging? <span className="text-red-500">*</span>
              </label>
              <select
                name="status_tagging"
                value={specsData.status_tagging}
                onChange={handleSpecsChange}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]"
              >
                <option value="">— Pilih status tagging —</option>
                {GENSET_TAGGING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Merk / Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="merk_model"
                value={specsData.merk_model}
                onChange={handleSpecsChange}
                placeholder="Ex: LONCIN LC8800"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]"
              />
            </div>

            <div className="space-y-1 pt-2 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase">Catatan Keseluruhan (opsional)</label>
              <textarea
                rows={2}
                name="keterangan_unit"
                value={specsData.keterangan_unit}
                onChange={handleSpecsChange}
                placeholder="Catatan umum..."
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c] resize-none"
              />
            </div>
          </div>
        ) : tlStep ? (
          <div className="p-6 space-y-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Upload Foto {tlStep.category} <span className="text-red-500">*</span>
              </label>
              <label className="w-full border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-xl p-4 flex flex-col justify-center items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer group">
                {answers[tlPhotoKey(tlStep.tlId)]?.fotoPreview ? (
                  <div className="w-full">
                    <img
                      src={answers[tlPhotoKey(tlStep.tlId)].fotoPreview}
                      alt="Preview"
                      className="w-full max-h-56 object-cover rounded-lg mb-2"
                    />
                    <div className="flex items-center gap-2 text-emerald-600 justify-center">
                      <CheckCircle size={16} />
                      <span className="text-xs font-semibold truncate">
                        {answers[tlPhotoKey(tlStep.tlId)].fotoName}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera size={24} className="text-gray-400 group-hover:text-[#cc1e2c] transition-colors" />
                    <span className="text-gray-600 text-sm font-medium">Klik untuk upload foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(tlPhotoKey(tlStep.tlId), e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {tlStep.items.map((item) => {
                const currentAnswer = answers[item.id] || {}
                const status = currentAnswer.status
                return (
                  <div key={item.id} className="p-5 bg-white">
                    <p className="font-semibold text-gray-800 mb-3 capitalize">{item.label} <span className="text-red-500">*</span></p>
                    <div className="grid grid-cols-2 gap-3">
                      {GENSET_KONDISI_OPTIONS.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            status === opt ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              status === opt ? 'border-[#cc1e2c]' : 'border-gray-300'
                            }`}
                          >
                            {status === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#cc1e2c]" />}
                          </div>
                          <span
                            className={`text-sm font-bold ${status === opt ? 'text-[#cc1e2c]' : 'text-gray-700'}`}
                          >
                            {opt}
                          </span>
                          <input
                            type="radio"
                            name={item.id}
                            value={opt}
                            className="hidden"
                            onChange={() => handleKondisiChange(item.id, opt)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Keterangan / Tindak Lanjut <span className="text-red-500">*</span>
              </label>
              <select
                value={answers[tlKeteranganKey(tlStep.tlId)]?.keterangan || ''}
                onChange={(e) => handleTlKeteranganChange(tlStep.tlId, e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#cc1e2c]"
              >
                <option value="">— Pilih keterangan —</option>
                {GENSET_KETERANGAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </motion.div>

      <div className="flex justify-between items-center gap-4 mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <button
          type="button"
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
            type="button"
            onClick={goNext}
            className="px-8 py-3 bg-[#cc1e2c] text-white font-bold rounded-xl hover:bg-red-800 transition-colors shadow-sm"
          >
            Selanjutnya
          </button>
        ) : (
          <button
            type="button"
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
