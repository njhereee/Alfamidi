'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function register(formData: FormData) {
  const supabase = await createClient()

  const nik = formData.get('nik') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const role = formData.get('role') as string

  if (!nik || !password || !role) {
      return redirect('/register?error=All fields are required')
  }
  
  if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      return redirect('/register?error=NIK harus tepat 16 digit angka')
  }
  
  if (password !== confirmPassword) {
      return redirect('/register?error=Password tidak cocok')
  }

  // Supabase validasi email kadang menolak domain non-standar.
  // Gunakan @alfamidi.com agar validasinya lolos.
  const email = `${nik}@alfamidi.com`

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nik,
        role,
      }
    }
  })

  if (error) {
    return redirect('/register?error=' + encodeURIComponent(error.message))
  }

  return redirect('/login?message=Registration successful! Please login.')
}
