-- ============================================================================
-- Migration: เพิ่มระบบหมวดหมู่หลัก/หมวดหมู่ย่อย (Parent/Sub categories)
-- รันไฟล์นี้ใน Supabase SQL Editor สำหรับโปรเจกต์ที่เคย deploy schema.sql ไปแล้ว
-- (ถ้าเพิ่งเริ่มติดตั้งใหม่ ไม่ต้องรันไฟล์นี้ เพราะ schema.sql ล่าสุดมีอยู่แล้ว)
-- ============================================================================

alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete cascade;

create index if not exists idx_categories_parent on public.categories(parent_id);

-- ป้องกันการวนลูป: หมวดหมู่ย่อยห้ามมีหมวดหมู่ย่อยของตัวเอง (จำกัดความลึกแค่ 2 ชั้น)
-- (บังคับใช้ในระดับแอปพลิเคชัน ไม่ได้บังคับด้วย constraint เพื่อความยืดหยุ่น)

-- ตัวอย่าง: เพิ่มหมวดหมู่ย่อยให้กับหมวดหมู่ "แบบฟอร์มงานบริหารบุคคล"
-- แก้ 'PARENT-CATEGORY-UUID' เป็น id จริงของหมวดหมู่หลักที่ต้องการ (ดูได้จากตาราง categories)
--
-- insert into public.categories (name, slug, parent_id, sort_order) values
--   ('แบบฟอร์มลา', 'forms-leave', 'PARENT-CATEGORY-UUID', 1),
--   ('แบบฟอร์มสวัสดิการ', 'forms-welfare', 'PARENT-CATEGORY-UUID', 2);
