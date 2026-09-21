import { getPublicFileUrl } from '../lib/supabaseClient'

export default function AnnouncementCard({ doc, onOpen }) {
  return (
    <button
      onClick={() => onOpen(doc)}
      className="group text-left bg-white rounded-2xl shadow-sm border border-slate-200/80 hover:shadow-xl hover:-translate-y-0.5 hover:border-gold-400 transition-all duration-200 overflow-hidden font-thai"
    >
      <div className="aspect-square bg-slate-100 overflow-hidden">
        <img
          src={getPublicFileUrl(doc.cover_image_path)}
          alt={doc.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-navy-900 text-sm leading-snug line-clamp-2">{doc.title}</h3>
        <p className="text-xs text-gold-600 mt-1">แตะเพื่อดูประกาศฉบับเต็ม</p>
      </div>
    </button>
  )
}
