'use client'

import { Home, BookOpen, FileSpreadsheet, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('Home')

  useEffect(() => {
    if (pathname === '/dashboard') setActiveTab('Home')
    else if (pathname.includes('/modul')) setActiveTab('Modul')
    else if (pathname.includes('/rekap')) setActiveTab('Rekap')
    else if (pathname.includes('/charts')) setActiveTab('Charts')
  }, [pathname])

  const tabs = [
    { name: 'Home', icon: Home, route: '/dashboard' },
    { name: 'Modul', icon: BookOpen, route: '/dashboard/modul' },
    { name: 'Rekap', icon: FileSpreadsheet, route: '/dashboard/rekap' },
    { name: 'Charts', icon: BarChart2, route: '/dashboard/charts' },
  ]

  return (
    <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 fixed bottom-0 w-full flex justify-around items-center py-2 px-2 pb-safe z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name
        const Icon = tab.icon
        
        return (
          <button 
            key={tab.name}
            onClick={() => router.push(tab.route)}
            className="relative flex flex-col items-center justify-center p-2 w-16"
          >
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-red-50 rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <motion.div
              animate={{ y: isActive ? -2 : 0 }}
              className={`${isActive ? 'text-[#cc1e2c]' : 'text-gray-400'}`}
            >
              <Icon size={22} className="mb-1" />
            </motion.div>
            <span className={`text-[10px] ${isActive ? 'font-bold text-[#cc1e2c]' : 'font-medium text-gray-500'}`}>
              {tab.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
