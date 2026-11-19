/** File tersimpan yang tidak dipakai draft maupun snapshot terbit, jadi aman dihapus. */
export function orphanedImages(stored: string[], draftPaths: string[], snapshotPaths: string[]): string[] {
  const used = new Set([...draftPaths, ...snapshotPaths])
  return stored.filter(p => !used.has(p))
}
