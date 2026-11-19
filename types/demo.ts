export type TooltipPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right'
export interface Step { id: string; demo_id: string; position: number; image_path: string;
  image_width: number; image_height: number; hotspot_x: number | null; hotspot_y: number | null;
  tooltip_text: string; tooltip_placement: TooltipPlacement }
export type SnapshotStep = Omit<Step, 'id' | 'demo_id' | 'position'>
export interface Demo { id: string; owner_id: string; title: string; slug: string;
  status: 'draft' | 'published'; published_snapshot: SnapshotStep[] | null;
  published_at: string | null; created_at: string; updated_at: string }
export type DemoStatus = 'draft' | 'published' | 'published_dirty'
export interface PublishedDemo { title: string; slug: string; steps: SnapshotStep[] }
