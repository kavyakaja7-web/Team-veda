import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.js'
import Navbar from '../components/Navbar.js'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-x-hidden px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
