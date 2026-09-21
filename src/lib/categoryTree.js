// รับ array ของหมวดหมู่แบบ flat (มี id, parent_id) แล้วจัดกลุ่มเป็น
// [{ ...mainCategory, children: [subCategory, ...] }, ...]
export function buildCategoryTree(categories) {
  const mains = categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  return mains.map((main) => ({
    ...main,
    children: categories
      .filter((c) => c.parent_id === main.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }))
}

// คืนค่า id ของหมวดหมู่นั้นเองรวมถึงหมวดหมู่ย่อยทั้งหมด (ใช้สำหรับ filter เอกสาร
// เมื่อเลือกหมวดหมู่หลักโดยยังไม่ได้เจาะจงหมวดหมู่ย่อย)
export function categoryAndDescendantIds(categories, categoryId) {
  const ids = [categoryId]
  categories.forEach((c) => {
    if (c.parent_id === categoryId) ids.push(c.id)
  })
  return ids
}

// path เต็มของหมวดหมู่ เช่น "แบบฟอร์มงานบริหารบุคคล > แบบฟอร์มลา"
export function categoryPathLabel(categories, categoryId) {
  const cat = categories.find((c) => c.id === categoryId)
  if (!cat) return null
  if (!cat.parent_id) return cat.name
  const parent = categories.find((c) => c.id === cat.parent_id)
  return parent ? `${parent.name} › ${cat.name}` : cat.name
}
