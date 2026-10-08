'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  BookOpen, 
  FileSpreadsheet, 
  LogOut, 
  ArrowLeft, 
  FileText, 
  Settings2, 
  Snowflake, 
  Zap, 
  UserCircle, 
  Bell,
  Search,
  Camera,
  Menu,
  X,
  Share2,
  Printer,
  Loader2,
  Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { ThemeToggleInline } from '@/components/ThemeToggle'

import BMTManagementView from './BMTManagementView'
import ChecklistDetailView from './ChecklistDetailView'
import FCPTFormView from './FCPTFormView'
import BMTRekapView from './BMTRekapView'
import BMTRekapDetailView from './BMTRekapDetailView'
import ChillerFormView from './ChillerFormView'
import GensetFormView from './GensetFormView'
import DPMFormView from './DPMFormView'

const defaultChecklists = [
  { id: 1, title: 'DPM', icon: <FileText size={36} className="text-[#cc1e2c] mb-3" />, hasActions: false },
  { id: 2, title: 'FCPT', icon: <Settings2 size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
  { id: 3, title: 'Equipment\nPendingin', icon: <Snowflake size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
  { id: 4, title: 'Genset', icon: <Zap size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
]

export default function ManagerDashboard({ nik, metadata }: { nik: string, metadata: any }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'Home' | 'Profiles' | 'Modul' | 'Rekap' | 'Atur BMT'>('Home')
  const [currentView, setCurrentView] = useState<'dashboard' | 'storeList' | 'fcptForm' | 'chillerForm' | 'gensetForm' | 'dpmForm'>('dashboard')
  const [rekapDetail, setRekapDetail] = useState<{ item: any; filterType: string } | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const exportFnRef = useRef<(() => Promise<void>) | null>(null)
  const shareFnRef = useRef<(() => void) | null>(null)
  const [activeCategory, setActiveCategory] = useState<any>(null)
  const [selectedStore, setSelectedStore] = useState<any>(null)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [modules, setModules] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(metadata?.avatar_url || null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [fullName, setFullName] = useState(metadata?.full_name || '')
  const [jabatan, setJabatan] = useState(metadata?.jabatan || '')
  const [cabang, setCabang] = useState(metadata?.cabang || '')
  const [isSaving, setIsSaving] = useState(false)
  useEffect(() => {
    const fetchModules = async () => {
      const { createClient } = await import('@/frontend/supabase/client')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, icon_url, pdf_url, is_disabled')
        .order('id', { ascending: true })

      if (error) {
        console.error('[BMTDashboard] Fetch modules error:', error.message)
        return
      }

      if (data) setModules(data)
    }
    fetchModules()
  }, [])

  const handleSignOut = async () => {
    const { createClient } = await import('@/frontend/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileToUpload(file)
      const reader = new FileReader()
      reader.onload = (event) => setProfileImage(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const { createClient } = await import('@/frontend/supabase/client')
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

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = publicUrl
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, nik: nik, full_name: fullName, 
          avatar_url: avatarUrl, jabatan: jabatan, cabang: cabang, role: 'bmt' 
        })
        
      if (profileError) throw profileError

      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl, jabatan: jabatan, cabang: cabang }
      })
      
      if (updateError) throw updateError
      
      alert('Profile berhasil disimpan!')
      router.refresh()
    } catch (error: any) {
      alert('Gagal: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const navItems = [
    { name: 'Home', label: 'Beranda', icon: Home },
    { name: 'Modul', label: 'Modul SOP', icon: BookOpen },
    { name: 'Rekap', label: 'Rekap Data', icon: FileSpreadsheet },
    { name: 'Atur BMT', label: 'Atur BMT', icon: Users },
  ] as const
  if (currentView === 'gensetForm' && selectedStore) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-950 pb-12 font-sans">
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-20">
          <button
            onClick={() => setCurrentView('storeList')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
            {activeCategory?.title?.replace('\n', ' ')}
            <span className="text-gray-400 dark:text-slate-500 font-normal mx-1.5">·</span>
            <span className="text-[#cc1e2c]">{selectedStore.kode}</span>
          </span>
        </div>
        <div className="p-4 md:p-8">
          <GensetFormView store={selectedStore} userNik={nik} userNama={fullName} onBack={() => setCurrentView('storeList')} />
        </div>
      </div>
    )
  }

  if (currentView === 'chillerForm' && selectedStore) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-950 pb-12 font-sans">
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-20">
          <button
            onClick={() => setCurrentView('storeList')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
            {activeCategory?.title?.replace('\n', ' ')}
            <span className="text-gray-400 dark:text-slate-500 font-normal mx-1.5">·</span>
            <span className="text-[#cc1e2c]">{selectedStore.kode}</span>
          </span>
        </div>
        <div className="p-4 md:p-8">
          <ChillerFormView store={selectedStore} userNik={nik} userNama={fullName} onBack={() => setCurrentView('storeList')} />
        </div>
      </div>
    )
  }

  if (currentView === 'fcptForm' && selectedStore) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-950 pb-12 font-sans">
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-20">
          <button
            onClick={() => setCurrentView('storeList')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
            {activeCategory?.title}
            <span className="text-gray-400 dark:text-slate-500 font-normal mx-1.5">·</span>
            <span className="text-[#cc1e2c]">{selectedStore.kode}</span>
          </span>
        </div>
        <div className="p-4 md:p-8">
          <FCPTFormView store={selectedStore} onBack={() => setCurrentView('storeList')} />
        </div>
      </div>
    )
  }

  if (currentView === 'dpmForm' && selectedStore) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] dark:bg-slate-950 pb-12 font-sans">
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-20">
          <button
            onClick={() => setCurrentView('storeList')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
            {activeCategory?.title}
            <span className="text-gray-400 dark:text-slate-500 font-normal mx-1.5">·</span>
            <span className="text-[#cc1e2c]">{selectedStore.kode}</span>
          </span>
        </div>
        <div className="p-4 md:p-8">
          <DPMFormView 
            store={selectedStore} 
            userNik={nik} 
            userNama={fullName} 
            onBack={() => setCurrentView('storeList')} 
          />
        </div>
      </div>
    )
  }

  if (currentView === 'storeList' && activeCategory) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-950 flex flex-col font-sans">
        <div className="bg-white dark:bg-slate-900 px-4 py-3 md:px-8 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => { setCurrentView('dashboard'); setActiveCategory(null); }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate">
            Checklist {activeCategory.title?.replace('\n', ' ')}
          </h1>
        </div>
        <div className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
          <ChecklistDetailView 
            checklist={activeCategory} 
            onStoreClick={(store) => { 
              setSelectedStore(store); 
              if (activeCategory.id === 3 || activeCategory.title.includes('Equipment')) {
                setCurrentView('chillerForm');
              } else if (activeCategory.id === 4 || activeCategory.title.includes('Genset')) {
                setCurrentView('gensetForm');
              } else if (activeCategory.id === 1 || activeCategory.title === 'DPM') {
                setCurrentView('dpmForm');
              } else {
                setCurrentView('fcptForm');
              }
            }} 
          />
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-screen bg-[#f4f7fb] dark:bg-slate-950 overflow-hidden font-sans relative">

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shadow-lg md:shadow-sm flex-shrink-0 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <NextImage src="/images/alfamidi-logo-white.png" alt="Alfamidi" width={90} height={50} className="object-contain" />

          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="p-2 md:hidden text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div 
          onClick={() => { setActiveTab('Profiles'); setIsSidebarOpen(false); }}
          className={`p-5 border-b border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition ${activeTab === 'Profiles' ? 'bg-gray-50 dark:bg-slate-800' : ''}`}
        >
          <div className="flex items-center gap-4">
            {profileImage ? (
               <img src={profileImage} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-700 shadow-sm" alt="Profile"/>
            ) : (
               <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full p-2"><UserCircle size={32} /></div>
            )}
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{fullName || 'User BMT'}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{nik || 'NIK BMT'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Menu Utama</p>
          {navItems.map((item) => {
            const isActive = activeTab === item.name
            return (
              <button
                key={item.name}
                onClick={() => { setActiveTab(item.name); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-red-50 dark:bg-red-900/20 text-[#cc1e2c] font-bold shadow-sm border border-red-100 dark:border-red-800/50' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={isActive ? 'text-[#cc1e2c]' : 'text-gray-400 dark:text-slate-500'} />
                  <span>{item.label}</span>
                </div>
              </button>
            )
          })}
        </nav>

        <div className="p-5 border-t border-gray-100 dark:border-slate-800">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition">
            <LogOut size={20} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f4f7fb] dark:bg-slate-950 w-full">

        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 md:px-8 py-4 flex justify-between items-center z-10 shadow-sm relative">
          <div className="flex items-center gap-3 md:gap-4">

            {!rekapDetail && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition"
              >
                <Menu size={24} />
              </button>
            )}

            {rekapDetail && (
              <button 
                onClick={() => setRekapDetail(null)} 
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition"
              >
                <ArrowLeft size={20} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {rekapDetail && (
              <>
                <button
                  onClick={() => shareFnRef.current && shareFnRef.current()}
                  disabled={isExportingPdf}
                  className="p-2.5 bg-blue-50/50 dark:bg-blue-900/20 text-[#0c539a] dark:text-blue-400 rounded-xl hover:bg-[#0c539a] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-100 dark:border-blue-800/40 transition disabled:opacity-50"
                  title="Bagikan"
                >
                  <Share2 size={20} />
                </button>
                <button
                  onClick={() => exportFnRef.current && exportFnRef.current()}
                  disabled={isExportingPdf}
                  className="p-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
                  title="Export PDF"
                >
                  {isExportingPdf ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                </button>
                <div className="w-px h-8 bg-gray-200 dark:bg-slate-800 mx-2 hidden sm:block"></div>
              </>
            )}

            <div className="relative">
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2.5 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition relative border border-gray-100 dark:border-slate-700">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
              </button>
            </div>
            <ThemeToggleInline />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">

            <AnimatePresence mode="wait">

              {activeTab === 'Profiles' && (
                <motion.div key="profile-tab" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8 flex flex-col items-center">
                  <div className="relative mb-6 md:mb-8 group cursor-pointer">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-100 flex justify-center items-center">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={64} className="text-slate-300" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-[#0c539a] text-white p-2 md:p-3 rounded-full shadow-lg cursor-pointer hover:bg-blue-800 transition-colors">
                      <Camera size={16} className="md:w-[18px] md:h-[18px]" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>

                  <div className="w-full space-y-4 md:space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">NIK Karyawan</label>
                      <input type="text" disabled value={nik} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Nama Lengkap</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Jabatan</label>
                      <input type="text" value={jabatan} onChange={(e) => setJabatan(e.target.value)} className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Cabang (Branch)</label>
                      <input type="text" value={cabang} onChange={(e) => setCabang(e.target.value)} className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#cc1e2c] text-gray-800" />
                    </div>
                  </div>

                  <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-[#cc1e2c] text-white font-bold py-3.5 rounded-xl mt-6 md:mt-8 shadow-md shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </motion.div>
              )}

              {activeTab === 'Home' && (
                <motion.div key="home-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h2 className="text-sm md:text-base font-extrabold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">Pilih Menu Inspection</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                    {defaultChecklists.map((item) => (
                      <motion.div 
                        key={item.id} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md dark:hover:shadow-slate-900 transition-all flex flex-col justify-center items-center text-center cursor-pointer group"
                        onClick={() => { setActiveCategory(item); setCurrentView('storeList'); }}
                      >
                        <div className="p-3 md:p-4 bg-red-50/70 dark:bg-red-900/20 rounded-2xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                        <span className="font-extrabold text-xs md:text-base text-gray-800 dark:text-gray-100 whitespace-pre-line leading-snug">{item.title}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'Modul' && (
                <motion.div key="modul-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="mb-6 md:mb-8">
                    <div className="relative max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input type="text" placeholder="Cari modul..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800 shadow-sm text-sm md:text-base" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {modules.filter((m) => m.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
                      const isDisabled = item.is_disabled
                      return (
                        <motion.div key={item.id} className="flex flex-col">
                          <motion.a href={isDisabled ? undefined : item.pdf_url} target={isDisabled ? undefined : '_blank'} rel="noopener noreferrer" className={`w-full aspect-square bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center items-center p-4 md:p-6 relative overflow-hidden group transition-all duration-300 ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`} onClick={(e) => { if (isDisabled || !item.pdf_url) e.preventDefault() }}>
                            {item.icon_url ? <img src={item.icon_url} alt={item.title} className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 object-contain transition-transform group-hover:scale-110 duration-300" /> : <FileText size={48} className="text-[#cc1e2c] mb-3 md:mb-4 w-10 h-10 md:w-12 md:h-12" />}
                            <span className={`font-bold text-xs md:text-sm text-center whitespace-pre-line mt-1 md:mt-2 ${isDisabled ? 'text-gray-500' : 'text-gray-700'}`}>{item.title}</span>
                          </motion.a>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'Atur BMT' && (
                <motion.div key="atur-bmt-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                  <BMTManagementView userRole={metadata?.role} userBranch={cabang} userNik={nik} userName={metadata?.full_name} />
                </motion.div>
              )}

              {activeTab === 'Rekap' && (
                <motion.div key="rekap-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                  {rekapDetail ? (
                    <BMTRekapDetailView 
                      data={rekapDetail.item} 
                      filterType={rekapDetail.filterType} 
                      onBack={() => setRekapDetail(null)} 
                      setExportFn={(fn) => { exportFnRef.current = fn; }}
                      setShareFn={(fn) => { shareFnRef.current = fn; }}
                      setIsExporting={setIsExportingPdf}
                    />
                  ) : (
                    <BMTRekapView 
                      nik={nik} 
                      metadata={metadata} 
                      onSelectDetail={(item, type) => {
                        setRekapDetail({ 
                          item, 
                          filterType: item.filterType || (type === 'chiller' ? 'Chiller' : type === 'genset' ? 'Genset' : 'FCPT') 
                        })
                      }}
                    />
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}