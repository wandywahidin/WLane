const clamp = (v: number) => Math.min(100, Math.max(0, v))
const round2 = (v: number) => Math.round(v * 100) / 100

/** Klik (koordinat layar) → posisi hotspot dalam persen gambar, dibatasi 0–100, 2 desimal. */
export function clickToPercent(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  return {
    x: round2(clamp(((clientX - rect.left) / rect.width) * 100)),
    y: round2(clamp(((clientY - rect.top) / rect.height) * 100)),
  }
}
