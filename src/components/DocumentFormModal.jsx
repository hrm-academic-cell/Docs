import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { supabase, DOCS_BUCKET } from '../lib/supabaseClient'
import { buildCategoryTree } from '../lib/categoryTree'

const emptyForm = {
  title: '',
  description: '',
  keywords: '',
  category_id: '',
  is_published: true,
}

export default function DocumentFormModal({ open, onClose, onSaved, categories, editingDoc }) {
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingDoc) {
      setForm({
        title: editingDoc.title ?? '',
        description: editingDoc.description ?? '',
        keywords: editingDoc.keywords ?? '',
        category_id: editingDoc.category_id ?? '',
        is_published: editingDoc.is_published ?? true,
      })
    } else {
      setForm(emptyForm)
    }
    setFile(null)
  }, [editingDoc, open])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อเอกสาร' })
      return
    }
    if (!editingDoc && !file) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์เอกสาร' })
      return
    }

    setSaving(true)
    try {
      let filePath = editingDoc?.file_path
      let fileName = editingDoc?.file_name
      let fileSize = editingDoc?.file_size

      if (file) {
        // Storage key ต้องเป็น ASCII เท่านั้น (ห้ามมีอักขระไทย/ช่องว่าง/สัญลักษณ์พิเศษ)
        // ส่วนชื่อไฟล์จริงที่ผู้ใช้เห็น (ภาษาไทยได้ตามปกติ) จะถูกเก็บแยกไว้ใน fileName ด้านล่าง
        const ext = file.name.includes('.') ? file.name.split('.').pop().replace(/[^\w]/g, '') : ''
        const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext ? '.' + ext : ''}`
        const { error: uploadError } = await supabase.storage
          .from(DOCS_BUCKET)
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        // ถ้าเป็นการแก้ไขและมีไฟล์เดิม ให้ลบไฟล์เก่าทิ้ง
        if (editingDoc?.file_path) {
          await supabase.storage.from(DOCS_BUCKET).remove([editingDoc.file_path])
        }

        filePath = path
        fileName = file.name
        fileSize = file.size
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        keywords: form.keywords.trim(),
        category_id: form.category_id || null,
        is_published: form.is_published,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
      }

      if (editingDoc) {
        const { error } = await supabase.from('documents').update(payload).eq('id', editingDoc.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('documents').insert(payload)
        if (error) throw error
      }

      Swal.fire({ icon: 'success', title: 'บันทึกเรียบร้อย', timer: 1200, showConfirmButton: false })
      onSaved()
      onClose()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 font-thai">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-navy-900 text-white px-5 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="font-semibold">{editingDoc ? 'แก้ไขเอกสาร' : 'อัปโหลดเอกสารใหม่'}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">ชื่อเอกสาร *</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">หมวดหมู่</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">-- ไม่ระบุหมวดหมู่ --</option>
              {buildCategoryTree(categories).map((main) => (
                <optgroup key={main.id} label={main.name}>
                  <option value={main.id}>{main.name} (หมวดหมู่หลัก)</option>
                  {main.children.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      &nbsp;&nbsp;↳ {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">รายละเอียด</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">คำคีย์เวิร์ด (คั่นด้วยจุลภาค)</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="เช่น ลาป่วย, แบบฟอร์ม, สวัสดิการ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">
              ไฟล์เอกสาร {editingDoc ? '(เว้นว่างหากไม่ต้องการเปลี่ยนไฟล์)' : '*'}
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
            />
            {editingDoc?.file_name && (
              <p className="text-xs text-slate-500 mt-1">ไฟล์ปัจจุบัน: {editingDoc.file_name}</p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-900">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            เผยแพร่บนเว็บไซต์
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-60"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
