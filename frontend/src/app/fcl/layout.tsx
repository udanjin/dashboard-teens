'use client'

import { Layout } from 'antd'
import DashboardSidebar from '../../components/Layout/DashboardSidebar'
import DashboardHeader from '../../components/Layout/DashboardHeader'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function FclLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, loading, logout, user } = useAuth()
  const router = useRouter()

  // State untuk mengontrol sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Auto-collapse sidebar pada layar kecil
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          user={user} 
          onLogout={logout} 
          onMenuClick={() => setSidebarOpen(true)}
          isCollapsed={sidebarCollapsed}
        />
        
        {/* Main content dengan responsive padding */}
        <main className={`flex-1 overflow-auto pt-[64px] transition-all duration-300 ${
          // Mobile: no left padding
          "pl-0 " +
          // Desktop: adjust padding berdasarkan sidebar state
          (sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[250px]")
        }`}>
          <div className="p-3 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}