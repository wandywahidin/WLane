// Satu-satunya modul yang boleh menyentuh client.storage.
// Pindah ke Cloudflare R2 nanti cukup mengganti isi file ini.
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'step-images'
const PLACEHOLDER = '.emptyFolderPlaceholder'

export function imagePath(userId: string, demoId: string): string {
  return `${userId}/${demoId}/${crypto.randomUUID()}.webp`
}

export async function uploadImage(client: SupabaseClient, path: string, blob: Blob): Promise<void> {
  const { error } = await client.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false })
  if (error) throw error
}

export async function deleteImages(client: SupabaseClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { error } = await client.storage.from(BUCKET).remove(paths)
  if (error) throw error
}

export async function listDemoImages(client: SupabaseClient, userId: string, demoId: string): Promise<string[]> {
  const folder = `${userId}/${demoId}`
  const { data, error } = await client.storage.from(BUCKET).list(folder, { limit: 1000 })
  if (error) throw error
  return (data ?? []).filter(o => o.name !== PLACEHOLDER).map(o => `${folder}/${o.name}`)
}

export function publicImageUrl(client: SupabaseClient, path: string): string {
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
