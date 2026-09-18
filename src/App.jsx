import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import PublicLibrary from './pages/PublicLibrary.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

function ProtectedRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 font-thai">
        <div className="text-gold-400 animate-pulse">กำลังตรวจสอบสิทธิ์...</div>
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 font-thai text-white gap-3">
        <p className="text-lg">บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ</p>
        <a href="/" className="text-gold-400 underline">กลับหน้าแรก</a>
      </div>
    )
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PublicLibrary />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
