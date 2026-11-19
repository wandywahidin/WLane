import type { SupabaseClient } from '@supabase/supabase-js'
import { deleteImages, listDemoImages } from '../utils/image-store'

/**
 * Hapus akun: gambar semua demo dulu (Storage tidak ikut cascade), lalu RPC
 * delete_my_account (demo dan langkah ikut cascade), lalu keluar.
 */
export async function deleteAccount(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.from('demos').select('id, owner_id')
  if (error) throw error
  for (const demo of (data ?? []) as Array<{ id: string; owner_id: string }>) {
    await deleteImages(client, await listDemoImages(client, demo.owner_id, demo.id))
  }
  const { error: rpcError } = await client.rpc('delete_my_account')
  if (rpcError) throw rpcError
  await client.auth.signOut()
}
