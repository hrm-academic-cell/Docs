import { useState } from 'react'
import Swal from 'sweetalert2'
import { supabase } from '../lib/supabaseClient'
import { buildCategoryTree } from '../lib/categoryTree'

function slugify(text) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-ก-๙]/g, '')
      .slice(0, 60) || `cat-${Date.now()}`
  )
}

export default function CategoryManagerModal({ open, onClose, categories, onChanged }) {
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const tree = buildCategoryTree(categories)
  const mainCategories = categories.filter((c) => !c.parent_id)

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('categories').insert({
      name: newName.trim(),
      slug: slugify(newName),
      parent_id: newParentId || null,
      sort_order: categories.length + 1,
    })
    setSaving(false)
    if (error) {
      Swal.fire({ icon: 'error', title: 'เพิ่มหมวดหมู่ไม่สำเร็จ', text: error.message })
      return
    }
    setNewName('')
    setNewParentId('')
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

  async function handleDelete(id, name, hasChildren) {
    const result = await Swal.fire({
      icon: 'warning',
      title: `ลบหมวดหมู่ "${name}"?`,
      text: hasChildren
        ? 'หมวดหมู่ย่อยภายใต้หมวดหมู่นี้จะถูกลบไปด้วย เอกสารจะกลายเป็น "ไม่ระบุหมวดหมู่" แต่จะไม่ถูกลบ'
        : 'เอกสารในหมวดหมู่นี้จะกลายเป็น "ไม่ระบุหมวดหมู่" แต่จะไม่ถูกลบ',
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

  function CategoryRow({ cat, isSub = false }) {
    return (
      <li className={`flex items-center gap-2 px-3 py-2 text-sm ${isSub ? 'pl-8 bg-slate-50/60' : ''}`}>
        {isSub && <span className="text-gold-600">↳</span>}
        {editingId === cat.id ? (
          <>
            <input
              className="flex-1 border border-slate-300 rounded px-2 py-1"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              autoFocus
            />
            <button onClick={() => handleUpdate(cat.id)} className="text-green-600 font-medium">
              บันทึก
            </button>
            <button onClick={() => setEditingId(null)} className="text-slate-400">
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <span className={`flex-1 ${isSub ? 'text-slate-700' : 'text-navy-900 font-medium'}`}>
              {cat.name}
            </span>
            <button
              onClick={() => {
                setEditingId(cat.id)
                setEditingName(cat.name)
              }}
              className="text-navy-600 hover:underline"
            >
              แก้ไข
            </button>
            <button
              onClick={() =>
                handleDelete(cat.id, cat.name, !isSub && categories.some((c) => c.parent_id === cat.id))
              }
              className="text-red-500 hover:underline"
            >
              ลบ
            </button>
          </>
        )}
      </li>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 font-thai">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white px-5 py-4 rounded-t-xl flex items-center justify-between sticky top-0">
          <h2 className="font-semibold">จัดการหมวดหมู่เอกสาร</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleAdd} className="space-y-2 bg-gold-50/40 border border-gold-200 rounded-lg p-3">
            <div className="flex gap-2">
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
            </div>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
            >
              <option value="">-- สร้างเป็นหมวดหมู่หลัก --</option>
              {mainCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  สร้างเป็นหมวดหมู่ย่อยของ: {c.name}
                </option>
              ))}
            </select>
          </form>

          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
            {tree.map((main) => (
              <div key={main.id}>
                <CategoryRow cat={main} />
                {main.children.map((sub) => (
                  <CategoryRow key={sub.id} cat={sub} isSub />
                ))}
              </div>
            ))}
            {tree.length === 0 && (
              <li className="px-3 py-4 text-center text-slate-400 text-sm">ยังไม่มีหมวดหมู่</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
