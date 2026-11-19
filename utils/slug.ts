const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
// 252 = 36 * 7: byte di atas ini dibuang supaya tiap karakter sama peluangnya.
const LIMIT = 252

/** Slug acak 8 karakter [a-z0-9] dari crypto.getRandomValues. */
export function randomSlug(length = 8): string {
  let out = ''
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2))
    for (const b of bytes) {
      if (b < LIMIT && out.length < length) out += ALPHABET[b % ALPHABET.length]
    }
  }
  return out
}
