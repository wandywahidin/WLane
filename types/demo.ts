export type TooltipPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right'
export type StepKind = 'hotspot' | 'modal'
export type ButtonAction = 'next' | 'back' | 'link'
export interface StepButton { label: string; action: ButtonAction; url?: string; primary?: boolean }
export interface Step { id: string; demo_id: string; position: number; image_path: string;
  image_width: number; image_height: number; hotspot_x: number | null; hotspot_y: number | null;
  tooltip_text: string; tooltip_placement: TooltipPlacement;
  kind: StepKind; area_w: number | null; area_h: number | null;
  modal_title: string; modal_body: string; buttons: StepButton[] }
export type SnapshotStep = Omit<Step, 'id' | 'demo_id' | 'position'>
export interface Demo { id: string; owner_id: string; title: string; slug: string;
  status: 'draft' | 'published'; published_snapshot: SnapshotStep[] | null;
  published_at: string | null; created_at: string; updated_at: string }
export interface DemoListItem extends Demo { thumbnail_path: string | null; step_count: number }
export type DemoStatus ='draft' | 'published' | 'published_dirty'
export interface PublishedDemo { title: string; slug: string; steps: SnapshotStep[] }
