import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { supabase, DOCS_BUCKET } from '../lib/supabaseClient'
import { buildCategoryTree } from '../lib/categoryTree'

const MAX_COVER_DIMENSION = 780

const emptyForm = {
  title: '',
  description: '',
  keywords: '',
  category_id: '',
  is_published: true,
}

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพนี้ได้'))
    }
    img.src = url
  })
}

function safeUploadPath(originalName) {
  const ext = originalName.includes('.') ? originalName.split('.').pop().replace(/[^\w]/g, '') : ''
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext ? '.' + ext : ''}`
}

export default function DocumentFormModal({
  open,
  onClose,
  onSaved,
  categories,
  editingDoc,
  allDocuments = [],
}) {
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [appFormMode, setAppFormMode] = useState('keep') // 'keep' | 'none' | 'existing' | 'upload'
  const [appFormDocId, setAppFormDocId] = useState('')
  const [appFormFile, setAppFormFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const flatCategories = categories
  const selectedCategory = flatCategories.find((c) => c.id === form.category_id)
  const requiresCover = !!selectedCategory?.requires_cover_image

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
    setCoverFile(null)
    setAppFormMode('keep')
    setAppFormDocId('')
    setAppFormFile(null)
  }, [editingDoc, open])

  const otherDocuments = useMemo(
    () => allDocuments.filter((d) => d.id !== editingDoc?.id),
    [allDocuments, editingDoc]
  )

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
    if (requiresCover && !coverFile && !editingDoc?.cover_image_path) {
      Swal.fire({
        icon: 'warning',
        title: 'ต้องแนบรูปภาพประจำประกาศ',
        text: 'หมวดหมู่นี้บังคับให้แนบรูปภาพประจำประกาศ (ขนาดไม่เกิน 780x780 px)',
      })
      return
    }
    if (appFormMode === 'existing' && !appFormDocId) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ใบสมัครจากเอกสารที่มีอยู่' })
      return
    }
    if (appFormMode === 'upload' && !appFormFile) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ใบสมัครที่จะอัปโหลด' })
      return
    }

    setSaving(true)
    try {
      // ตรวจสอบขนาดรูปภาพก่อนอัปโหลดจริง
      if (coverFile) {
        const { width, height } = await readImageDimensions(coverFile)
        if (width > MAX_COVER_DIMENSION || height > MAX_COVER_DIMENSION) {
          throw new Error(
            `ขนาดรูปภาพต้องไม่เกิน ${MAX_COVER_DIMENSION}x${MAX_COVER_DIMENSION} px (ไฟล์นี้คือ ${width}x${height} px)`
          )
        }
      }

      // 1) ไฟล์เอกสารหลัก
      let filePath = editingDoc?.file_path
      let fileName = editingDoc?.file_name
      let fileSize = editingDoc?.file_size

      if (file) {
        const path = safeUploadPath(file.name)
        const { error: uploadError } = await supabase.storage
          .from(DOCS_BUCKET)
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        if (editingDoc?.file_path) {
          await supabase.storage.from(DOCS_BUCKET).remove([editingDoc.file_path])
        }
        filePath = path
        fileName = file.name
        fileSize = file.size
      }

      // 2) รูปภาพประจำประกาศ
      let coverImagePath = editingDoc?.cover_image_path
      let coverImageName = editingDoc?.cover_image_name

      if (coverFile) {
        const path = `covers/${safeUploadPath(coverFile.name)}`
        const { error: uploadError } = await supabase.storage
          .from(DOCS_BUCKET)
          .upload(path, coverFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        if (editingDoc?.cover_image_path) {
          await supabase.storage.from(DOCS_BUCKET).remove([editingDoc.cover_image_path])
        }
        coverImagePath = path
        coverImageName = coverFile.name
      }

      // 3) ลิงก์ใบสมัครพนักงาน
      let applicationFormPath = editingDoc?.application_form_path
      let applicationFormName = editingDoc?.application_form_name

      if (appFormMode === 'none') {
        applicationFormPath = null
        applicationFormName = null
      } else if (appFormMode === 'existing') {
        const picked = allDocuments.find((d) => d.id === appFormDocId)
        if (picked) {
          applicationFormPath = picked.file_path
          applicationFormName = picked.file_name
        }
      } else if (appFormMode === 'upload' && appFormFile) {
        const path = `application-forms/${safeUploadPath(appFormFile.name)}`
        const { error: uploadError } = await supabase.storage
          .from(DOCS_BUCKET)
          .upload(path, appFormFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        applicationFormPath = path
        applicationFormName = appFormFile.name
      }
      // 'keep' → ไม่เปลี่ยนแปลง ใช้ค่าเดิมของ editingDoc ต่อไป

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        keywords: form.keywords.trim(),
        category_id: form.category_id || null,
        is_published: form.is_published,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        cover_image_path: coverImagePath ?? null,
        cover_image_name: coverImageName ?? null,
        application_form_path: applicationFormPath ?? null,
        application_form_name: applicationFormName ?? null,
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
        <div className="bg-navy-900 text-white px-5 py-4 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
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
                      {sub.requires_cover_image ? ' 🖼️' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {requiresCover && (
              <p className="text-xs text-gold-700 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2 mt-2">
                🖼️ หมวดหมู่นี้ต้องแนบ<strong>รูปภาพประจำประกาศ</strong> — จะแสดงเป็นรูปภาพ/สไลด์บนหน้าแรก
              </p>
            )}
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

          {requiresCover && (
            <div className="border border-gold-200 bg-gold-50/40 rounded-lg p-3 space-y-2">
              <label className="block text-sm font-medium text-navy-900">
                รูปภาพประจำประกาศ * (ไม่เกิน {MAX_COVER_DIMENSION}x{MAX_COVER_DIMENSION} px)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              />
              {editingDoc?.cover_image_name && (
                <p className="text-xs text-slate-500">รูปปัจจุบัน: {editingDoc.cover_image_name}</p>
              )}
              <p className="text-xs text-slate-500">
                ถ้ารูปมีขนาดใหญ่กว่าที่กำหนด ระบบจะแจ้งเตือนและไม่บันทึกไฟล์ ให้ย่อขนาดก่อนอัปโหลดใหม่
              </p>
            </div>
          )}

          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <label className="block text-sm font-medium text-navy-900">
              ลิงก์ใบสมัครพนักงาน (แสดงท้ายประกาศ — ไม่บังคับ)
            </label>
            <select
              value={appFormMode}
              onChange={(e) => setAppFormMode(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="keep">
                {editingDoc?.application_form_name
                  ? `ใช้ไฟล์เดิม: ${editingDoc.application_form_name}`
                  : 'ไม่แนบใบสมัคร'}
              </option>
              <option value="existing">เลือกจากเอกสารที่มีอยู่แล้วในระบบ</option>
              <option value="upload">อัปโหลดไฟล์ใบสมัครใหม่</option>
              {editingDoc?.application_form_name && <option value="none">ลบลิงก์ใบสมัครออก</option>}
            </select>

            {appFormMode === 'existing' && (
              <select
                value={appFormDocId}
                onChange={(e) => setAppFormDocId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- เลือกเอกสาร --</option>
                {otherDocuments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.file_name})
                  </option>
                ))}
              </select>
            )}

            {appFormMode === 'upload' && (
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setAppFormFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
              />
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
