import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import DocumentCard from '../components/DocumentCard.jsx'

export default function PublicLibrary() {
  const [documents, setDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

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

  const categoryMap = useMemo(() => {
    const m = {}
    categories.forEach((c) => (m[c.id] = c.name))
    return m
  }, [categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return documents.filter((d) => {
      const matchesCategory = activeCategory === 'all' || d.category_id === activeCategory
      if (!matchesCategory) return false
      if (!q) return true
      const haystack = `${d.title} ${d.description} ${d.keywords}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [documents, search, activeCategory])

  function handleDownloaded(docId, newCount) {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, download_count: newCount } : d)))
  }

  return (
    <div className="min-h-screen bg-slate-50 font-thai">
      {/* Header */}
      <header className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-gold-400 text-sm tracking-wide mb-2">มหาวิทยาลัยราชภัฏศรีสะเกษ</p>
          <h1 className="text-2xl md:text-3xl font-bold">ระบบเผยแพร่เอกสารออนไลน์ งานบริหารบุคคล</h1>
          <p className="text-slate-300 mt-2 text-sm">
            ค้นหาและดาวน์โหลดประกาศ คำสั่ง แบบฟอร์ม และคู่มือที่เกี่ยวข้องกับงานบุคคล
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาเอกสาร ชื่อเรื่อง หรือคำคีย์เวิร์ด..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              activeCategory === 'all'
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-navy-700 border-slate-200 hover:border-navy-300'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                activeCategory === c.id
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-white text-navy-700 border-slate-200 hover:border-navy-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Document grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">กำลังโหลดเอกสาร...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">ไม่พบเอกสารที่ตรงกับการค้นหา</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                categoryName={categoryMap[doc.category_id]}
                onDownloaded={handleDownloaded}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 py-8">
        <Link to="/admin/login" className="hover:text-navy-500">
          สำหรับผู้ดูแลระบบ
        </Link>
      </footer>
    </div>
  )
}
