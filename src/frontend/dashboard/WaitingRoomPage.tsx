'use client'

import { motion } from 'framer-motion'
import { Clock, Phone, RefreshCw } from 'lucide-react'

export default function WaitingRoomPage({ nik, role }: { nik: string; role: string }) {
  const formatRole = (r: string) =>
    r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Bg decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl p-8 z-10 text-center"
      >
        {/* Logo */}
        <div className="flex justify-center items-center mb-8">
          <div className="bg-red-600 text-white font-bold text-2xl w-9 h-9 flex items-center justify-center rounded-sm mr-2 italic">A</div>
          <h1 className="text-[#0c539a] text-3xl font-bold tracking-tight">Alfamid<span className="text-red-600">i</span></h1>
        </div>

        {/* Animated clock icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Clock size={40} className="text-amber-500" />
        </motion.div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">Menunggu Verifikasi</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Akun Anda sedang menunggu verifikasi oleh pihak <strong>Headquarters Alfamidi</strong>. 
          Proses ini biasanya selesai dalam <strong>1×24 jam</strong>.
        </p>

        {/* Info akun */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">NIK</span>
            <span className="font-bold text-gray-800">{nik}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Role Diajukan</span>
            <span className="font-bold text-gray-800">{formatRole(role)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Status</span>
            <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full text-xs">Menunggu Verifikasi</span>
          </div>
        </div>

        {/* Kontak */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Phone size={15} className="text-gray-500" />
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Hubungi HQ jika belum ada perubahan setelah 24 jam</p>
          </div>
          <p className="text-[#0c539a] font-bold text-lg">+62 812-3456-7890</p>
          <p className="text-gray-400 text-xs mt-0.5">Senin – Jumat, 08.00 – 17.00 WIB</p>
        </div>

        {/* Refresh & Sign out */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full bg-[#0c539a] hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <RefreshCw size={16} />
            Cek Status Akun
          </button>
          <a
            href="/auth/signout"
            className="block w-full text-center text-red-500 hover:text-red-700 font-medium text-sm py-2"
          >
            Keluar
          </a>
        </div>
      </motion.div>
    </div>
  )
}
