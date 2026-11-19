/** Salinan list dengan elemen di `from` dipindah ke `to`. Array asli tidak diubah. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const copy = list.slice()
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item as T)
  return copy
}
