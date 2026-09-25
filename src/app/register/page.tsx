'use client'

import { useState, Suspense } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { register } from './actions'
import { useSearchParams } from 'next/navigation'

const ROLES = [
  { value: 'manager_cabang', label: 'Manager Cabang' },
  { value: 'koordinator_cabang', label: 'Koordinator Cabang' },
  { value: 'bmt', label: 'BMT' },
  { value: 'estimator', label: 'Estimator' },
]

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col justify-center items-center px-6 py-10 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-10">
        {/* Logo */}
        <div className="flex justify-center items-center mb-8">
          <div className="bg-red-600 text-white font-bold text-3xl w-10 h-10 flex items-center justify-center rounded-sm mr-2 italic">A</div>
          <h1 className="text-[#0c539a] text-4xl font-bold tracking-tight">Alfamid<span className="text-red-600">i</span></h1>
        </div>

        <p className="text-center text-sm text-gray-500 mb-6">
          Setelah registrasi, akun Anda akan diverifikasi oleh HQ terlebih dahulu.
        </p>

        <form action={register} className="space-y-5">
          {error && <p className="text-red-500 text-sm text-center bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="block text-[#0c539a] font-semibold text-sm">Nama Lengkap</label>
            <input
              type="text"
              name="full_name"
              required
              placeholder="Nama sesuai ID karyawan"
              className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0c539a] text-gray-800 placeholder-blue-300"
            />
          </div>

          {/* NIK */}
          <div className="space-y-1.5">
            <label className="block text-[#0c539a] font-semibold text-sm">NIK (10 Digit)</label>
            <input
              type="text"
              name="nik"
              required
              pattern="[0-9]{10}"
              maxLength={10}
              minLength={10}
              title="NIK harus tepat 10 digit angka"
              placeholder="1234567890"
              className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0c539a] text-gray-800 placeholder-blue-300"
              onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '') }}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="block text-[#0c539a] font-semibold text-sm">Jabatan / Role</label>
            <select
              name="role"
              required
              className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0c539a] text-gray-800 bg-white"
              defaultValue=""
            >
              <option value="" disabled>Pilih jabatan Anda</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[#0c539a] font-semibold text-sm">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="***************"
                className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0c539a] text-gray-800 placeholder-blue-300 pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-[#0c539a] font-semibold text-sm">Konfirmasi Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              placeholder="***************"
              className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0c539a] text-gray-800 placeholder-blue-300"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1c64a5] hover:bg-[#154d80] text-white font-semibold py-3 rounded-xl transition-colors duration-200 mt-2"
          >
            Daftar
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Sudah punya akun? <a href="/login" className="text-[#1c64a5] font-semibold hover:underline">Login</a>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
