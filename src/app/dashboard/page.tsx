import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HODashboard from './HODashboard'
import ManagerDashboard from './ManagerDashboard'
import WaitingRoomPage from './WaitingRoomPage'

function normalizeRole(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, '_')
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const metadata = user.user_metadata || {}
  const nik = metadata.nik || user.email?.split('@')[0]
  const rawRole = metadata.role || 'unknown'
  const role = normalizeRole(rawRole)

  // Ambil status terbaru dari tabel profiles (lebih akurat dari metadata)
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', user.id)
    .single()

  // Gunakan status dari profiles, fallback ke metadata
  const status = profile?.status ?? metadata.status ?? 'pending'
  const activeRole = profile?.role ? normalizeRole(profile.role) : role

  // ── Superadmin & legacy HO → HODashboard ─────────────────────────────────
  if (activeRole === 'superadmin' || activeRole === 'ho') {
    return <HODashboard nik={nik} metadata={{ ...metadata, role: activeRole }} />
  }

  // ── User pending → Waiting Room ───────────────────────────────────────────
  if (status === 'pending') {
    return <WaitingRoomPage nik={nik} role={activeRole} />
  }

  // ── Admin / Manager Cabang ─────────────────────────────────────────────────
  if (activeRole === 'admin' || activeRole === 'manager_cabang') {
    return <ManagerDashboard nik={nik} metadata={{ ...metadata, role: activeRole }} />
  }

  // ── Koordinator Cabang, BMT, Estimator (sementara → ManagerDashboard) ─────
  if (['koordinator_cabang', 'bmt', 'estimator'].includes(activeRole)) {
    return <ManagerDashboard nik={nik} metadata={{ ...metadata, role: activeRole }} />
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  const formatRole = (r: string) =>
    r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md text-center border border-gray-100">
        <h1 className="text-2xl font-bold text-[#0c539a] mb-4">Dashboard</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6 text-left">
          <p className="text-amber-800 font-bold text-sm mb-1">⚠ Role belum terdaftar</p>
          <p className="text-amber-700 text-sm">Role <strong>{formatRole(activeRole)}</strong> belum memiliki dashboard. Hubungi admin.</p>
        </div>
        <div className="bg-blue-50 text-blue-900 rounded-lg p-4 mb-6 text-left border border-blue-100">
          <p className="font-medium mb-1"><span className="text-blue-500">NIK:</span> {nik}</p>
          <p className="font-medium"><span className="text-blue-500">Role:</span> {formatRole(activeRole)}</p>
        </div>
        <form action={async () => {
          'use server'
          const supabase = await createClient()
          await supabase.auth.signOut()
          redirect('/login')
        }}>
          <button type="submit" className="text-red-500 hover:text-red-700 font-medium">Sign Out</button>
        </form>
      </div>
    </div>
  )
}
