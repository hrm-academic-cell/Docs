import { useState } from 'react'
import { supabase, getPublicFileUrl } from '../lib/supabaseClient'

const fileIcon = (fileName = '') => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📕'
  if (['doc', 'docx'].includes(ext)) return '📘'
  if (['xls', 'xlsx'].includes(ext)) return '📗'
  return '📄'
}

const formatSize = (bytes) => {
  if (!bytes) return ''
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const formatDate = (iso) => {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function DocumentCard({ doc, categoryName, onDownloaded }) {
  const [downloading, setDownloading] = useState(false)
  const isPdf = doc.file_name?.toLowerCase().endsWith('.pdf')

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      // นับยอดดาวน์โหลดแบบ atomic ผ่าน RPC ก่อนเปิดไฟล์
      const { data: newCount, error } = await supabase.rpc('increment_download_count', {
        doc_id: doc.id,
      })
      if (!error && typeof newCount === 'number') {
        onDownloaded?.(doc.id, newCount)
      }
    } finally {
      const url = getPublicFileUrl(doc.file_path)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setDownloading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-gold-400/60 transition-all p-5 flex flex-col gap-3 font-thai">
      <div className="flex items-start gap-3">
        <div className="text-3xl leading-none">{fileIcon(doc.file_name)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy-900 leading-snug line-clamp-2">{doc.title}</h3>
          {categoryName && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-navy-900/5 text-navy-700 border border-navy-900/10">
              {categoryName}
            </span>
          )}
        </div>
      </div>

      {doc.description && (
        <p className="text-sm text-slate-600 line-clamp-2">{doc.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-2 border-t border-slate-100">
        <span>อัปเดต {formatDate(doc.updated_at)}</span>
        <span className="flex items-center gap-1">
          ⬇ {doc.download_count?.toLocaleString('th-TH') ?? 0} ครั้ง
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        {isPdf && (
          <a
            href={getPublicFileUrl(doc.file_path)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-sm px-3 py-2 rounded-lg border border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white transition-colors"
          >
            ดูตัวอย่าง
          </a>
        )}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`flex-1 text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-navy-800 to-navy-900 text-white hover:from-gold-500 hover:to-gold-600 hover:text-navy-950 transition-all font-medium disabled:opacity-60 ${
            isPdf ? '' : 'flex-[2]'
          }`}
        >
          {downloading ? 'กำลังโหลด...' : 'ดาวน์โหลด'} {formatSize(doc.file_size) && `(${formatSize(doc.file_size)})`}
        </button>
      </div>
    </div>
  )
}
