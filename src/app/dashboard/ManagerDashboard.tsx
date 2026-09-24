'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, FileText, Settings2, Snowflake, Zap, 
  Edit, Trash2, Upload, Plus, 
  Home, BookOpen, FileSpreadsheet, BarChart2,
  LogOut, UserCircle, ArrowLeft, UploadCloud, ChevronRight,  Camera,
  Eye,
  EyeOff,
  Search,
  File
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useEffect } from 'react'

const checklistItems = [
  { id: 1, title: 'DPM', icon: <FileText size={36} className="text-[#cc1e2c] mb-3" />, hasActions: false },
  { id: 2, title: 'FCPT', icon: <Settings2 size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
  { id: 3, title: 'Equipment\nPendingin', icon: <Snowflake size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
  { id: 4, title: 'Genset', icon: <Zap size={36} className="text-[#cc1e2c] mb-3" />, hasActions: true },
]

export default function ManagerDashboard({ nik, metadata }: { nik: string, metadata: any }) {
  const [activeTab, setActiveTab] = useState('Home')
  const [currentView, setCurrentView] = useState<'dashboard' | 'formChecklist' | 'formModul' | 'more' | 'profile'>('dashboard')
  
  // States untuk form profil
  const [profileImage, setProfileImage] = useState<string | null>(metadata?.avatar_url || null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [fullName, setFullName] = useState(metadata?.full_name || '')
  const [jabatan, setJabatan] = useState(metadata?.jabatan || '')
  const [cabang, setCabang] = useState(metadata?.cabang || '')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // State untuk Data Checklist
  const [checklists, setChecklists] = useState<any[]>([])
  
  // State untuk Data Modul
  const [modules, setModules] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      
      const { data: checklistData } = await supabase.from('checklists').select('*').eq('is_disabled', false).order('created_at', { ascending: true })
      if (checklistData) setChecklists(checklistData)

      const { data: modulData } = await supabase.from('modules').select('*').eq('is_disabled', false).order('created_at', { ascending: true })
      if (modulData) setModules(modulData)
    }
    fetchData()
  }, [])

  const tabs = [
    { name: 'Home', icon: Home },
    { name: 'Modul', icon: BookOpen },
    { name: 'Rekap', icon: FileSpreadsheet },
    { name: 'Charts', icon: BarChart2 },
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

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let avatarUrl = metadata?.avatar_url

      // Upload gambar jika ada file baru
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
      
      // 1. Simpan ke tabel public.profiles (Sesuai request)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, // Primary key biasanya id dari auth.users
          nik: nik,
          full_name: fullName, 
          avatar_url: avatarUrl,
          jabatan: jabatan,
          cabang: cabang,
          role: 'ho'
        })
        
      if (profileError) {
        console.error("Error dari Supabase:", profileError.message)
        throw new Error('Gagal menyimpan ke tabel profiles: ' + profileError.message)
      }

      // 2. Simpan juga ke metadata auth agar state aplikasi mudah membacanya
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
      setCurrentView('more')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col pb-20 font-sans relative overflow-x-hidden">
      
      {/* --- MAIN DASHBOARD VIEW --- */}
      <AnimatePresence>
        {currentView === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col w-full"
          >
            {/* Top Navbar */}
            <div className="bg-gradient-to-r from-[#b01622] to-[#df2836] text-white flex justify-between items-center px-5 py-4 shadow-md sticky top-0 z-30">
              <motion.h1 
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-bold tracking-wide"
              >
                {activeTab === 'Modul' ? 'Modul' : 'Checklist'}
              </motion.h1>
              
              <button 
                onClick={() => setCurrentView('more')}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-5">
              
              {activeTab === 'Modul' && (
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Cari modul..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800 shadow-sm"
                    />
                  </div>
                </div>
              )}

              <motion.div 
                key={activeTab}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="grid grid-cols-2 gap-4 sm:gap-6"
              >
                {activeTab === 'Home' && [...checklistItems, ...checklists].map((item, index) => {
                  const isDisabled = item.is_disabled
                  return (
                  <motion.div key={item.id || `custom-${index}`} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col items-center">
                    <motion.button 
                      whileHover={isDisabled ? {} : { y: -4, scale: 1.02 }} 
                      whileTap={isDisabled ? {} : { scale: 0.95 }} 
                      className={`w-full aspect-square bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center items-center p-4 relative overflow-hidden group ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                      disabled={isDisabled}
                    >
                      {!isDisabled && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#cc1e2c] to-[#f04b57] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      )}
                      
                      {item.icon_url ? (
                        <img src={item.icon_url} alt={item.title} className="w-10 h-10 mb-3 object-contain" />
                      ) : (
                        item.icon
                      )}

                      <span className={`font-bold text-xs sm:text-sm text-center whitespace-pre-line transition-colors ${isDisabled ? 'text-gray-500' : 'text-[#333] group-hover:text-[#cc1e2c]'}`}>
                        {item.title}
                      </span>
                    </motion.button>
                  </motion.div>
                )})}

                {activeTab === 'Modul' && modules.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => {
                  const isDisabled = item.is_disabled
                  return (
                  <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col items-center">
                    <motion.a 
                      href={isDisabled ? undefined : item.pdf_url}
                      target={isDisabled ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className={`w-full aspect-square bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center items-center p-4 relative overflow-hidden group ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                      onClick={(e) => {
                        if (isDisabled || !item.pdf_url) e.preventDefault()
                      }}
                    >
                      {!isDisabled && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#cc1e2c] to-[#f04b57] transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      )}
                      
                      <img src={item.icon_url} alt={item.title} className="w-10 h-10 mb-3 object-contain" />

                      <span className={`font-bold text-xs sm:text-sm text-center whitespace-pre-line transition-colors ${isDisabled ? 'text-gray-500' : 'text-[#333] group-hover:text-[#cc1e2c]'}`}>
                        {item.title}
                      </span>
                    </motion.a>
                  </motion.div>
                )})}

              </motion.div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FORM TAMBAH/EDIT CHECKLIST VIEW --- */}

      {/* --- MORE VIEW --- */}
      <AnimatePresence>
        {currentView === 'more' && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="absolute top-0 left-0 w-full min-h-screen bg-[#f8fafc] z-30 flex flex-col pb-20">
            <div className="bg-[#cc1e2c] text-white flex items-center px-4 py-4 shadow-md sticky top-0 z-40">
              <button onClick={() => setCurrentView('dashboard')} className="p-1 mr-3 rounded-full hover:bg-red-700 transition-colors"><ArrowLeft size={24} /></button>
              <h1 className="text-xl font-bold tracking-wide">More</h1>
            </div>
            <div className="flex-1 py-4">
              <button onClick={() => setCurrentView('profile')} className="w-full flex items-center px-6 py-4 hover:bg-gray-100 transition-colors border-b border-gray-100">
                <div className="mr-4">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200" />
                  ) : (
                    <div className="bg-slate-200 text-slate-700 p-2 rounded-full"><UserCircle size={28} /></div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-gray-800 font-bold text-lg">{fullName || 'Profile'}</span>
                  <span className="block text-gray-500 text-sm">{nik}</span>
                </div>
              </button>
              <button className="w-full flex items-center px-6 py-4 hover:bg-gray-100 transition-colors border-b border-gray-100">
                <div className="text-slate-600 p-2 mr-4"><Settings2 size={28} /></div>
                <span className="text-gray-700 font-semibold text-lg flex-1 text-left">Riwayat Data FCPT</span>
              </button>
              <button className="w-full flex items-center px-6 py-4 hover:bg-gray-100 transition-colors border-b border-gray-100">
                <div className="text-slate-600 p-2 mr-4"><Snowflake size={28} /></div>
                <span className="text-gray-700 font-semibold text-lg flex-1 text-left">Riwayat Data Equipment Pendingin</span>
              </button>
              <button className="w-full flex items-center px-6 py-4 hover:bg-gray-100 transition-colors border-b border-gray-100">
                <div className="text-slate-600 p-2 mr-4"><Zap size={28} /></div>
                <span className="text-gray-700 font-semibold text-lg flex-1 text-left">Riwayat Data Genset</span>
              </button>

              <button onClick={handleSignOut} className="w-full flex items-center px-6 py-4 hover:bg-red-50 transition-colors mt-8">
                <div className="text-red-600 p-2 mr-4"><LogOut size={28} /></div>
                <span className="text-red-600 font-bold text-lg flex-1 text-left">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PROFILE VIEW --- */}
      <AnimatePresence>
        {currentView === 'profile' && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="absolute top-0 left-0 w-full min-h-screen bg-[#f8fafc] z-40 flex flex-col pb-20 overflow-y-auto">
            <div className="bg-[#cc1e2c] text-white flex items-center px-4 py-4 shadow-md sticky top-0 z-50">
              <button onClick={() => setCurrentView('more')} className="p-1 mr-3 rounded-full hover:bg-red-700 transition-colors"><ArrowLeft size={24} /></button>
              <h1 className="text-xl font-bold tracking-wide">Edit Profile</h1>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center">
              
              <div className="relative mb-8 mt-4 group cursor-pointer">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200 flex justify-center items-center">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={80} className="text-slate-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#0c539a] text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-blue-800 transition-colors">
                  <Camera size={20} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="w-full space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">NIK Karyawan</label>
                  <input type="text" disabled value={nik} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium cursor-not-allowed" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Jabatan</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan jabatan" 
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-500 font-bold text-xs uppercase tracking-wider">Cabang</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan cabang"
                    value={cabang}
                    onChange={(e) => setCabang(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800" 
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-[#cc1e2c] text-white font-bold py-3.5 rounded-xl mt-8 mb-8 shadow-md hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Bottom Navigation (Always visible) */}
      <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 fixed bottom-0 w-full flex justify-around items-center py-2 px-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name
          const Icon = tab.icon
          
          return (
            <button key={tab.name} onClick={() => setActiveTab(tab.name)} className="relative flex flex-col items-center justify-center p-2 w-16">
              {isActive && (
                <motion.div layoutId="bottom-nav-indicator" className="absolute inset-0 bg-red-50 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <motion.div animate={{ y: isActive ? -2 : 0 }} className={`${isActive ? 'text-[#cc1e2c]' : 'text-gray-400'}`}>
                <Icon size={22} className="mb-1" />
              </motion.div>
              <span className={`text-[10px] ${isActive ? 'font-bold text-[#cc1e2c]' : 'font-medium text-gray-500'}`}>{tab.name}</span>
            </button>
          )
        })}
      </div>
      
    </div>
  )
}
