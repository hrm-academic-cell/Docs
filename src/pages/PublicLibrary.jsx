import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import DocumentCard from '../components/DocumentCard.jsx'
import DocumentListItem from '../components/DocumentListItem.jsx'
import AnnouncementCard from '../components/AnnouncementCard.jsx'
import AnnouncementSlideshow from '../components/AnnouncementSlideshow.jsx'
import CategoryGrid from '../components/CategoryGrid.jsx'
import OverviewStatCard from '../components/OverviewStatCard.jsx'
import { buildCategoryTree, categoryAndDescendantIds, categoryPathLabel } from '../lib/categoryTree.js'

export default function PublicLibrary() {
  const [documents, setDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [menuOpen, setMenuOpen] = useState(false)

  const [activeMainId, setActiveMainId] = useState(null)
  const [activeSubId, setActiveSubId] = useState('all')

  const heroSearchRef = useRef(null)
  const categoriesRef = useRef(null)
  const documentsRef = useRef(null)

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
  const mainCount = tree.length
  const subCount = categories.filter((c) => c.parent_id).length

  const coverCategoryIds = useMemo(
    () => new Set(categories.filter((c) => c.requires_cover_image).map((c) => c.id)),
    [categories]
  )
  const isAnnouncement = (doc) => coverCategoryIds.has(doc.category_id) && !!doc.cover_image_path
  const announcementDocs = useMemo(() => documents.filter(isAnnouncement), [documents, coverCategoryIds])

  function scrollTo(ref) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSelectMain(id) {
    setActiveMainId(id)
    setActiveSubId('all')
    setTimeout(() => scrollTo(documentsRef), 50)
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

  const filteredAnnouncements = filtered.filter(isAnnouncement)
  const filteredNormal = filtered.filter((d) => !isAnnouncement(d))

  function handleDownloaded(docId, newCount) {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, download_count: newCount } : d)))
  }

  return (
    <div className="min-h-screen bg-slate-50 font-thai">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gold-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 min-w-0"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-lg shadow-sm">
              📚
            </span>
            <span className="text-left min-w-0">
              <span className="block text-sm font-bold text-navy-900 truncate leading-tight">
                ระบบเผยแพร่เอกสารออนไลน์
              </span>
              <span className="block text-[10px] text-gold-600 tracking-wide truncate leading-tight">
                งานบริหารบุคคล มรภ.ศรีสะเกษ
              </span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-5 text-sm text-navy-700">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-gold-600 transition-colors flex items-center gap-1"
            >
              🏠 หน้าหลัก
            </button>
            <button onClick={() => scrollTo(categoriesRef)} className="hover:text-gold-600 transition-colors">
              หมวดหมู่เอกสาร
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {showSearch && (
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเอกสาร..."
                className="w-32 sm:w-56 px-3 py-1.5 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
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
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((m) => !m)}
              aria-label="เมนู"
              className="sm:hidden w-9 h-9 shrink-0 rounded-full bg-navy-900/5 text-navy-800 flex items-center justify-center"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1 text-sm">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                setMenuOpen(false)
              }}
              className="text-left px-2 py-2 rounded-lg hover:bg-gold-50 text-navy-800"
            >
              🏠 หน้าหลัก
            </button>
            <button
              onClick={() => {
                scrollTo(categoriesRef)
                setMenuOpen(false)
              }}
              className="text-left px-2 py-2 rounded-lg hover:bg-gold-50 text-navy-800"
            >
              🗂️ หมวดหมู่เอกสาร
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 pt-14 pb-10 text-center">
          <span className="inline-block text-xs font-medium tracking-widest text-gold-600 bg-gold-50 border border-gold-200 rounded-full px-3 py-1 mb-4">
            ✦ DOCUMENT CENTER
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy-900 leading-snug">
            ระบบเผยแพร่เอกสารออนไลน์
            <br />
            งานบริหารบุคคล มหาวิทยาลัยราชภัฏศรีสะเกษ
          </h1>
          <p className="text-slate-500 mt-4 text-sm sm:text-base max-w-xl mx-auto">
            ค้นหาและเข้าถึงเอกสาร ระเบียบ ประกาศ และแบบฟอร์มต่าง ๆ ได้อย่างสะดวก รวดเร็ว จากศูนย์กลางเดียว
          </p>

          <div className="mt-6 max-w-lg mx-auto relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              ref={heroSearchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อเอกสาร รายละเอียด หรือคำคีย์เวิร์ด..."
              className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
            />
          </div>
        </div>
      </section>

      {/* ประกาศรับสมัครพนักงาน — สไลด์ */}
      {!loading && announcementDocs.length > 0 && <AnnouncementSlideshow documents={announcementDocs} />}

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* ภาพรวมระบบ */}
        <section>
          <h2 className="text-lg font-bold text-navy-900">ภาพรวมระบบ</h2>
          <p className="text-sm text-slate-500 mb-4">ข้อมูลเอกสารที่เผยแพร่ในระบบ</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <OverviewStatCard label="หมวดหมู่หลัก" value={mainCount.toLocaleString('th-TH')} icon="📁" />
            <OverviewStatCard label="หมวดหมู่ย่อย" value={subCount.toLocaleString('th-TH')} icon="🗂️" />
            <OverviewStatCard label="เอกสารทั้งหมด" value={documents.length.toLocaleString('th-TH')} icon="📄" />
          </div>
        </section>

        {/* หมวดหมู่เอกสาร */}
        <section ref={categoriesRef} className="scroll-mt-20">
          <h2 className="text-lg font-bold text-navy-900">หมวดหมู่เอกสาร</h2>
          <p className="text-sm text-slate-500 mb-4">เลือกหมวดหมู่เพื่อดูเอกสารที่ต้องการ</p>
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
          ) : (
            <CategoryGrid
              tree={tree}
              documents={documents}
              activeMainId={activeMainId ?? '__none__'}
              activeSubId={activeSubId}
              onSelectMain={handleSelectMain}
              onSelectSub={setActiveSubId}
            />
          )}
        </section>

        {/* เอกสาร */}
        <section ref={documentsRef} className="scroll-mt-20">
          <h2 className="text-lg font-bold text-navy-900">เอกสาร</h2>
          <p className="text-sm text-slate-500 mb-4">รายการเอกสาร</p>

          {loading ? (
            <div className="text-center py-16 text-slate-400">กำลังโหลดเอกสาร...</div>
          ) : !hasFilter ? (
            <div className="text-center py-14 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
              🔍 เลือกหมวดหมู่ด้านบน หรือกดค้นหา เพื่อดูรายการเอกสาร
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-slate-400 text-sm">ไม่พบเอกสารที่ตรงกับการค้นหา</div>
          ) : (
            <div className="space-y-8">
              {filteredAnnouncements.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-3">
                    ประกาศ (<span className="text-navy-900 font-medium">{filteredAnnouncements.length}</span>)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredAnnouncements.map((doc) => (
                      <AnnouncementCard key={doc.id} doc={doc} />
                    ))}
                  </div>
                </div>
              )}

              {filteredNormal.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500">
                      เอกสารทั่วไป (<span className="text-navy-900 font-medium">{filteredNormal.length}</span>)
                    </p>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        aria-label="มุมมองแบบตาราง"
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
                      {filteredNormal.map((doc) => (
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
                      {filteredNormal.map((doc) => (
                        <DocumentListItem
                          key={doc.id}
                          doc={doc}
                          categoryLabel={categoryPathLabel(categories, doc.category_id)}
                          onDownloaded={handleDownloaded}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 text-center py-8 px-4">
        <p className="text-slate-300 text-sm">ระบบเผยแพร่เอกสารและแบบฟอร์ม งานบริหารบุคคล</p>
        <p className="text-gold-500/80 text-xs mt-1">Powered by Human Resource Management SSKRU</p>
        <Link to="/admin/login" className="inline-block text-slate-500 hover:text-gold-400 text-xs mt-3">
          สำหรับผู้ดูแลระบบ
        </Link>
      </footer>

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
