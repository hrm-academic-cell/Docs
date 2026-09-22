import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { supabase, getPublicFileUrl } from '../lib/supabaseClient'

function isPdf(fileName = '') {
  return fileName.toLowerCase().endsWith('.pdf')
}

function handlePrintFile(doc) {
  const fileUrl = getPublicFileUrl(doc.file_path)
  if (!isPdf(doc.file_name)) {
    // ไฟล์ไม่ใช่ PDF (เช่น Word) เบราว์เซอร์ไม่สามารถสั่งพิมพ์ตรงได้ ให้เปิดไฟล์แทน
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
    Swal.fire({
      icon: 'info',
      title: 'ไฟล์นี้ไม่ใช่ PDF',
      text: 'ระบบเปิดไฟล์ต้นฉบับให้แล้ว กรุณาสั่งพิมพ์จากโปรแกรมที่เปิดไฟล์นั้นอีกครั้ง',
    })
    return
  }
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
        <title>${doc.title}</title>
        <style>
          html, body { margin: 0; height: 100%; }
          iframe { border: 0; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <iframe src="${fileUrl}" onload="setTimeout(() => { window.print(); }, 300)"></iframe>
      </body>
    </html>
  `)
  printWindow.document.close()
}

async function handleShare(doc) {
  const shareUrl = window.location.href
  const shareData = { title: doc.title, text: doc.description || doc.title, url: shareUrl }
  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch {
      // ผู้ใช้กดยกเลิกการแชร์
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareUrl)
      Swal.fire({ icon: 'success', title: 'คัดลอกลิงก์แล้ว', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'info', title: 'ลิงก์ประกาศ', text: shareUrl })
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

export default function AnnouncementDetail() {
  const { id } = useParams()
  const [doc, setDoc] = useState(undefined) // undefined = loading, null = not found
  const fileUrl = doc ? getPublicFileUrl(doc.file_path) : null

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .maybeSingle()
      if (mounted) setDoc(data ?? null)
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  if (doc === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-thai text-slate-400">
        กำลังโหลดประกาศ...
      </div>
    )
  }

  if (doc === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-thai gap-3 text-center px-4">
        <p className="text-navy-900 font-semibold">ไม่พบประกาศนี้ หรือถูกซ่อนไปแล้ว</p>
        <Link to="/" className="text-gold-600 underline text-sm">
          กลับหน้าแรก
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-thai">
      {/* Top action bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gold-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="text-sm text-navy-700 hover:text-navy-900 flex items-center gap-1 shrink-0"
          >
            ← หน้าแรก
          </Link>
          <h1 className="text-sm font-semibold text-navy-900 truncate text-center flex-1 px-2">
            {doc.title}
          </h1>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handlePrintFile(doc)}
              title="พิมพ์เฉพาะไฟล์ประกาศ"
              className="w-9 h-9 rounded-full bg-gold-50 text-gold-700 hover:bg-gold-100 flex items-center justify-center"
            >
              🖨️
            </button>
            <button
              onClick={() => handleShare(doc)}
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
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* รูปภาพประจำประกาศ */}
        {doc.cover_image_path && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <img
              src={getPublicFileUrl(doc.cover_image_path)}
              alt={doc.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {doc.description && (
          <p className="text-sm text-slate-600 whitespace-pre-line px-1">{doc.description}</p>
        )}

        {/* ประกาศฉบับเต็ม แสดงใต้รูปภาพ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-sm font-medium text-navy-900">
            📄 ประกาศฉบับเต็ม
          </div>
          {isPdf(doc.file_name) ? (
            <iframe
              src={fileUrl}
              title="ประกาศฉบับเต็ม"
              className="w-full"
              style={{ height: '75vh', border: 0 }}
            />
          ) : (
            <div className="p-6 text-center text-sm text-slate-500 space-y-3">
              <p>ไฟล์นี้เป็น {doc.file_name?.split('.').pop()?.toUpperCase()} ไม่รองรับการแสดงตัวอย่างในหน้านี้</p>
              <button
                onClick={() => handleDownload(doc)}
                className="px-4 py-2 rounded-lg bg-navy-900 text-white text-sm hover:bg-navy-800"
              >
                ดาวน์โหลดไฟล์ประกาศ
              </button>
            </div>
          )}
        </div>

        {/* ลิงก์ใบสมัครพนักงาน — แสดงท้ายประกาศเสมอ */}
        <div>
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
      </main>
    </div>
  )
}
