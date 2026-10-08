'use client'

import React, { useState, useEffect } from 'react'
import { CalendarDays, Lock, Unlock, Plus, Loader2, Check } from 'lucide-react'
import { motion } from 'framer-motion'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function PeriodManagementView() {
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())

  const fetchPeriods = async () => {
    setLoading(true)
    try {
      const { createClient } = await import('@/frontend/supabase/client')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('periods')
        .select('*')
        .eq('year', year)
        .order('month', { ascending: true })
      
      if (error) {
        console.error("Error fetch periods:", error)
        if (error.code === '42P01') {
           console.warn("Tabel 'periods' belum ada di database.")
        }
      } else {
        setPeriods(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPeriods() }, [year])

  const togglePeriod = async (month: number, currentOpen: boolean) => {
    const key = `${year}-${month}`
    setSaving(key)
    try {
      const { createClient } = await import('@/frontend/supabase/client')
      const supabase = createClient()
      const existing = periods.find(p => p.month === month)

      if (existing) {
        const { error } = await supabase.from('periods').update({ is_open: !currentOpen }).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('periods').insert({ year, month, is_open: true })
        if (error) throw error
      }
      await fetchPeriods()
    } catch (e: any) {
      console.error(e)
      alert(`Gagal mengubah status periode: ${e.message || 'Pastikan tabel periods sudah dibuat di Supabase.'}`)
    } finally {
      setSaving(null)
    }
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-[#cc1e2c]" size={28} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Manajemen Periode</h2>
              <p className="text-sm text-gray-500">Atur bulan mana yang bisa diakses untuk pengisian form</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear(y => y - 1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold transition"
            >
              ‹
            </button>
            <span className="text-lg font-bold text-gray-800 px-3">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold transition"
            >
              ›
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="text-blue-500 mt-0.5">ℹ️</div>
          <p className="text-sm text-blue-700">
            Hanya periode yang <strong>dibuka</strong> (🔓) yang dapat diakses teknisi untuk mengisi form checklist dan DPM. 
            Bulan berjalan secara otomatis terbuka jika belum ada pengaturan.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={32} className="animate-spin mr-3" /> Memuat...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MONTHS.map((monthName, idx) => {
              const monthNum = idx + 1
              const period = periods.find(p => p.month === monthNum)
              const isCurrentMonth = monthNum === currentMonth && year === currentYear
              const isOpen = period ? period.is_open : isCurrentMonth
              const key = `${year}-${monthNum}`
              const isSaving = saving === key
              const isFuture = year > currentYear || (year === currentYear && monthNum > currentMonth)

              return (
                <motion.div
                  key={monthNum}
                  whileHover={{ scale: 1.02 }}
                  className={`relative rounded-xl border-2 p-5 transition-all ${
                    isOpen
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  } ${isCurrentMonth ? 'ring-2 ring-[#cc1e2c] ring-offset-2' : ''}`}
                >
                  {isCurrentMonth && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#cc1e2c] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Bulan ini
                    </span>
                  )}
                  <div className="text-center mb-3">
                    <p className="font-bold text-gray-700">{monthName}</p>
                    <p className="text-xs text-gray-400">{year}</p>
                  </div>
                  
                  <div className="flex justify-center mb-3">
                    {isOpen ? (
                      <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold">
                        <Unlock size={16} /> Terbuka
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                        <Lock size={16} /> Tertutup
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => togglePeriod(monthNum, isOpen)}
                    disabled={isSaving}
                    className={`w-full py-2 rounded-lg text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                      isOpen
                        ? 'bg-red-100 text-[#cc1e2c] hover:bg-red-200'
                        : 'bg-[#0c539a] text-white hover:bg-blue-800'
                    } disabled:opacity-50`}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isOpen ? (
                      <><Lock size={14} /> Tutup</>
                    ) : (
                      <><Unlock size={14} /> Buka Akses</>
                    )}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
