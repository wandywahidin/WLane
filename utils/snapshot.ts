import type { SnapshotStep } from '../types/demo'

/** Snapshot lama tanpa field baru dianggap sorotan berbentuk titik. */
export function normalizeSnapshotStep(
  s: Partial<SnapshotStep> & Pick<SnapshotStep, 'image_path' | 'image_width' | 'image_height'>,
): SnapshotStep {
  return {
    hotspot_x: null,
    hotspot_y: null,
    ...s,
    kind: s.kind ?? 'hotspot',
    area_w: s.area_w ?? null,
    area_h: s.area_h ?? null,
    modal_title: s.modal_title ?? '',
    modal_body: s.modal_body ?? '',
    buttons: s.buttons ?? [],
    tooltip_text: s.tooltip_text ?? '',
    tooltip_placement: s.tooltip_placement ?? 'auto',
  }
}
