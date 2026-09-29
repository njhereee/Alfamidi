'use server'

import { createClient } from '@/backend/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const nik = formData.get('nik') as string
  const password = formData.get('password') as string

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

export async function register(formData: FormData) {
  const supabase = await createClient()

  const nik = formData.get('nik') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const role = formData.get('role') as string
  const fullName = formData.get('full_name') as string

  if (!nik || !password || !role || !fullName) {
    return redirect('/register?error=Semua field wajib diisi')
  }

  if (nik.length !== 10 || !/^\d+$/.test(nik)) {
    return redirect('/register?error=NIK harus tepat 10 digit angka')
  }

  if (password !== confirmPassword) {
    return redirect('/register?error=Password tidak cocok')
  }

  const email = `${nik}@alfamidi.com`

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nik,
        role,
        full_name: fullName,
        status: 'pending',
      },
    },
  })

  if (error) {
    return redirect('/register?error=' + encodeURIComponent(error.message))
  }

  if (signUpData.user) {
    await supabase.from('profiles').upsert({
      id: signUpData.user.id,
      nik,
      role,
      full_name: fullName,
      status: 'pending',
    })
  }

  return redirect(
    '/login?message=Registrasi berhasil! Silakan login. Akun Anda akan diaktifkan setelah verifikasi.'
  )
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
