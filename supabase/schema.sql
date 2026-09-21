-- ============================================================================
-- ระบบเผยแพร่เอกสารออนไลน์ งานบริหารบุคคล มหาวิทยาลัยราชภัฏศรีสะเกษ
-- Supabase SQL Schema
-- รันคำสั่งทั้งหมดนี้ใน Supabase Dashboard > SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. TABLE: categories
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null unique,        -- ชื่อหมวดหมู่ เช่น "ประกาศ / คำสั่ง"
  slug         text not null unique,        -- ใช้สำหรับ filter ใน URL เช่น announcement
  parent_id    uuid references public.categories(id) on delete cascade, -- null = หมวดหมู่หลัก
  requires_cover_image boolean not null default false, -- true = บังคับแนบรูปภาพประจำประกาศ (เช่น ประกาศรับสมัครงาน)
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_categories_parent on public.categories(parent_id);

-- ----------------------------------------------------------------------------
-- 3. TABLE: documents
-- ----------------------------------------------------------------------------
create table if not exists public.documents (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text default '',
  keywords        text default '',              -- คำคีย์เวิร์ดสำหรับค้นหา
  category_id     uuid references public.categories(id) on delete set null,
  file_path       text not null,                 -- path ใน Supabase Storage bucket
  file_name       text not null,                 -- ชื่อไฟล์ต้นฉบับ
  file_size       bigint default 0,               -- bytes
  download_count  bigint not null default 0,
  is_published    boolean not null default true,
  cover_image_path      text,      -- รูปภาพประจำประกาศ (สำหรับหมวดหมู่ที่ requires_cover_image = true)
  cover_image_name      text,
  application_form_path text,      -- ลิงก์ใบสมัครพนักงานแนบท้ายประกาศ (ถ้ามี)
  application_form_name text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_documents_category on public.documents(category_id);
create index if not exists idx_documents_published on public.documents(is_published);
-- full text search index (ไทย+อังกฤษ แบบง่าย ใช้ simple config เพื่อรองรับคำไทย)
create index if not exists idx_documents_search on public.documents
  using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(keywords,'')));

-- ----------------------------------------------------------------------------
-- 4. Trigger: auto-update updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Function: increment_download_count (Atomic, ป้องกัน Race Condition)
--    SECURITY DEFINER เพื่อให้ public เรียกได้โดยไม่ต้องมีสิทธิ์ UPDATE โดยตรง
-- ----------------------------------------------------------------------------
create or replace function public.increment_download_count(doc_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update public.documents
  set download_count = download_count + 1
  where id = doc_id and is_published = true
  returning download_count into new_count;

  if new_count is null then
    raise exception 'Document not found or not published';
  end if;

  return new_count;
end;
$$;

-- อนุญาตให้ role anon และ authenticated เรียกฟังก์ชันนี้ได้
grant execute on function public.increment_download_count(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. TABLE: admin_profiles (เชื่อมกับ auth.users เพื่อระบุว่าใครเป็นแอดมิน)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- helper function: เช็คว่า user ปัจจุบันเป็น admin หรือไม่
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles where id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.documents enable row level security;
alter table public.admin_profiles enable row level security;

-- categories: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- documents: public อ่านได้เฉพาะที่ published, admin อ่าน/เขียนได้ทั้งหมด
drop policy if exists "documents_public_read" on public.documents;
create policy "documents_public_read"
  on public.documents for select
  to anon, authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "documents_admin_write" on public.documents;
create policy "documents_admin_write"
  on public.documents for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "documents_admin_update" on public.documents;
create policy "documents_admin_update"
  on public.documents for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "documents_admin_delete" on public.documents;
create policy "documents_admin_delete"
  on public.documents for delete
  to authenticated
  using (public.is_admin());

-- admin_profiles: อ่านได้เฉพาะตัวเอง/admin อื่น, เขียนได้เฉพาะผ่าน service role (ตั้งค่าจาก dashboard)
drop policy if exists "admin_profiles_self_read" on public.admin_profiles;
create policy "admin_profiles_self_read"
  on public.admin_profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. STORAGE BUCKET + POLICIES
--    หมายเหตุ: การสร้าง bucket ต้องทำผ่าน Dashboard > Storage หรือรันคำสั่งนี้
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Public อ่านไฟล์ได้ (สำหรับดาวน์โหลด/พรีวิว)
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'documents');

-- Admin เท่านั้นที่อัปโหลด/แก้ไข/ลบไฟล์ได้
drop policy if exists "storage_admin_insert" on storage.objects;
create policy "storage_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and public.is_admin());

drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'documents' and public.is_admin());

drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and public.is_admin());

-- ----------------------------------------------------------------------------
-- 9. ข้อมูลตัวอย่างหมวดหมู่ (ลบทิ้งได้ถ้าไม่ต้องการ)
-- ----------------------------------------------------------------------------
insert into public.categories (name, slug, sort_order) values
  ('ประกาศ / คำสั่ง', 'announcement', 1),
  ('แบบฟอร์มงานบริหารบุคคล', 'forms', 2),
  ('คู่มือและมาตรฐานการปฏิบัติงาน', 'manuals', 3),
  ('เอกสารการเสนอขอดำรงตำแหน่งทางวิชาการ', 'academic-position', 4),
  ('เอกสารการพัฒนาบุคลากร', 'personnel-development', 5)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 10. วิธีสร้างบัญชี Admin คนแรก (ทำหลังรัน schema นี้แล้ว)
-- ----------------------------------------------------------------------------
-- ขั้นตอน:
-- 1) ไปที่ Supabase Dashboard > Authentication > Users > Add User
--    สร้างผู้ใช้ด้วยอีเมล/รหัสผ่านที่ต้องการ แล้วคัดลอก User UID ที่ได้
-- 2) รันคำสั่งนี้ใน SQL Editor (แทนที่ 'PASTE-USER-UID-HERE' และชื่อ):
--
--    insert into public.admin_profiles (id, full_name)
--    values ('PASTE-USER-UID-HERE', 'ชื่อผู้ดูแลระบบ');
--
-- ทำซ้ำขั้นตอนนี้สำหรับ admin คนอื่น ๆ ที่ต้องการเพิ่ม
