export default function CategoryTabBar({
  tree,
  activeMainId,
  activeSubId,
  onSelectMain,
  onSelectSub,
}) {
  const activeMain = tree.find((m) => m.id === activeMainId)

  return (
    <div className="sticky top-[64px] z-30 bg-white/90 backdrop-blur border-b border-slate-200 font-thai">
      {/* Main category row */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => onSelectMain('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeMainId === 'all'
                ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 shadow-sm'
                : 'text-slate-600 hover:bg-gold-50 hover:text-gold-700'
            }`}
          >
            ทั้งหมด
          </button>
          {tree.map((main) => (
            <button
              key={main.id}
              onClick={() => onSelectMain(main.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeMainId === main.id
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 shadow-sm'
                  : 'text-slate-600 hover:bg-gold-50 hover:text-gold-700'
              }`}
            >
              {main.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sub category row */}
      {activeMain && activeMain.children.length > 0 && (
        <div className="bg-navy-950/[0.02] border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
              <button
                onClick={() => onSelectSub('all')}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeSubId === 'all'
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-500 hover:bg-navy-900/10'
                }`}
              >
                ทั้งหมดในหมวดนี้
              </button>
              {activeMain.children.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onSelectSub(sub.id)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    activeSubId === sub.id
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-500 hover:bg-navy-900/10'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
