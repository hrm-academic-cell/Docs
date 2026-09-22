import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicFileUrl } from '../lib/supabaseClient'

export default function AnnouncementSlideshow({ documents }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (documents.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % documents.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [documents.length])

  if (documents.length === 0) return null

  const current = documents[index]

  function goTo(i) {
    setIndex((i + documents.length) % documents.length)
  }

  return (
    <div className="bg-white border-b border-gold-200">
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-navy-900 flex items-center gap-1.5">
            📣 ประกาศรับสมัครพนักงานล่าสุด
          </h2>
          {documents.length > 1 && (
            <span className="text-xs text-slate-400">
              {index + 1} / {documents.length}
            </span>
          )}
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
          <Link to={`/announcement/${current.id}`} className="block w-full" aria-label={`เปิดประกาศ: ${current.title}`}>
            <img
              src={getPublicFileUrl(current.cover_image_path)}
              alt={current.title}
              className="w-full max-h-[420px] object-contain bg-white mx-auto transition-opacity duration-300"
            />
          </Link>

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-navy-950/80 to-transparent px-4 py-3 pointer-events-none">
            <p className="text-white text-sm font-medium truncate">{current.title}</p>
          </div>

          {documents.length > 1 && (
            <>
              <button
                onClick={() => goTo(index - 1)}
                aria-label="ก่อนหน้า"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-navy-900 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ‹
              </button>
              <button
                onClick={() => goTo(index + 1)}
                aria-label="ถัดไป"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-navy-900 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ›
              </button>
            </>
          )}
        </div>

        {documents.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {documents.map((d, i) => (
              <button
                key={d.id}
                onClick={() => goTo(i)}
                aria-label={`ไปที่สไลด์ ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-gold-500' : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
