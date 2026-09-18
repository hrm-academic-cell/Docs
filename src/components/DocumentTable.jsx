import Swal from 'sweetalert2'
import { supabase, DOCS_BUCKET } from '../lib/supabaseClient'

export default function DocumentTable({ documents, categories, onEdit, onChanged }) {
  const categoryName = (id) => categories.find((c) => c.id === id)?.name ?? '—'

  async function handleDelete(doc) {
    const result = await Swal.fire({
      icon: 'warning',
      title: `ลบเอกสาร "${doc.title}"?`,
      text: 'การลบไม่สามารถย้อนกลับได้',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return

    const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id)
    if (dbError) {
      Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: dbError.message })
      return
    }
    if (doc.file_path) {
      await supabase.storage.from(DOCS_BUCKET).remove([doc.file_path])
    }
    Swal.fire({ icon: 'success', title: 'ลบเรียบร้อย', timer: 1000, showConfirmButton: false })
    onChanged()
  }

  async function togglePublish(doc) {
    const { error } = await supabase
      .from('documents')
      .update({ is_published: !doc.is_published })
      .eq('id', doc.id)
    if (error) {
      Swal.fire({ icon: 'error', title: 'อัปเดตไม่สำเร็จ', text: error.message })
      return
    }
    onChanged()
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 font-thai">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-900 text-white text-left">
            <th className="px-4 py-3">ชื่อเอกสาร</th>
            <th className="px-4 py-3">หมวดหมู่</th>
            <th className="px-4 py-3 text-center">ดาวน์โหลด</th>
            <th className="px-4 py-3 text-center">สถานะ</th>
            <th className="px-4 py-3 text-right">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="font-medium text-navy-900">{doc.title}</div>
                <div className="text-xs text-slate-400">{doc.file_name}</div>
              </td>
              <td className="px-4 py-3 text-slate-600">{categoryName(doc.category_id)}</td>
              <td className="px-4 py-3 text-center font-semibold text-navy-800">
                {doc.download_count?.toLocaleString('th-TH') ?? 0}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => togglePublish(doc)}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    doc.is_published
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {doc.is_published ? 'เผยแพร่' : 'ซ่อนอยู่'}
                </button>
              </td>
              <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                <button onClick={() => onEdit(doc)} className="text-navy-600 hover:underline">
                  แก้ไข
                </button>
                <button onClick={() => handleDelete(doc)} className="text-red-500 hover:underline">
                  ลบ
                </button>
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                ยังไม่มีเอกสาร
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
