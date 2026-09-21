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

export default function DocumentListItem({ doc, categoryLabel, onDownloaded }) {
  const [downloading, setDownloading] = useState(false)
  const isPdf = doc.file_name?.toLowerCase().endsWith('.pdf')

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
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
    <div className="group bg-white rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md hover:border-gold-400 transition-all duration-200 p-4 flex items-center gap-4 font-thai">
      <div className="text-2xl leading-none bg-gold-50 rounded-lg w-11 h-11 shrink-0 flex items-center justify-center border border-gold-100">
        {fileIcon(doc.file_name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-navy-900 leading-snug truncate">{doc.title}</h3>
          {categoryLabel && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gold-50 text-gold-700 border border-gold-200">
              {categoryLabel}
            </span>
          )}
        </div>
        {doc.description && (
          <p className="text-sm text-slate-500 truncate mt-0.5">{doc.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
          <span>อัปเดต {formatDate(doc.updated_at)}</span>
          <span className="text-gold-600 font-medium">
            ⬇ {doc.download_count?.toLocaleString('th-TH') ?? 0} ครั้ง
          </span>
          {formatSize(doc.file_size) && <span>{formatSize(doc.file_size)}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isPdf && (
          <a
            href={getPublicFileUrl(doc.file_path)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block text-sm px-3 py-2 rounded-lg border border-navy-900/20 text-navy-800 hover:bg-navy-900 hover:text-white hover:border-navy-900 transition-colors"
          >
            ดูตัวอย่าง
          </a>
        )}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-medium hover:from-gold-400 hover:to-gold-500 shadow-sm transition-all disabled:opacity-60 whitespace-nowrap"
        >
          {downloading ? 'กำลังโหลด...' : 'ดาวน์โหลด'}
        </button>
      </div>
    </div>
  )
}
