import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import DocumentCard from '../components/DocumentCard.jsx'
import DocumentListItem from '../components/DocumentListItem.jsx'
import CategoryTabBar from '../components/CategoryTabBar.jsx'
import { buildCategoryTree, categoryAndDescendantIds, categoryPathLabel } from '../lib/categoryTree.js'

export default function PublicLibrary() {
  const [documents, setDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // null = ยังไม่ได้เลือกอะไร (แสดงหน้าต้อนรับ), 'all' = แสดงทั้งหมด, หรือ id ของหมวดหมู่หลัก
  const [activeMainId, setActiveMainId] = useState(null)
  const [activeSubId, setActiveSubId] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: docs }, { data: cats }] = await Promise.all([
      supabase
        .from('documents')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setDocuments(docs ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  const tree = useMemo(() => buildCategoryTree(categories), [categories])

  function handleSelectMain(id) {
    setActiveMainId(id)
    setActiveSubId('all')
  }

  const hasFilter = activeMainId !== null || search.trim() !== ''

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return documents.filter((d) => {
      if (activeMainId && activeMainId !== 'all') {
        if (activeSubId && activeSubId !== 'all') {
          if (d.category_id !== activeSubId) return false
        } else {
          const allowedIds = categoryAndDescendantIds(categories, activeMainId)
          if (!allowedIds.includes(d.category_id)) return false
        }
      }
      if (!q) return true
      const haystack = `${d.title} ${d.description} ${d.keywords}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [documents, categories, search, activeMainId, activeSubId])

  function handleDownloaded(docId, newCount) {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, download_count: newCount } : d)))
  }

  return (
    <div className="min-h-screen bg-slate-50 font-thai">
      {/* Header */}
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-gold-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-gold-600 tracking-wide truncate">มหาวิทยาลัยราชภัฏศรีสะเกษ</p>
            <h1 className="text-sm md:text-base font-bold text-navy-900 truncate">
              ระบบเผยแพร่เอกสารออนไลน์ งานบริหารบุคคล
            </h1>
          </div>

          {/* Search toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {showSearch && (
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเอกสาร..."
                className="w-40 sm:w-64 px-3 py-1.5 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            )}
            <button
              onClick={() => setShowSearch((s) => !s)}
              aria-label="ค้นหา"
              className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                showSearch ? 'bg-gold-500 text-navy-950' : 'bg-gold-50 text-gold-700 hover:bg-gold-100'
              }`}
            >
              🔍
            </button>
          </div>
        </div>
      </header>

      {/* Category tab bar */}
      <CategoryTabBar
        tree={tree}
        activeMainId={activeMainId ?? '__none__'}
        activeSubId={activeSubId}
        onSelectMain={handleSelectMain}
        onSelectSub={setActiveSubId}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-24 text-slate-400">กำลังโหลดเอกสาร...</div>
        ) : !hasFilter ? (
          /* Welcome hero */
          <div className="flex flex-col items-center justify-center text-center py-20 sm:py-28 gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-4xl shadow-md">
              📚
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-900">
              ยินดีต้อนรับเข้าสู่ระบบเผยแพร่เอกสารงานบริหารบุคคล
            </h2>
            <p className="text-slate-500 max-w-md">
              กรุณาเลือกหมวดหมู่ด้านบน หรือ กดค้นหา
              <span className="ml-1" aria-hidden>🔍</span>
            </p>
            <button
              onClick={() => handleSelectMain('all')}
              className="mt-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-medium shadow-sm hover:from-gold-400 hover:to-gold-500 transition-all"
            >
              ดูเอกสารทั้งหมด
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-400">ไม่พบเอกสารที่ตรงกับการค้นหา</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                พบ <span className="text-navy-900 font-medium">{filtered.length.toLocaleString('th-TH')}</span> เอกสาร
              </p>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="มุมมองแบบตาราง"
                  title="มุมมองแบบตาราง"
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950'
                      : 'text-slate-400 hover:text-gold-600'
                  }`}
                >
                  ▦
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="มุมมองแบบรายการ"
                  title="มุมมองแบบรายการ"
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950'
                      : 'text-slate-400 hover:text-gold-600'
                  }`}
                >
                  ☰
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    categoryLabel={categoryPathLabel(categories, doc.category_id)}
                    onDownloaded={handleDownloaded}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((doc) => (
                  <DocumentListItem
                    key={doc.id}
                    doc={doc}
                    categoryLabel={categoryPathLabel(categories, doc.category_id)}
                    onDownloaded={handleDownloaded}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating admin button, bottom-right */}
      <Link
        to="/admin/login"
        aria-label="สำหรับผู้ดูแลระบบ"
        title="สำหรับผู้ดูแลระบบ"
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-navy-900 text-gold-400 shadow-lg flex items-center justify-center hover:bg-navy-800 hover:scale-105 transition-all"
      >
        ⚙️
      </Link>
    </div>
  )
}
