import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, MapPin } from 'lucide-react'

interface DPMFormViewProps {
  store: any
  userNik?: string
  nik?: string
  userNama?: string
  metadata?: any
  onBack: () => void
}

const RUTIN_OPTIONS = [
  'Checklist Equipment',
  'Cleaning',
  'Mengerjakan Tema Bulanan',
  'Lainnya'
]

const NON_RUTIN_OPTIONS = [
  'Perbaikan Handle Folding Gate',
  'Perbaikan Pompa',
  'Perbaikan Keramik Lantai',
  'Lainnya'
]

export default function DPMFormView({ store, userNik, nik, userNama, metadata, onBack }: DPMFormViewProps) {
  const finalNik = nik || userNik || ''
  const finalName = metadata?.full_name || userNama || ''
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [pekerjaanRutin, setPekerjaanRutin] = useState('')
  const [showRutinDropdown, setShowRutinDropdown] = useState(false)
  const [pekerjaanRutinLainnya, setPekerjaanRutinLainnya] = useState('')
  
  const [pekerjaanNonRutin, setPekerjaanNonRutin] = useState('')
  const [showNonRutinDropdown, setShowNonRutinDropdown] = useState(false)
  const [pekerjaanNonRutinLainnya, setPekerjaanNonRutinLainnya] = useState('')

  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationLoading(false)
        },
        (err) => {
          console.error("Gagal mendapatkan lokasi:", err)
          setLocationLoading(false)
          setLocation({ lat: -7.084822, lng: 110.361226 })
        }
      )
    } else {
      setLocationLoading(false)
      setLocation({ lat: -7.084822, lng: 110.361226 })
    }
  }, [])

  const handleSave = async () => {
    if (!tanggal || !pekerjaanRutin || !pekerjaanNonRutin) {
      alert("Harap lengkapi semua field yang wajib (*)")
      return
    }

    try {
      const { createClient } = await import('@/frontend/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      let submitPayload: any = {
        store_kode: store?.kodeToko || store?.kode,
        branch: store?.branch || 'MIDI BOYOLALI',
        nik_teknisi: finalNik,
        nama_lengkap: finalName,
        wilayah_coor: store?.nama_bmt || store?.namaPic || 'A8',
        tanggal_kunjungan: tanggal,
        pekerjaan_rutin: pekerjaanRutin,
        pekerjaan_rutin_lainnya: pekerjaanRutin === 'Lainnya' ? pekerjaanRutinLainnya : null,
        pekerjaan_non_rutin: pekerjaanNonRutin,
        pekerjaan_non_rutin_lainnya: pekerjaanNonRutin === 'Lainnya' ? pekerjaanNonRutinLainnya : null,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        submitted_by: user?.id
      }
      if (store?.selectedPeriod) {
        const dateOverride = new Date(store.selectedPeriod.year, store.selectedPeriod.month - 1, 15).toISOString()
        submitPayload.created_at = dateOverride
        submitPayload.submitted_at = dateOverride
      }

      const { error } = await supabase.from('dpm_submissions').insert(submitPayload)

      if (error) {
        console.error("Gagal simpan DPM:", error)
        alert("Terjadi kesalahan saat menyimpan data. Pastikan tabel dpm_submissions sudah ada di database.")
        return
      }

      alert("Data DPM berhasil disimpan")
      onBack()
    } catch (e) {
      console.error(e)
      alert("Terjadi kesalahan sistem.")
    }
  }
  const headerDateParts = tanggal.split('-')
  const headerDate = headerDateParts.length === 3 ? `${headerDateParts[2]}/${headerDateParts[1]}/${headerDateParts[0]}` : tanggal

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto flex flex-col">
      
      <div className="sticky top-0 bg-white z-40 px-4 md:px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 transition-colors">
            <X size={24} />
          </button>
          <span className="text-lg md:text-xl font-medium text-gray-800">{headerDate}</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onBack}
            className="px-4 md:px-5 py-1.5 md:py-2 rounded border border-[#e1251b] text-[#e1251b] font-medium hover:bg-red-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 md:px-6 py-1.5 md:py-2 rounded bg-[#e1251b] text-white font-medium hover:bg-red-700 transition-colors text-sm"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 pb-24">
        <div className="space-y-6">

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Kode Toko<span className="text-[#e1251b] ml-1">*</span></label>
            <input 
              type="text" 
              disabled
              value={store?.kodeToko || store?.kode || ''} 
              className="w-full border border-gray-200 rounded p-3 text-gray-500 bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Nama Toko<span className="text-[#e1251b] ml-1">*</span></label>
            <input 
              type="text" 
              disabled
              value={store?.namaToko || store?.nama || ''} 
              className="w-full border border-gray-200 rounded p-3 text-gray-500 bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 block">Branch<span className="text-[#e1251b] ml-1">*</span></label>
            <div className="inline-block border border-gray-300 rounded-full px-5 py-2 text-sm font-medium text-gray-800 bg-white">
              {store?.branch || 'MIDI BOYOLALI'}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">NIK<span className="text-[#e1251b] ml-1">*</span></label>
            <input 
              type="text" 
              disabled
              value={finalNik} 
              className="w-full border border-gray-200 rounded p-3 text-gray-500 bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Wilayah Coor<span className="text-[#e1251b] ml-1">*</span></label>
            <input 
              type="text" 
              disabled
              value={store?.nama_bmt || store?.namaPic || 'A8'} 
              className="w-full border border-gray-200 rounded p-3 text-gray-500 bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Tanggal Kunjungan<span className="text-[#e1251b] ml-1">*</span></label>
            <input 
              type="date" 
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full border border-gray-400 rounded p-3 text-gray-800 bg-white focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Pekerjaan Rutin<span className="text-[#e1251b] ml-1">*</span></label>
            <div className="relative">
              <div 
                onClick={() => setShowRutinDropdown(!showRutinDropdown)}
                className={`w-full border rounded p-3 bg-white flex items-center justify-between cursor-pointer ${showRutinDropdown || pekerjaanRutin ? 'border-[#e1251b] border-2' : 'border-gray-400 hover:border-gray-500'}`}
              >
                {pekerjaanRutin ? (
                  <span className="text-gray-800 font-medium bg-red-100 px-1 rounded">{pekerjaanRutin}</span>
                ) : (
                  <span className="text-gray-400">Pilih Pekerjaan Rutin</span>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  {pekerjaanRutin && (
                    <button 
                      className="hover:text-gray-800 p-0.5" 
                      onClick={(e) => { e.stopPropagation(); setPekerjaanRutin(''); setPekerjaanRutinLainnya(''); }}
                    >
                      <X size={18} />
                    </button>
                  )}
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transform transition-transform ${showRutinDropdown ? 'rotate-180' : ''}`}>
                    <path d="M1.41 0.589966L6 5.16997L10.59 0.589966L12 1.99997L6 7.99997L0 1.99997L1.41 0.589966Z" fill="#666666"/>
                  </svg>
                </div>
              </div>
              
              {showRutinDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 py-2">
                  {RUTIN_OPTIONS.map(opt => (
                    <div 
                      key={opt}
                      onClick={() => { setPekerjaanRutin(opt); setShowRutinDropdown(false); }}
                      className={`px-5 py-3 cursor-pointer text-gray-800 hover:bg-gray-100 ${pekerjaanRutin === opt ? 'bg-gray-50' : ''}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {pekerjaanRutin === 'Lainnya' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Pekerjaan Rutin Lainnya<span className="text-[#e1251b] ml-1">*</span></label>
              <input 
                type="text" 
                value={pekerjaanRutinLainnya}
                onChange={(e) => setPekerjaanRutinLainnya(e.target.value)}
                className="w-full border border-gray-400 rounded p-3 text-gray-800 bg-white focus:outline-none focus:border-gray-500" 
              />
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Pekerjaan Non Rutin<span className="text-[#e1251b] ml-1">*</span></label>
            <div className="relative">
              <div 
                onClick={() => setShowNonRutinDropdown(!showNonRutinDropdown)}
                className={`w-full border rounded p-3 bg-white flex items-center justify-between cursor-pointer ${showNonRutinDropdown || pekerjaanNonRutin ? 'border-[#e1251b] border-2' : 'border-gray-400 hover:border-gray-500'}`}
              >
                {pekerjaanNonRutin ? (
                  <span className="text-gray-800 font-medium bg-red-100 px-1 rounded">{pekerjaanNonRutin}</span>
                ) : (
                  <span className="text-gray-400">Pilih Pekerjaan Non Rutin</span>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  {pekerjaanNonRutin && (
                    <button 
                      className="hover:text-gray-800 p-0.5" 
                      onClick={(e) => { e.stopPropagation(); setPekerjaanNonRutin(''); setPekerjaanNonRutinLainnya(''); }}
                    >
                      <X size={18} />
                    </button>
                  )}
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transform transition-transform ${showNonRutinDropdown ? 'rotate-180' : ''}`}>
                    <path d="M1.41 0.589966L6 5.16997L10.59 0.589966L12 1.99997L6 7.99997L0 1.99997L1.41 0.589966Z" fill="#666666"/>
                  </svg>
                </div>
              </div>
              
              {showNonRutinDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 py-2">
                  {NON_RUTIN_OPTIONS.map(opt => (
                    <div 
                      key={opt}
                      onClick={() => { setPekerjaanNonRutin(opt); setShowNonRutinDropdown(false); }}
                      className={`px-5 py-3 cursor-pointer text-gray-800 hover:bg-gray-100 ${pekerjaanNonRutin === opt ? 'bg-gray-50' : ''}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {pekerjaanNonRutin === 'Lainnya' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Pekerjaan Non Rutin Lainnya<span className="text-[#e1251b] ml-1">*</span></label>
              <input 
                type="text" 
                value={pekerjaanNonRutinLainnya}
                onChange={(e) => setPekerjaanNonRutinLainnya(e.target.value)}
                className="w-full border border-gray-400 rounded p-3 text-gray-800 bg-white focus:outline-none focus:border-gray-500" 
              />
            </motion.div>
          )}

          <div className="space-y-2 pt-4">
            <label className="text-sm font-medium text-gray-600">Konfirmasi Lokasi</label>
            <div className="relative">
              <input 
                type="text" 
                disabled
                value={location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : locationLoading ? 'Memuat koordinat...' : 'Gagal memuat koordinat'} 
                className="w-full border border-gray-400 rounded-t p-3 pr-10 text-gray-800 bg-white focus:outline-none border-b-0"
              />
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600" size={20} />
            </div>
            <div className="h-64 w-full border-2 border-[#e1251b] relative bg-gray-200 rounded-b">
              {location ? (
                <iframe 
                  title="Map"
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`}
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">{locationLoading ? 'Mencari lokasi...' : 'Lokasi tidak ditemukan'}</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
