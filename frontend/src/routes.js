import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.js'
import Dashboard from './pages/Dashboard.js'
import GVPs from './pages/GVPs.js'
import Complaints from './pages/Complaints.js'
import Cleanups from './pages/Cleanups.js'
import Analytics from './pages/Analytics.js'
import Predictions from './pages/Predictions.js'
import NotFound from './pages/NotFound.js'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gvps" element={<GVPs />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/cleanups" element={<Cleanups />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
