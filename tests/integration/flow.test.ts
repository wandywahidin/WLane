// Alur lengkap terhadap Supabase lokal: buat demo → langkah → terbit → baca publik →
// batal terbit → hapus demo → hapus akun. Login Google digantikan JWT yang ditandatangani
// dengan JWT secret lokal (hanya berlaku di `supabase start`).
import { createHmac, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

vi.mock('../../utils/image-compress', () => ({
  // Kompresi canvas tidak ada di Node; kembalikan WebP kecil yang sudah jadi.
  prepareImages: vi.fn(async (files: File[]) => files.map(file => ({
    file,
    result: { blob: new Blob([new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80])], { type: 'image/webp' }), width: 1600, height: 1000 },
  }))),
}))

import { useDemos } from '../../composables/useDemos'
import { useEditor } from '../../composables/useEditor'
import { deleteAccount } from '../../composables/useAccount'
import { listDemoImages } from '../../utils/image-store'

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ANON = process.env.SUPABASE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE = process.env.SUPABASE_SERVICE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long'

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
function signJwt(sub: string): string {
  const head = b64({ alg: 'HS256', typ: 'JWT' })
  const body = b64({ sub, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })
  const sig = createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url')
  return `${head}.${body}.${sig}`
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(URL, SERVICE, opts)
const anon = createClient(URL, ANON, opts)
let user: SupabaseClient
let userId: string

const png = (name: string) => new File(['x'], name, { type: 'image/png' })

beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({ email: `flow-${randomUUID()}@test.local`, email_confirm: true })
  if (error) throw error
  userId = data.user.id
  user = createClient(URL, ANON, { ...opts, global: { headers: { Authorization: `Bearer ${signJwt(userId)}` } } })
})

afterAll(async () => {
  await admin.auth.admin.deleteUser(userId).catch(() => {})
})

describe('alur pembuat demo (Supabase lokal)', () => {
  let demoId = ''
  let slug = ''

  it('membuat demo, menambah langkah, autosave, urutan, terbit, baca publik', async () => {
    const demos = useDemos(user)
    const demo = await demos.create('Integrasi')
    demoId = demo.id
    slug = demo.slug
    expect(slug).toMatch(/^[a-z0-9]{8}$/)

    const editor = useEditor(demoId, { client: user, debounceMs: 10 })
    await editor.load()
    const failed = await editor.addImages([png('1.png'), png('2.png'), png('3.png')])
    expect(failed).toEqual([])
    expect(editor.steps.value).toHaveLength(3)
    expect(await listDemoImages(user, userId, demoId)).toHaveLength(3)

    const [s1, s2, s3] = editor.steps.value
    editor.updateStep(s1!.id, { hotspot_x: 10, hotspot_y: 10, tooltip_text: 'satu' })
    editor.updateStep(s2!.id, { hotspot_x: 20, hotspot_y: 20, tooltip_text: 'dua' })
    editor.updateStep(s3!.id, { hotspot_x: 30, hotspot_y: 30, tooltip_text: 'tiga' })
    expect(await editor.flush()).toBe(true)

    await editor.reorder(0, 2) // dua, tiga, satu
    await editor.removeStep(s2!.id) // tiga, satu — file 'dua' belum dihapus
    expect(await listDemoImages(user, userId, demoId)).toHaveLength(3)

    await editor.publish()
    expect(editor.publishError.value).toBeNull()

    const { data: pub } = await anon.rpc('get_published_demo', { p_slug: slug })
    expect(pub.steps.map((s: { tooltip_text: string }) => s.tooltip_text)).toEqual(['tiga', 'satu'])
    // file langkah yang dihapus kini yatim dan dibersihkan saat terbit
    expect(await listDemoImages(user, userId, demoId)).toHaveLength(2)

    const { data: positions } = await user.from('steps').select('position').eq('demo_id', demoId).order('position')
    expect(positions!.map(p => p.position)).toEqual([0, 1])
  })

  it('terbit ditolak kalau ada langkah tanpa hotspot; draft tidak bocor ke publik', async () => {
    const editor = useEditor(demoId, { client: user, debounceMs: 10 })
    await editor.load()
    await editor.addImages([png('4.png')])
    editor.updateStep(editor.steps.value[0]!.id, { tooltip_text: 'tiga (edit draft)' })
    await editor.publish()
    expect(editor.publishError.value).toBe('Langkah 3 belum punya hotspot')

    const { data: pub } = await anon.rpc('get_published_demo', { p_slug: slug })
    expect(pub.steps[0].tooltip_text).toBe('tiga')
    const { data: d } = await user.from('demos').select('status, published_at, updated_at').eq('id', demoId).single()
    expect(Date.parse(d!.updated_at)).toBeGreaterThan(Date.parse(d!.published_at))

    const { error: anonSteps } = await anon.from('steps').select('*')
    expect(anonSteps).not.toBeNull()
  })

  it('batal terbit → publik null; hapus demo → semua file hilang', async () => {
    const editor = useEditor(demoId, { client: user })
    await editor.load()
    await editor.unpublish()
    const { data: pub } = await anon.rpc('get_published_demo', { p_slug: slug })
    expect(pub).toBeNull()

    const demos = useDemos(user)
    await demos.load()
    await demos.remove(demoId)
    expect(await listDemoImages(user, userId, demoId)).toEqual([])
    const { data: rows } = await user.from('demos').select('id').eq('id', demoId)
    expect(rows).toEqual([])
  })

  it('langkah modal: draft tak lengkap tersimpan, terbit ditolak; lengkap + sorotan area → terbit', async () => {
    const demos = useDemos(user)
    const demo = await demos.create('Modal')
    const editor = useEditor(demo.id, { client: user, debounceMs: 10 })
    await editor.load()
    await editor.addImages([png('m1.png'), png('m2.png')])
    const [s1, s2] = editor.steps.value

    editor.setKind(s1!.id, 'modal')
    editor.updateStep(s1!.id, { buttons: [{ label: '', action: 'link', url: 'ht', primary: false }] })
    expect(await editor.flush()).toBe(true)
    editor.updateStep(s2!.id, { hotspot_x: 50, hotspot_y: 50, area_w: 16, area_h: 10, tooltip_text: 'area' })
    expect(await editor.flush()).toBe(true)

    await editor.publish()
    expect(editor.publishError.value).toBe('Langkah 1: lengkapi modal (judul, tombol, dan link https://)')

    editor.updateStep(s1!.id, {
      modal_title: 'Selamat datang',
      buttons: [{ label: 'Buka', action: 'link', url: 'https://contoh.id', primary: true }],
    })
    await editor.publish()
    expect(editor.publishError.value).toBeNull()

    const { data: pub } = await anon.rpc('get_published_demo', { p_slug: demo.slug })
    const kinds = pub.steps.map((s: { kind: string }) => s.kind)
    expect(kinds).toContain('modal')
    expect(pub.steps.find((s: { area_w: number | null }) => s.area_w === 16)).toBeTruthy()

    await demos.remove(demo.id)
  })

  it('hapus akun menghapus user, demo, dan gambar', async () => {
    const demos = useDemos(user)
    const demo = await demos.create('Akan dihapus')
    const editor = useEditor(demo.id, { client: user })
    await editor.load()
    await editor.addImages([png('a.png')])
    expect(await listDemoImages(user, userId, demo.id)).toHaveLength(1)

    await deleteAccount(user)

    const { data: u } = await admin.auth.admin.getUserById(userId)
    expect(u.user).toBeNull()
    const { data: objs } = await admin.storage.from('step-images').list(`${userId}/${demo.id}`)
    expect((objs ?? []).filter(o => o.name !== '.emptyFolderPlaceholder')).toEqual([])
  })
})
