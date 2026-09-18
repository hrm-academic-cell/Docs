import { useState } from 'react'
import Swal from 'sweetalert2'
import { supabase } from '../lib/supabaseClient'

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-ก-๙]/g, '')
    .slice(0, 60) || `cat-${Date.now()}`
}

export default function CategoryManagerModal({ open, onClose, categories, onChanged }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('categories').insert({
      name: newName.trim(),
      slug: slugify(newName),
      sort_order: categories.length + 1,
    })
    setSaving(false)
    if (error) {
      Swal.fire({ icon: 'error', title: 'เพิ่มหมวดหมู่ไม่สำเร็จ', text: error.message })
      return
    }
    setNewName('')
    onChanged()
  }

  async function handleUpdate(id) {
    if (!editingName.trim()) return
    const { error } = await supabase
      .from('categories')
      .update({ name: editingName.trim(), slug: slugify(editingName) })
      .eq('id', id)
    if (error) {
      Swal.fire({ icon: 'error', title: 'แก้ไขไม่สำเร็จ', text: error.message })
      return
    }
    setEditingId(null)
    onChanged()
  }

  async function handleDelete(id, name) {
    const result = await Swal.fire({
      icon: 'warning',
      title: `ลบหมวดหมู่ "${name}"?`,
      text: 'เอกสารในหมวดหมู่นี้จะกลายเป็น "ไม่ระบุหมวดหมู่" แต่จะไม่ถูกลบ',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#b8942c',
    })
    if (!result.isConfirmed) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: error.message })
      return
    }
    onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 font-thai">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="bg-navy-900 text-white px-5 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="font-semibold">จัดการหมวดหมู่เอกสาร</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-5 space-y-3">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="ชื่อหมวดหมู่ใหม่"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-navy-900 text-white text-sm hover:bg-navy-800 disabled:opacity-60"
            >
              เพิ่ม
            </button>
          </form>

          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                {editingId === c.id ? (
                  <>
                    <input
                      className="flex-1 border border-slate-300 rounded px-2 py-1"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => handleUpdate(c.id)} className="text-green-600 font-medium">
                      บันทึก
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400">
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-navy-900">{c.name}</span>
                    <button
                      onClick={() => {
                        setEditingId(c.id)
                        setEditingName(c.name)
                      }}
                      className="text-navy-600 hover:underline"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="text-red-500 hover:underline"
                    >
                      ลบ
                    </button>
                  </>
                )}
              </li>
            ))}
            {categories.length === 0 && (
              <li className="px-3 py-4 text-center text-slate-400 text-sm">ยังไม่มีหมวดหมู่</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
