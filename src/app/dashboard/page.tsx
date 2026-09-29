import { signOut } from '@/backend/actions/auth'
import { requireDashboardSession } from '@/backend/services/dashboardSession'
import HODashboard from '@/frontend/dashboard/HODashboard'
import ManagerDashboard from '@/frontend/dashboard/ManagerDashboard'
import BMTDashboard from '@/frontend/dashboard/BMTDashboard'
import WaitingRoomPage from '@/frontend/dashboard/WaitingRoomPage'

export default async function DashboardPage() {
  const { nik, metadata, status, activeRole } = await requireDashboardSession()

  if (activeRole === 'superadmin' || activeRole === 'ho') {
    return <HODashboard nik={nik} metadata={metadata} />
  }

  if (status === 'pending') {
    return <WaitingRoomPage nik={nik} role={activeRole} />
  }

  if (activeRole === 'admin' || activeRole === 'manager_cabang') {
    return <ManagerDashboard nik={nik} metadata={metadata} />
  }

  if (['koordinator_cabang', 'estimator'].includes(activeRole)) {
    return <ManagerDashboard nik={nik} metadata={metadata} />
  }

  if (activeRole === 'bmt') {
    return <BMTDashboard nik={nik} metadata={metadata} />
  }

  const formatRole = (r: string) =>
    r.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md text-center border border-gray-100">
        <h1 className="text-2xl font-bold text-[#0c539a] mb-4">Dashboard</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6 text-left">
          <p className="text-amber-800 font-bold text-sm mb-1">⚠ Role belum terdaftar</p>
          <p className="text-amber-700 text-sm">
            Role <strong>{formatRole(activeRole)}</strong> belum memiliki dashboard. Hubungi admin.
          </p>
        </div>
        <div className="bg-blue-50 text-blue-900 rounded-lg p-4 mb-6 text-left border border-blue-100">
          <p className="font-medium mb-1">
            <span className="text-blue-500">NIK:</span> {nik}
          </p>
          <p className="font-medium">
            <span className="text-blue-500">Role:</span> {formatRole(activeRole)}
          </p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-red-500 hover:text-red-700 font-medium">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
