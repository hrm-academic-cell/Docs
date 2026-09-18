import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function AdminLogin() {
  const { session, isAdmin, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: signInError } = await signIn(email.trim(), password)
    setSubmitting(false)
    if (signInError) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      return
    }
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 font-thai">
      <div className="w-full max-w-sm bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <p className="text-gold-400 text-xs tracking-wide mb-1">มหาวิทยาลัยราชภัฏศรีสะเกษ</p>
          <h1 className="text-white text-lg font-semibold">เข้าสู่ระบบผู้ดูแล</h1>
          <p className="text-slate-400 text-xs mt-1">ระบบเผยแพร่เอกสารออนไลน์ งานบริหารบุคคล</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-800 border border-navy-600 text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-800 border border-navy-600 text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-colors disabled:opacity-60"
          >
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <a href="/" className="block text-center text-xs text-slate-400 hover:text-gold-400 mt-6">
          ← กลับหน้าเอกสารสาธารณะ
        </a>
      </div>
    </div>
  )
}
