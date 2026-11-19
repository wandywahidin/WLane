import { describe, expect, it } from 'vitest'
import { embedCode, publicDemoUrl } from '../../utils/embed'

describe('embed', () => {
  it('publicDemoUrl', () => {
    expect(publicDemoUrl('https://contoh.id', 'abcd1234')).toBe('https://contoh.id/d/abcd1234')
  })

  it('embedCode persis seperti di plan', () => {
    expect(embedCode('https://contoh.id', 'abcd1234')).toBe(
      '<iframe src="https://contoh.id/d/abcd1234?embed=1" style="width:100%;aspect-ratio:16/10;border:0" allowfullscreen></iframe>',
    )
  })
})
