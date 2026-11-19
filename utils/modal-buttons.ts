import type { StepButton } from '../types/demo'

export const MAX_BUTTONS = 2
export const DEFAULT_MODAL_BUTTON: StepButton = { label: 'Lanjut', action: 'next', primary: true }
export const EXTRA_MODAL_BUTTON: StepButton = { label: 'Kembali', action: 'back', primary: false }

export function isSafeUrl(url: string | undefined): boolean {
  return typeof url === 'string' && /^https:\/\/\S+$/.test(url)
}

export function buttonIssues(b: StepButton): Array<'label' | 'url'> {
  const issues: Array<'label' | 'url'> = []
  if (!b.label || b.label.trim() === '') issues.push('label')
  if (b.action === 'link' && !isSafeUrl(b.url)) issues.push('url')
  return issues
}
