import { describe, it, expect } from 'vitest'
import { isSafeUrl, buttonIssues, DEFAULT_MODAL_BUTTON, EXTRA_MODAL_BUTTON, MAX_BUTTONS } from '../../utils/modal-buttons'

describe('modal-buttons', () => {
  it('isSafeUrl', () => {
    expect(isSafeUrl('https://a.id')).toBe(true)
    for (const u of ['HTTPS://a.id', 'http://a.id', 'javascript:alert(1)', 'https://', 'https:// a', undefined]) {
      expect(isSafeUrl(u as string | undefined)).toBe(false)
    }
  })
  it('buttonIssues', () => {
    expect(buttonIssues({ label: ' ', action: 'link', url: 'ht' })).toEqual(['label', 'url'])
    expect(buttonIssues({ label: 'Lanjut', action: 'next' })).toEqual([])
    expect(buttonIssues({ label: 'Buka', action: 'link', url: 'https://a.id' })).toEqual([])
  })
  it('constants', () => {
    expect(MAX_BUTTONS).toBe(2)
    expect(DEFAULT_MODAL_BUTTON).toEqual({ label: 'Lanjut', action: 'next', primary: true })
    expect(EXTRA_MODAL_BUTTON).toEqual({ label: 'Kembali', action: 'back', primary: false })
  })
})
