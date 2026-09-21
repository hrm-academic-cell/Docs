import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth.jsx'
import StatCard from '../components/StatCard.jsx'
import DocumentTable from '../components/DocumentTable.jsx'
import DocumentFormModal from '../components/DocumentFormModal.jsx'
import CategoryManagerModal from '../components/CategoryManagerModal.jsx'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [documents, setDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDocModal, setShowDocModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: docs }, { data: cats }] = await Promise.all([
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setDocuments(docs ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  const stats = useMemo(() => {
    const totalDownloads = documents.reduce((sum, d) => sum + (d.download_count ?? 0), 0)
    return {
      totalDocs: documents.length,
      totalCategories: categories.length,
      totalDownloads,
    }
  }, [documents, categories])

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return documents
    return documents.filter((d) => `${d.title} ${d.keywords}`.toLowerCase().includes(q))
  }, [documents, search])

  function openNewDoc() {
    setEditingDoc(null)
    setShowDocModal(true)
  }

  function openEditDoc(doc) {
    setEditingDoc(doc)
    setShowDocModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-100 font-thai">
      {/* Sidebar-style top bar (navy/gold per house style) */}
      <header className="bg-navy-950 border-b border-navy-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-gold-400 text-xs">มหาวิทยาลัยราชภัฏศรีสะเกษ</p>
            <h1 className="font-semibold">แผงควบคุมเอกสาร — งานบริหารบุคคล</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300 hidden sm:inline">{user?.email}</span>
            <a href="/" className="text-gold-400 hover:underline">
              ดูหน้าสาธารณะ
            </a>
            <button onClick={signOut} className="text-slate-300 hover:text-white">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="เอกสารทั้งหมด" value={stats.totalDocs.toLocaleString('th-TH')} icon="📄" />
          <StatCard label="หมวดหมู่ทั้งหมด" value={stats.totalCategories.toLocaleString('th-TH')} icon="🗂️" />
          <StatCard
            label="ยอดดาวน์โหลดรวม"
            value={stats.totalDownloads.toLocaleString('th-TH')}
            icon="⬇️"
            accent
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาในตารางเอกสาร..."
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 rounded-lg border border-navy-900 text-navy-900 text-sm hover:bg-navy-900 hover:text-white transition-colors"
            >
              จัดการหมวดหมู่
            </button>
            <button
              onClick={openNewDoc}
              className="px-4 py-2 rounded-lg bg-navy-900 text-white text-sm hover:bg-navy-800 transition-colors"
            >
              + อัปโหลดเอกสาร
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : (
          <DocumentTable
            documents={filteredDocs}
            categories={categories}
            onEdit={openEditDoc}
            onChanged={loadAll}
          />
        )}
      </main>

      <DocumentFormModal
        open={showDocModal}
        onClose={() => setShowDocModal(false)}
        onSaved={loadAll}
        categories={categories}
        editingDoc={editingDoc}
        allDocuments={documents}
      />
      <CategoryManagerModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        onChanged={loadAll}
      />
    </div>
  )
}
