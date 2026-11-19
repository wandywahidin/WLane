import type { Demo, DemoStatus } from '../types/demo'

export function demoStatus(demo: Pick<Demo, 'status' | 'published_at' | 'updated_at'>): DemoStatus {
  if (demo.status !== 'published' || !demo.published_at) return 'draft'
  return Date.parse(demo.updated_at) > Date.parse(demo.published_at) ? 'published_dirty' : 'published'
}

export const DEMO_STATUS_LABEL: Record<DemoStatus, string> = {
  draft: 'Draft',
  published: 'Terbit',
  published_dirty: 'Terbit, ada perubahan belum diterbitkan',
}
