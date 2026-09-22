const MAIN_ICONS = ['📁', '🗂️', '📋', '📑', '🗃️', '📚', '🧾', '📇']

export default function CategoryGrid({ tree, documents, activeMainId, activeSubId, onSelectMain, onSelectSub }) {
  function countFor(main) {
    const ids = new Set([main.id, ...main.children.map((c) => c.id)])
    return documents.filter((d) => ids.has(d.category_id)).length
  }

  const activeMain = tree.find((m) => m.id === activeMainId)

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectMain('all')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeMainId === 'all'
              ? 'bg-gradient-to-br from-gold-500 to-gold-600 border-gold-600 text-navy-950 shadow-md'
              : 'bg-white border-slate-200 hover:border-gold-300 hover:shadow-sm text-navy-900'
          }`}
        >
          <div className="text-2xl mb-2">🗂️</div>
          <div className="font-medium text-sm leading-snug">ทั้งหมด</div>
          <div className={`text-xs mt-0.5 ${activeMainId === 'all' ? 'text-navy-900/70' : 'text-slate-400'}`}>
            {documents.length.toLocaleString('th-TH')} เอกสาร
          </div>
        </button>

        {tree.map((main, i) => (
          <button
            key={main.id}
            onClick={() => onSelectMain(main.id)}
            className={`text-left p-4 rounded-2xl border transition-all ${
              activeMainId === main.id
                ? 'bg-gradient-to-br from-gold-500 to-gold-600 border-gold-600 text-navy-950 shadow-md'
                : 'bg-white border-slate-200 hover:border-gold-300 hover:shadow-sm text-navy-900'
            }`}
          >
            <div className="text-2xl mb-2">{MAIN_ICONS[i % MAIN_ICONS.length]}</div>
            <div className="font-medium text-sm leading-snug line-clamp-2">{main.name}</div>
            <div className={`text-xs mt-0.5 ${activeMainId === main.id ? 'text-navy-900/70' : 'text-slate-400'}`}>
              {countFor(main).toLocaleString('th-TH')} เอกสาร
            </div>
          </button>
        ))}
      </div>

      {/* Subcategory chips for the selected main category */}
      {activeMain && activeMain.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => onSelectSub('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeSubId === 'all' ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-navy-300'
            }`}
          >
            ทั้งหมดในหมวดนี้
          </button>
          {activeMain.children.map((sub) => (
            <button
              key={sub.id}
              onClick={() => onSelectSub(sub.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeSubId === sub.id ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-navy-300'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
