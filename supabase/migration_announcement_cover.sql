-- ============================================================================
-- Migration: รองรับ "หมวดหมู่ประกาศรับสมัครพนักงาน" ที่ต้องมีรูปภาพประจำประกาศ
-- + ลิงก์ใบสมัครพนักงานแนบท้ายประกาศ
-- รันไฟล์นี้ใน Supabase SQL Editor (รันครั้งเดียว)
-- ============================================================================

-- 1) หมวดหมู่ไหนที่ตั้งค่านี้ = true จะบังคับให้แอดมินแนบรูปภาพประจำประกาศ
--    และหน้าเว็บจะเปลี่ยนการแสดงผลเป็นรูปภาพ (แทนไอคอนไฟล์ปกติ)
alter table public.categories
  add column if not exists requires_cover_image boolean not null default false;

-- 2) คอลัมน์สำหรับรูปภาพประจำประกาศ และลิงก์ใบสมัครพนักงาน
alter table public.documents
  add column if not exists cover_image_path      text,
  add column if not exists cover_image_name       text,
  add column if not exists application_form_path  text,
  add column if not exists application_form_name  text;

-- ตัวอย่าง: เปิดใช้งานฟีเจอร์นี้กับหมวดหมู่ย่อย "ประกาศรับสมัครพนักงานมหาวิทยาลัย"
-- แก้ 'CATEGORY-UUID' เป็น id จริงของหมวดหมู่ย่อยนั้น (หรือจะตั้งค่าผ่านหน้าแอดมิน
-- ในฟีเจอร์ "จัดการหมวดหมู่" ก็ได้ ไม่ต้องรัน SQL นี้ก็ได้)
--
-- update public.categories set requires_cover_image = true where id = 'CATEGORY-UUID';
