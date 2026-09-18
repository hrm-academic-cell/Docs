import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing Supabase environment variables. ' +
    'ตรวจสอบว่าได้ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ' +
    'ใน .env (local) หรือ Site settings > Environment variables (Netlify)'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Storage bucket ที่ใช้เก็บไฟล์เอกสารทั้งหมด
export const DOCS_BUCKET = 'documents'

export function getPublicFileUrl(filePath) {
  const { data } = supabase.storage.from(DOCS_BUCKET).getPublicUrl(filePath)
  return data?.publicUrl ?? ''
}
