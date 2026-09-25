'use client'

import React, { useState, useEffect } from 'react'
import { 
  Menu, FileText, Settings2, Snowflake, Zap, 
  Edit, Trash2, Upload, Plus, 
  Home, BookOpen, FileSpreadsheet, BarChart2,
  LogOut, UserCircle, ArrowLeft, UploadCloud, ChevronRight,  Camera,
  Eye,
  EyeOff,
  Search,
  File,
  Bell,
  UserCheck
} from 'lucide-react'
import NextImage from 'next/image'
import RekapDetailView from "./RekapDetailView"
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import RekapView from './RekapView'
import ChecklistDetailView from './ChecklistDetailView'
import FCPTFormView from './FCPTFormView'

const checklistItems = [
  { id: 1, title: 'DPM', icon: <FileText size={36} className="text-[#cc1e2c] mb-3" />, hasActions: false },
  { id: 2, title: 'FCPT', icon: <Settings2 size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
  { id: 3, title: 'Equipment\nPendingin', icon: <Snowflake size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
  { id: 4, title: 'Genset', icon: <Zap size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
]

export default function HODashboard({ nik, metadata }: { nik: string, metadata: any }) {
  const [activeTab, setActiveTab] = useState('Home')
  const [currentView, setCurrentView] = useState<'dashboard' | 'formChecklist' | 'formModul' | 'profile' | 'checklistDetail' | 'fcptForm' | 'rekapDetail'>('dashboard')
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null)
  const [selectedRekapItem, setSelectedRekapItem] = useState<any>(null)
  const [selectedStore, setSelectedStore] = useState<any>(null)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [sahkanTarget, setSahkanTarget] = useState<any>(null)
  const [sahkanRole, setSahkanRole] = useState('')
  const [isSahkan, setIsSahkan] = useState(false)

  // Fetch pending users dari Supabase
  useEffect(() => {
    const fetchPending = async () => {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nik, role, full_name, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .select()
      if (error) console.error('[HODashboard] Fetch pending error:', error.message)
      else console.log('[HODashboard] Pending users:', data?.length ?? 0, data)
      if (data) setPendingUsers(data)
    }
    fetchPending()
  }, [])

  const handleSahkanRole = async () => {
    if (!sahkanTarget || !sahkanRole) return
    setIsSahkan(true)
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ role: sahkanRole, status: 'active' })
      .eq('id', sahkanTarget.id)
      .select()
      
    if (error) {
      console.error('Update role error:', error)
      alert('Gagal mengupdate role. Pastikan Policy RLS di Supabase mengizinkan update.')
      setIsSahkan(false)
      return
    }

    setPendingUsers(prev => prev.filter(u => u.id !== sahkanTarget.id))
    setSahkanTarget(null)
    setSahkanRole('')
    setIsSahkan(false)
  }

  // States untuk form profil
  const [profileImage, setProfileImage] = useState<string | null>(metadata?.avatar_url || null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [fullName, setFullName] = useState(metadata?.full_name || '')
  const [jabatan, setJabatan] = useState(metadata?.jabatan || '')
  const cabang = 'Head Office'
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // State untuk Data Checklist
  const [checklists, setChecklists] = useState<any[]>([])
  
  // State untuk Data Modul
  const [modules, setModules] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // State untuk Form Tambah/Edit Checklist
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [newChecklistName, setNewChecklistName] = useState('')
  const [newChecklistIcon, setNewChecklistIcon] = useState<File | null>(null)
  const [newChecklistIconPreview, setNewChecklistIconPreview] = useState<string | null>(null)
  const [isAddingChecklist, setIsAddingChecklist] = useState(false)

  // State untuk Form Tambah/Edit Modul
  const [editModulId, setEditModulId] = useState<string | null>(null)
  const [newModulName, setNewModulName] = useState('')
  const [newModulIcon, setNewModulIcon] = useState<File | null>(null)
  const [newModulIconPreview, setNewModulIconPreview] = useState<string | null>(null)
  const [newModulPdf, setNewModulPdf] = useState<File | null>(null)
  const [newModulPdfName, setNewModulPdfName] = useState<string | null>(null)
  const [isAddingModul, setIsAddingModul] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      
      const { data: checklistData } = await supabase.from('checklists').select('*').order('created_at', { ascending: true })
      if (checklistData) setChecklists(checklistData)

      const { data: modulData } = await supabase.from('modules').select('*').order('created_at', { ascending: true })
      if (modulData) setModules(modulData)
    }
    fetchData()
  }, [])

  const tabs = [
    { name: 'Home', icon: Home },
    { name: 'Modul', icon: BookOpen },
    { name: 'Rekap', icon: FileSpreadsheet },
    { name: 'Verifikasi', icon: UserCheck },
  ]

  const handleSignOut = async () => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileToUpload(file)
      const reader = new FileReader()
      reader.onload = (e) => setProfileImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewChecklistIcon(file)
      const reader = new FileReader()
      reader.onload = (e) => setNewChecklistIconPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const openFormChecklist = (item?: any) => {
    if (item && typeof item.id === 'number') {
      alert('Menu bawaan tidak bisa diedit.')
      return
    }
    if (item) {
      setEditItemId(item.id)
      setNewChecklistName(item.title)
      setNewChecklistIconPreview(item.icon_url)
      setNewChecklistIcon(null)
    } else {
      setEditItemId(null)
      setNewChecklistName('')
      setNewChecklistIconPreview(null)
      setNewChecklistIcon(null)
    }
    setCurrentView('formChecklist')
  }

  const handleDeleteChecklist = async (id: any) => {
    if (typeof id === 'number') {
      alert('Menu bawaan tidak bisa dihapus.')
      return
    }
    if (!window.confirm('Yakin ingin menghapus menu ini?')) return
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.from('checklists').delete().eq('id', id)
    setChecklists(checklists.filter(c => c.id !== id))
  }

  const handleToggleDisable = async (item: any) => {
    if (typeof item.id === 'number') {
      alert('Menu bawaan tidak bisa di-disable.')
      return
    }
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    const newStatus = !item.is_disabled
    await supabase.from('checklists').update({ is_disabled: newStatus }).eq('id', item.id)
    setChecklists(checklists.map(c => c.id === item.id ? { ...c, is_disabled: newStatus } : c))
  }

  const handleSaveChecklistForm = async () => {
    if (!newChecklistName) {
      alert('Nama Checklist harus diisi!')
      return
    }
    if (!editItemId && !newChecklistIcon) {
      alert('Gambar Icon harus diisi untuk menu baru!')
      return
    }

    setIsAddingChecklist(true)
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      
      let finalIconUrl = newChecklistIconPreview

      if (newChecklistIcon) {
        const fileExt = newChecklistIcon.name.split('.').pop()
        const fileName = `icon-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('icons').upload(fileName, newChecklistIcon)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('icons').getPublicUrl(fileName)
        finalIconUrl = publicUrl
      }

      if (editItemId) {
        const { error } = await supabase.from('checklists').update({ title: newChecklistName, icon_url: finalIconUrl }).eq('id', editItemId)
        if (error) throw error
        setChecklists(checklists.map(c => c.id === editItemId ? { ...c, title: newChecklistName, icon_url: finalIconUrl } : c))
        alert('Checklist berhasil diupdate!')
      } else {
        const { data, error } = await supabase.from('checklists').insert([{ title: newChecklistName, icon_url: finalIconUrl, has_actions: true }]).select()
        if (error) throw error
        if (data) setChecklists([...checklists, data[0]])
        alert('Checklist berhasil ditambahkan!')
      }
      
      setCurrentView('dashboard')
    } catch (error: any) {
      alert('Gagal: ' + error.message)
    } finally {
      setIsAddingChecklist(false)
    }
  }

  const handleModulIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewModulIcon(file)
      const reader = new FileReader()
      reader.onload = (e) => setNewModulIconPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleModulPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewModulPdf(file)
      setNewModulPdfName(file.name)
    }
  }

  const openFormModul = (item?: any) => {
    if (item) {
      setEditModulId(item.id)
      setNewModulName(item.title)
      setNewModulIconPreview(item.icon_url)
      setNewModulIcon(null)
      setNewModulPdfName(item.pdf_url ? 'Dokumen sudah diupload (Klik untuk mengganti)' : null)
      setNewModulPdf(null)
    } else {
      setEditModulId(null)
      setNewModulName('')
      setNewModulIconPreview(null)
      setNewModulIcon(null)
      setNewModulPdf(null)
      setNewModulPdfName(null)
    }
    setCurrentView('formModul')
  }

  const handleDeleteModul = async (id: any) => {
    if (!window.confirm('Yakin ingin menghapus modul ini?')) return
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.from('modules').delete().eq('id', id)
    setModules(modules.filter(c => c.id !== id))
  }

  const handleToggleDisableModul = async (item: any) => {
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    const newStatus = !item.is_disabled
    await supabase.from('modules').update({ is_disabled: newStatus }).eq('id', item.id)
    setModules(modules.map(c => c.id === item.id ? { ...c, is_disabled: newStatus } : c))
  }

  const handleSaveModulForm = async () => {
    if (!newModulName) {
      alert('Nama Modul harus diisi!')
      return
    }
    if (!editModulId && (!newModulIcon || !newModulPdf)) {
      alert('Gambar Icon dan Dokumen PDF harus diisi untuk modul baru!')
      return
    }

    setIsAddingModul(true)
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      
      let finalIconUrl = newModulIconPreview
      let finalPdfUrl = editModulId ? modules.find(m => m.id === editModulId)?.pdf_url : null

      if (newModulIcon) {
        const fileExt = newModulIcon.name.split('.').pop()
        const fileName = `modul-icon-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('icons').upload(fileName, newModulIcon)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('icons').getPublicUrl(fileName)
        finalIconUrl = publicUrl
      }

      if (newModulPdf) {
        const fileExt = newModulPdf.name.split('.').pop()
        const fileName = `modul-pdf-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('pdfs').upload(fileName, newModulPdf)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(fileName)
        finalPdfUrl = publicUrl
      }

      if (editModulId) {
        const { error } = await supabase.from('modules').update({ title: newModulName, icon_url: finalIconUrl, pdf_url: finalPdfUrl }).eq('id', editModulId)
        if (error) throw error
        setModules(modules.map(c => c.id === editModulId ? { ...c, title: newModulName, icon_url: finalIconUrl, pdf_url: finalPdfUrl } : c))
        alert('Modul berhasil diupdate!')
      } else {
        const { data, error } = await supabase.from('modules').insert([{ title: newModulName, icon_url: finalIconUrl, pdf_url: finalPdfUrl }]).select()
        if (error) throw error
        if (data) setModules([...modules, data[0]])
        alert('Modul berhasil ditambahkan!')
      }
      
      setCurrentView('dashboard')
    } catch (error: any) {
      alert('Gagal: ' + error.message)
    } finally {
      setIsAddingModul(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let avatarUrl = metadata?.avatar_url

      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop()
        const filePath = `${user.id}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileToUpload, { upsert: true })
          
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
          
        avatarUrl = publicUrl
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          nik: nik,
          full_name: fullName, 
          avatar_url: avatarUrl,
          jabatan: jabatan,
          cabang: cabang,
          role: 'superadmin'
        })
        
      if (profileError) {
        throw new Error('Gagal menyimpan ke tabel profiles: ' + profileError.message)
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
          jabatan: jabatan,
          cabang: cabang
        }
      })
      
      if (updateError) throw updateError
      
      alert('Profile berhasil disimpan!')
      router.refresh()
      setCurrentView('dashboard')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#f4f7fb] overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20 flex-shrink-0">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col gap-0.5">
          <NextImage 
            src="/images/alfamidi-logo-white.png" 
            alt="Alfamidi" 
            width={90} 
            height={50} 
            className="object-contain"
          />
        </div>
        
        <div 
          className="p-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition" 
          onClick={() => setCurrentView('profile')}
        >
          <div className="flex items-center gap-4">
             {profileImage ? (
               <img src={profileImage} className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"/>
             ) : (
               <div className="bg-slate-100 text-slate-400 rounded-full p-2"><UserCircle size={32} /></div>
             )}
             <div className="overflow-hidden">
               <p className="font-bold text-sm text-gray-800 truncate">{fullName || 'User HO'}</p>
               <p className="text-xs text-gray-500 truncate">{nik}</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu Utama</p>
          {tabs.map(tab => {
            const isActive = activeTab === tab.name && currentView === 'dashboard'
            return (
              <button 
                key={tab.name}
                onClick={() => { setActiveTab(tab.name); setCurrentView('dashboard') }} 
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-red-50 text-[#cc1e2c] font-bold shadow-sm border border-red-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={20} className={isActive ? 'text-[#cc1e2c]' : 'text-gray-400'} />
                  <span>{tab.name}</span>
                </div>
                {tab.name === 'Verifikasi' && pendingUsers.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
            )
          })}

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-8 mb-4 px-2">Riwayat Data</p>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition">
            <Settings2 size={20} className="text-gray-400" /><span>Data FCPT</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition">
            <Snowflake size={20} className="text-gray-400" /><span>Equipment Pendingin</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium transition">
            <Zap size={20} className="text-gray-400" /><span>Data Genset</span>
          </button>
        </nav>

        <div className="p-5 border-t border-gray-100">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-bold transition">
            <LogOut size={20} /><span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f4f7fb]">
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center z-10 shadow-sm relative">
          <div className="flex items-center gap-4">
            {currentView !== 'dashboard' && (
              <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 p-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-full transition shadow-sm pr-4"><ArrowLeft size={16} />{currentView === 'rekapDetail' && <span className="text-sm font-bold">Kembali ke Rekap</span>}
                
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              {currentView === 'profile' ? 'Edit Profile' : 
               currentView === 'formChecklist' ? (editItemId ? 'Edit Checklist' : 'Tambah Checklist') :
               currentView === 'formModul' ? (editModulId ? 'Edit Modul' : 'Tambah Modul') :
               currentView === 'checklistDetail' ? `Checklist ${selectedChecklist?.title?.replace(/\n/g, ' ')}` :
               currentView === 'fcptForm' ? 'Form Checklist FCPT' :
               ''}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition relative"
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-14 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800">Notifikasi</h3>
                      <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">2 Baru</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
                        <p className="text-sm font-semibold text-gray-800">Ceklist FCPT Telah Disubmit</p>
                        <p className="text-xs text-gray-500 mt-1">Cabang Kendari 2 telah mensubmit data hari ini.</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">10 menit yang lalu</p>
                      </div>
                      <div className="p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
                        <p className="text-sm font-semibold text-gray-800">Modul Baru Ditambahkan</p>
                        <p className="text-xs text-gray-500 mt-1">Admin menambahkan modul "SOP Genset".</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">1 jam yang lalu</p>
                      </div>
                    </div>
                    <div className="p-3 text-center border-t border-gray-100 bg-white hover:bg-gray-50 cursor-pointer transition">
                      <button className="text-sm text-blue-600 font-bold hover:underline">Lihat Semua</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {currentView === 'dashboard' && (activeTab === 'Home' || activeTab === 'Modul') && (
              <button 
                onClick={() => activeTab === 'Modul' ? openFormModul() : openFormChecklist()} 
                className="bg-[#cc1e2c] hover:bg-red-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-red-500/20 transition-all"
              >
                <Plus size={20} />
                <span>Tambah {activeTab === 'Home' ? 'Checklist' : 'Modul'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          
          <AnimatePresence mode="wait">
            
            {currentView === 'dashboard' && (
              <motion.div 
                key={`dash-${activeTab}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto"
              >
                {activeTab === 'Verifikasi' && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Verifikasi Akun</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      {pendingUsers.length === 0 ? (
                        <div className="text-center py-12">
                          <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 font-medium text-lg">Tidak ada akun yang menunggu verifikasi</p>
                          <p className="text-gray-400 mt-1">Semua akun sudah diverifikasi.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {pendingUsers.map((u) => (
                            <div key={u.id} className="border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition bg-gray-50/50 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="font-bold text-gray-800 text-lg">{u.full_name || 'Tanpa Nama'}</h3>
                                  <p className="text-sm text-gray-500 mt-1">NIK: <span className="font-mono font-bold text-gray-700">{u.nik}</span></p>
                                </div>
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                                  PENDING
                                </span>
                              </div>
                              <div className="mb-5 p-3 bg-white rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Role Diajukan</p>
                                <p className="font-bold text-[#0c539a] capitalize">{u.role?.replace(/_/g, ' ')}</p>
                              </div>
                              <button
                                onClick={() => { setSahkanTarget(u); setSahkanRole(u.role || '') }}
                                className="w-full bg-[#0c539a] hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                              >
                                <UserCheck size={18} />
                                Sahkan Role
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'Modul' && (
                  <div className="mb-8">
                    <div className="relative max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="Cari modul..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800 shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {activeTab === 'Home' && [...checklistItems, ...checklists].map((item, index) => {
                    const isDisabled = item.is_disabled
                    return (
                      <motion.div key={item.id || `custom-${index}`} className="flex flex-col">
                        <motion.button 
                          whileHover={isDisabled ? {} : { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} 
                          className={`w-full aspect-square bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center items-center p-6 relative overflow-hidden group transition-all duration-300 ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                          disabled={isDisabled}
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedChecklist(item)
                              setCurrentView('checklistDetail')
                            }
                          }}
                        >
                          {!isDisabled && (
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#cc1e2c] to-[#f04b57] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                          )}
                          
                          {item.icon_url ? (
                            <img src={item.icon_url} alt={item.title} className="w-16 h-16 mb-4 object-contain transition-transform group-hover:scale-110 duration-300" />
                          ) : (
                            <div className="scale-125 mb-2 transition-transform group-hover:scale-150 duration-300">{item.icon}</div>
                          )}

                          <span className={`font-bold text-sm text-center whitespace-pre-line mt-2 ${isDisabled ? 'text-gray-500' : 'text-gray-700 group-hover:text-[#cc1e2c]'}`}>
                            {item.title}
                          </span>
                        </motion.button>
                        
                        {item.hasActions !== false && (
                          <div className="flex justify-center gap-2 mt-4">
                            <button onClick={() => openFormChecklist(item)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteChecklist(item.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm transition"><Trash2 size={18} /></button>
                            <button onClick={() => handleToggleDisable(item)} className={`p-2 rounded-lg transition hover:shadow-sm ${isDisabled ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                              {isDisabled ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}

                  {activeTab === 'Modul' && modules.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => {
                    const isDisabled = item.is_disabled
                    return (
                      <motion.div key={item.id} className="flex flex-col">
                        <motion.a 
                          href={isDisabled ? undefined : item.pdf_url}
                          target={isDisabled ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          whileHover={isDisabled ? {} : { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} 
                          className={`w-full aspect-square bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center items-center p-6 relative overflow-hidden group transition-all duration-300 ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                          onClick={(e) => {
                            if (isDisabled || !item.pdf_url) e.preventDefault()
                          }}
                        >
                          {!isDisabled && (
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#cc1e2c] to-[#f04b57] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                          )}
                          
                          <img src={item.icon_url} alt={item.title} className="w-16 h-16 mb-4 object-contain transition-transform group-hover:scale-110 duration-300" />

                          <span className={`font-bold text-sm text-center whitespace-pre-line mt-2 ${isDisabled ? 'text-gray-500' : 'text-gray-700 group-hover:text-[#cc1e2c]'}`}>
                            {item.title}
                          </span>
                        </motion.a>
                        
                        <div className="flex justify-center gap-2 mt-4">
                          <button onClick={() => openFormModul(item)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteModul(item.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm transition"><Trash2 size={18} /></button>
                          <button onClick={() => handleToggleDisableModul(item)} className={`p-2 rounded-lg transition hover:shadow-sm ${isDisabled ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                            {isDisabled ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {activeTab === 'Rekap' && <RekapView onSelectDetail={(item) => { setSelectedRekapItem(item); setCurrentView('rekapDetail'); }} />}
              </motion.div>
            )}

            {(currentView === 'formChecklist' || currentView === 'formModul') && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-gray-800 font-bold text-sm">
                      Nama {currentView === 'formChecklist' ? 'Checklist' : 'Modul'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama" 
                      value={currentView === 'formChecklist' ? newChecklistName : newModulName}
                      onChange={(e) => currentView === 'formChecklist' ? setNewChecklistName(e.target.value) : setNewModulName(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800 placeholder-gray-400" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-800 font-bold text-sm">Gambar Icon</label>
                    <label className="w-full h-40 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl flex flex-col justify-center items-center gap-2 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] cursor-pointer overflow-hidden relative group">
                      {(currentView === 'formChecklist' ? newChecklistIconPreview : newModulIconPreview) ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img src={(currentView === 'formChecklist' ? newChecklistIconPreview : newModulIconPreview)!} alt="Preview" className="w-24 h-24 object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium text-sm flex items-center gap-2"><Edit size={16}/> Ganti Gambar</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={28} className="text-gray-400 group-hover:text-[#cc1e2c] transition-colors" />
                          <span className="text-gray-500 font-medium text-sm">Pilih file gambar</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={currentView === 'formChecklist' ? handleIconUpload : handleModulIconUpload} />
                    </label>
                  </div>

                  {currentView === 'formModul' && (
                    <div className="space-y-2">
                      <label className="block text-gray-800 font-bold text-sm">Dokumen PDF</label>
                      <label className="w-full h-32 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl flex flex-col justify-center items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer group">
                        <File size={28} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                        <span className="text-gray-600 font-medium text-center text-sm px-4 truncate w-full max-w-sm">
                          {newModulPdfName || 'Upload file PDF'}
                        </span>
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleModulPdfUpload} />
                      </label>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8">
                    <button onClick={() => setCurrentView('dashboard')} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
                    <button 
                      onClick={currentView === 'formChecklist' ? handleSaveChecklistForm : handleSaveModulForm}
                      disabled={currentView === 'formChecklist' ? isAddingChecklist : isAddingModul}
                      className="px-8 py-2.5 bg-[#cc1e2c] text-white font-bold rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-500/20 disabled:opacity-50"
                    >
                      {(currentView === 'formChecklist' ? isAddingChecklist : isAddingModul) ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center"
              >
                <div className="relative mb-8 group cursor-pointer">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-100 flex justify-center items-center">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={64} className="text-slate-300" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-[#0c539a] text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-blue-800 transition-colors">
                    <Camera size={18} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="w-full space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">NIK Karyawan</label>
                    <input type="text" disabled value={nik} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium cursor-not-allowed" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Nama Lengkap</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Jabatan</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan jabatan" 
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Cabang</label>
                    <input 
                      type="text" 
                      value={cabang}
                      disabled
                      className="w-full bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 text-blue-800 font-semibold cursor-not-allowed" 
                    />
                    <p className="text-[10px] text-gray-500 ml-1">Karena role Anda HO, cabang dikunci ke Head Office.</p>
                  </div>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full bg-[#cc1e2c] text-white font-bold py-3.5 rounded-xl mt-8 shadow-md shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </motion.div>
            )}

            {currentView === 'checklistDetail' && (
              <motion.div
                key="checklistDetail"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ChecklistDetailView 
                  checklist={selectedChecklist} 
                  onStoreClick={(store, isDone) => {
                    if (isDone) {
                      setActiveTab('Rekap')
                      setCurrentView('dashboard')
                    } else {
                      setSelectedStore(store)
                      setCurrentView('fcptForm')
                    }
                  }} 
                />
              </motion.div>
            )}

            {currentView === 'fcptForm' && (
              <motion.div
                key="fcptForm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <FCPTFormView store={selectedStore} onBack={() => setCurrentView('checklistDetail')} />
              </motion.div>
            )}

            {currentView === 'rekapDetail' && (
              <motion.div
                key="rekapDetail"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <RekapDetailView data={selectedRekapItem} onBack={() => setCurrentView('dashboard')} />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── Modal Sahkan Role ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {sahkanTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSahkanTarget(null) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <h3 className="font-bold text-gray-800 text-lg mb-1">Sahkan Role</h3>
              <p className="text-gray-500 text-sm mb-4">Tentukan role untuk karyawan berikut:</p>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nama</span>
                  <span className="font-bold text-gray-800">{sahkanTarget.full_name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">NIK</span>
                  <span className="font-mono font-bold text-gray-800">{sahkanTarget.nik}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Role Diajukan</span>
                  <span className="font-bold text-[#0c539a]">{sahkanTarget.role?.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <label className="block text-sm font-bold text-gray-700 mb-1.5">Tetapkan Role</label>
              <select
                value={sahkanRole}
                onChange={(e) => setSahkanRole(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-gray-50 focus:ring-2 focus:ring-[#0c539a] outline-none mb-5"
              >
                <option value="manager_cabang">Manager Cabang</option>
                <option value="koordinator_cabang">Koordinator Cabang</option>
                <option value="bmt">BMT</option>
                <option value="estimator">Estimator</option>
                <option value="admin">Admin</option>
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setSahkanTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSahkanRole}
                  disabled={isSahkan}
                  className="flex-1 py-2.5 bg-[#0c539a] hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition disabled:opacity-50"
                >
                  {isSahkan ? 'Menyimpan...' : 'Sahkan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
