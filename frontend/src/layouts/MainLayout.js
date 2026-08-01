import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.js'
import Navbar from '../components/Navbar.js'

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-x-hidden p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
