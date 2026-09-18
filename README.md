# ระบบเผยแพร่เอกสารออนไลน์ — งานบริหารบุคคล มหาวิทยาลัยราชภัฏศรีสะเกษ

Stack: **React (Vite) + Tailwind CSS + Supabase + Netlify**

---

## โครงสร้างโปรเจกต์

```
doc-publish/
├── supabase/
│   └── schema.sql          ← รันใน Supabase SQL Editor ก่อนเปิดใช้งาน
├── src/
│   ├── lib/supabaseClient.js
│   ├── hooks/useAuth.jsx
│   ├── components/
│   │   ├── DocumentCard.jsx
│   │   ├── DocumentFormModal.jsx
│   │   ├── DocumentTable.jsx
│   │   ├── CategoryManagerModal.jsx
│   │   └── StatCard.jsx
│   ├── pages/
│   │   ├── PublicLibrary.jsx     ← หน้าเว็บสาธารณะ "/"
│   │   ├── AdminLogin.jsx        ← "/admin/login"
│   │   └── AdminDashboard.jsx    ← "/admin" (ต้องล็อกอิน+เป็น admin)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── netlify.toml
├── public/_redirects
└── .env.example
```

---

## ขั้นตอนที่ 1: ตั้งค่า Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com)
2. ไปที่ **SQL Editor** → วางเนื้อหาทั้งหมดจากไฟล์ `supabase/schema.sql` แล้วกด Run
   - สคริปต์นี้จะสร้างตาราง `categories`, `documents`, `admin_profiles`,
     ฟังก์ชัน `increment_download_count` (นับยอดดาวน์โหลดแบบ atomic กัน race condition),
     ตั้งค่า RLS ให้ public อ่านได้อย่างเดียว ส่วน insert/update/delete ทำได้เฉพาะ admin,
     สร้าง Storage bucket ชื่อ `documents` พร้อม policy, และใส่หมวดหมู่เริ่มต้นให้ 5 หมวด
3. สร้างบัญชีแอดมินคนแรก:
   - ไปที่ **Authentication → Users → Add User** กรอกอีเมล/รหัสผ่าน
   - คัดลอก **User UID** ที่ได้
   - กลับไปที่ SQL Editor รันคำสั่ง (แก้ไขค่าตามจริง):
     ```sql
     insert into public.admin_profiles (id, full_name)
     values ('PASTE-USER-UID-HERE', 'ชื่อผู้ดูแลระบบ');
     ```
4. ไปที่ **Project Settings → API** คัดลอกค่า:
   - `Project URL` → ใช้เป็น `VITE_SUPABASE_URL`
   - `anon public key` → ใช้เป็น `VITE_SUPABASE_ANON_KEY`

> **หมายเหตุความปลอดภัย:** ใช้เฉพาะ `anon` key ในฝั่ง frontend เท่านั้น
> ห้ามนำ `service_role` key มาใส่ในโค้ดฝั่ง client เด็ดขาด

---

## ขั้นตอนที่ 2: รันโปรเจกต์บนเครื่อง (Local Development)

```bash
npm install
cp .env.example .env
# แก้ไข .env ให้เป็นค่าจริงจาก Supabase
npm run dev
```

เปิด `http://localhost:5173`
- หน้าแรก `/` = ห้องสมุดเอกสารสาธารณะ
- `/admin/login` = หน้าล็อกอินแอดมิน (มีลิงก์อยู่ล่างสุดของหน้าแรกด้วย)

---

## ขั้นตอนที่ 3: Deploy ขึ้น Netlify

### วิธีที่ 1 — เชื่อมกับ Git repository (แนะนำ)
1. Push โค้ดขึ้น GitHub/GitLab
2. Netlify → **Add new site → Import an existing project**
3. เลือก repository นี้ Netlify จะอ่านค่า build จาก `netlify.toml` ให้อัตโนมัติ
   (`npm run build`, publish directory `dist`)
4. ไปที่ **Site settings → Environment variables** เพิ่ม:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. กด **Deploy site**

### วิธีที่ 2 — Deploy ผ่าน Netlify CLI
```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```
(ต้องตั้งค่า Environment variables ผ่าน Netlify Dashboard หรือ `netlify env:set` ก่อน build)

---

## ฟีเจอร์ที่ครบตามที่ต้องการ

**ฝั่งผู้ใช้งานทั่วไป**
- ค้นหาแบบ real-time (ชื่อเรื่อง/รายละเอียด/คีย์เวิร์ด)
- กรองตามหมวดหมู่
- แสดงยอดดาวน์โหลด, วันที่อัปเดต, ขนาดไฟล์
- นับยอดดาวน์โหลดแบบ atomic ผ่าน Postgres function `increment_download_count`
  (ป้องกัน race condition เมื่อมีคนกดดาวน์โหลดพร้อมกันหลายคน) และอัปเดตตัวเลขบนหน้าเว็บทันทีโดยไม่ต้อง refresh
- ปุ่มดูตัวอย่างสำหรับไฟล์ PDF (เปิดแท็บใหม่) และปุ่มดาวน์โหลด
- Responsive ทุกขนาดหน้าจอ

**ฝั่งผู้ดูแลระบบ**
- ล็อกอินผ่าน Supabase Auth + ตรวจสอบสิทธิ์ admin ผ่านตาราง `admin_profiles`
- Dashboard สรุปสถิติ: จำนวนเอกสาร, จำนวนหมวดหมู่, ยอดดาวน์โหลดรวม
- ตารางเอกสารพร้อมยอดดาวน์โหลดรายเอกสาร, สถานะเผยแพร่/ซ่อน (toggle ได้ทันที)
- ฟอร์มอัปโหลด/แก้ไขเอกสาร (อัปโหลดไฟล์ไปยัง Supabase Storage, แก้ไขแล้วลบไฟล์เก่าอัตโนมัติ)
- ลบเอกสาร (ลบทั้งแถวข้อมูลและไฟล์ใน Storage)
- จัดการหมวดหมู่ได้ครบ (เพิ่ม/แก้ไข/ลบ)

**ความปลอดภัย**
- RLS เปิดใช้งานทุกตาราง: public เห็นเฉพาะเอกสารที่ `is_published = true`,
  เขียน/แก้ไข/ลบได้เฉพาะบัญชีที่อยู่ในตาราง `admin_profiles`
- Storage bucket policy แยกสิทธิ์ read (public) และ write (admin เท่านั้น)
- ฟังก์ชันนับดาวน์โหลดเป็น `SECURITY DEFINER` ที่ทำงานเฉพาะ atomic update เท่านั้น
  ไม่เปิดช่องให้แก้ไขข้อมูลอื่น

---

## การปรับแต่งเพิ่มเติมที่แนะนำ

- เพิ่ม pagination หรือ infinite scroll หากจำนวนเอกสารเกิน ~100 รายการ
- เพิ่มระบบแจ้งเตือนอีเมลเมื่อมีเอกสารใหม่ (ต่อยอดด้วย Netlify Functions + Gmail SMTP ได้ในรูปแบบเดียวกับระบบขอเลขบันทึกข้อความ)
- เพิ่มกราฟสรุปยอดดาวน์โหลดรายหมวดหมู่ด้วย Chart.js บนหน้า Dashboard
