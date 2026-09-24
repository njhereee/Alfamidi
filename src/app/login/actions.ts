'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const nik = formData.get('nik') as string
  const password = formData.get('password') as string

  // We map the NIK to a dummy email for Supabase Auth
  const email = `${nik}@alfamidi.com`

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=' + encodeURIComponent(error.message))
  }

  return redirect('/dashboard')
}
