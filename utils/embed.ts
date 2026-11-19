export function publicDemoUrl(origin: string, slug: string): string {
  return `${origin}/d/${slug}`
}

/** Kode iframe yang sama dipakai editor (tombol salin) dan landing page (demo contoh). */
export function embedCode(origin: string, slug: string): string {
  return `<iframe src="${publicDemoUrl(origin, slug)}?embed=1" style="width:100%;aspect-ratio:16/10;border:0" allowfullscreen></iframe>`
}
