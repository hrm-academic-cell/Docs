import Swal from 'sweetalert2'
import { getPublicFileUrl } from '../lib/supabaseClient'

function handlePrint(imageUrl, title) {
  const printWindow = window.open('', '_blank', 'width=900,height=1000')
  if (!printWindow) {
    Swal.fire({ icon: 'warning', title: 'เบราว์เซอร์บล็อกป๊อปอัป', text: 'กรุณาอนุญาต popup แล้วลองอีกครั้ง' })
    return
  }
  printWindow.document.write(`
    <!doctype html>
    <html lang="th">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { margin: 0; display: flex; align-items: center; justify-content: center; }
          img { max-width: 100%; height: auto; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <img src="${imageUrl}" onload="window.print(); window.onafterprint = () => window.close();" />
      </body>
    </html>
  `)
  printWindow.document.close()
}

async function handleShare(doc, imageUrl) {
  const shareData = {
    title: doc.title,
    text: doc.description || doc.title,
    url: imageUrl,
  }
  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch {
      // ผู้ใช้กดยกเลิกการแชร์ ไม่ต้องทำอะไรต่อ
    }
  } else {
    try {
      await navigator.clipboard.writeText(imageUrl)
      Swal.fire({ icon: 'success', title: 'คัดลอกลิงก์แล้ว', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'info', title: 'ลิงก์ประกาศ', text: imageUrl })
    }
  }
}

function handleDownload(doc) {
  const url = getPublicFileUrl(doc.file_path)
  const a = document.createElement('a')
  a.href = url
  a.download = doc.file_name
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function AnnouncementDetailModal({ doc, onClose }) {
  if (!doc) return null
  const imageUrl = getPublicFileUrl(doc.cover_image_path)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6 font-thai">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Top action bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-navy-900 text-sm sm:text-base truncate pr-2">{doc.title}</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handlePrint(imageUrl, doc.title)}
              title="พิมพ์"
              className="w-9 h-9 rounded-full bg-gold-50 text-gold-700 hover:bg-gold-100 flex items-center justify-center"
            >
              🖨️
            </button>
            <button
              onClick={() => handleShare(doc, imageUrl)}
              title="แชร์"
              className="w-9 h-9 rounded-full bg-gold-50 text-gold-700 hover:bg-gold-100 flex items-center justify-center"
            >
              🔗
            </button>
            <button
              onClick={() => handleDownload(doc)}
              title="ดาวน์โหลด"
              className="w-9 h-9 rounded-full bg-gold-50 text-gold-700 hover:bg-gold-100 flex items-center justify-center"
            >
              ⬇️
            </button>
            <button
              onClick={onClose}
              title="ปิด"
              className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Full announcement image */}
        <div className="bg-slate-50 flex items-center justify-center p-3">
          <img src={imageUrl} alt={doc.title} className="max-w-full h-auto rounded-lg shadow-sm" />
        </div>

        {doc.description && (
          <div className="px-5 pt-3 text-sm text-slate-600 whitespace-pre-line">{doc.description}</div>
        )}

        {/* Application form link — always shown at the bottom when available */}
        <div className="p-5">
          {doc.application_form_path ? (
            <a
              href={getPublicFileUrl(doc.application_form_path)}
              download={doc.application_form_name}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full py-3 rounded-xl bg-gradient-to-r from-navy-900 to-navy-800 text-white font-medium hover:from-navy-800 hover:to-navy-700 transition-all shadow-sm"
            >
              📝 ดาวน์โหลดใบสมัครพนักงาน
            </a>
          ) : (
            <p className="text-center text-xs text-slate-400">ยังไม่มีลิงก์ใบสมัครแนบมากับประกาศนี้</p>
          )}
        </div>
      </div>
    </div>
  )
}
