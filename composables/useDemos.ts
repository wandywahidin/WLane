import { ref } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Demo } from '../types/demo'
import { deleteImages, listDemoImages } from '../utils/image-store'
import { readConfigInt } from '../utils/app-config'
import { randomSlug } from '../utils/slug'

const SLUG_RETRIES = 3

export function useDemos(client: SupabaseClient = useSupabaseClient()) {
  const demos = ref<Demo[]>([])
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    error.value = null
    const { data, error: e } = await client.from('demos').select('*').order('updated_at', { ascending: false })
    if (e) {
      error.value = 'Gagal memuat demo'
      throw e
    }
    demos.value = (data ?? []) as Demo[]
  }

  async function create(title: string): Promise<Demo> {
    error.value = null
    for (let attempt = 0; attempt <= SLUG_RETRIES; attempt++) {
      const { data, error: e } = await client
        .from('demos')
        .insert({ title, slug: randomSlug() })
        .select()
        .single()
      if (!e) {
        const demo = data as Demo
        demos.value = [demo, ...demos.value]
        return demo
      }
      if (e.code === '23505') continue // slug bentrok, coba slug lain
      if (e.message?.includes('LIMIT_DEMOS')) {
        const max = await readConfigInt(client, 'max_demos_per_user', 5)
        error.value = `Batas ${max} demo tercapai`
      } else {
        error.value = 'Gagal membuat demo'
      }
      throw e
    }
    error.value = 'Gagal membuat demo'
    throw new Error('SLUG_EXHAUSTED')
  }

  async function remove(id: string): Promise<void> {
    error.value = null
    let ownerId = demos.value.find(d => d.id === id)?.owner_id
    if (!ownerId) {
      const { data } = await client.from('demos').select('owner_id').eq('id', id).single()
      ownerId = (data as { owner_id?: string } | null)?.owner_id
    }
    try {
      if (ownerId) await deleteImages(client, await listDemoImages(client, ownerId, id))
      const { error: e } = await client.from('demos').delete().eq('id', id)
      if (e) throw e
    } catch (e) {
      error.value = 'Gagal menghapus demo'
      throw e
    }
    demos.value = demos.value.filter(d => d.id !== id)
  }

  return { demos, load, create, remove, error }
}
