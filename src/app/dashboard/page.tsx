import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HODashboard from './HODashboard'
import ManagerDashboard from './ManagerDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Handle dummy email map to NIK, or use metadata
  const metadata = user.user_metadata || {}
  const nik = metadata.nik || user.email?.split('@')[0]
  const role = metadata.role || 'Unknown'
  
  // Tampilkan dashboard khusus HO jika role-nya adalah 'ho'
  if (role === 'ho') {
    return <HODashboard nik={nik} metadata={metadata} />
  }

  // Tampilkan dashboard khusus Manager Cabang jika role-nya 'manager cabang' (atau 'manager_cabang')
  if (role.toLowerCase() === 'manager cabang' || role.toLowerCase() === 'manager_cabang') {
    return <ManagerDashboard nik={nik} metadata={metadata} />
  }
  
  const formatRole = (r: string) => {
    if (r === 'bmt') return 'BMT';
    if (r === 'ho') return 'HO';
    return r.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md text-center border border-gray-100">
        <h1 className="text-2xl font-bold text-[#0c539a] mb-4">Dashboard</h1>
        <p className="text-gray-600 mb-2">Welcome back!</p>
        
        <div className="bg-blue-50 text-blue-900 rounded-lg p-4 my-6 text-left border border-blue-100">
          <p className="font-medium mb-1"><span className="text-blue-500">NIK:</span> {nik}</p>
          <p className="font-medium"><span className="text-blue-500">Role:</span> <span>{formatRole(role)}</span></p>
        </div>

        <form action={async () => {
          'use server'
          const supabase = await createClient()
          await supabase.auth.signOut()
          redirect('/login')
        }}>
          <button type="submit" className="text-red-500 hover:text-red-700 font-medium">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
