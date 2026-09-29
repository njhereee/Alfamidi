import { createClient } from '@/backend/supabase/server'
import { redirect } from 'next/navigation'

export function normalizeRole(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, '_')
}

export type DashboardSession = {
  nik: string
  metadata: Record<string, unknown>
  status: string
  activeRole: string
}

export async function getDashboardSession(): Promise<DashboardSession | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const metadata = (user.user_metadata || {}) as Record<string, unknown>
  const nik = (metadata.nik as string) || user.email?.split('@')[0] || ''
  const rawRole = (metadata.role as string) || 'unknown'
  const role = normalizeRole(rawRole)

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', user.id)
    .single()

  const status =
    (profile?.status as string) ?? (metadata.status as string) ?? 'pending'
  const activeRole = profile?.role
    ? normalizeRole(profile.role as string)
    : role

  return {
    nik,
    metadata: { ...metadata, role: activeRole },
    status,
    activeRole,
  }
}

export async function requireDashboardSession(): Promise<DashboardSession> {
  const session = await getDashboardSession()
  if (!session) redirect('/login')
  return session
}
