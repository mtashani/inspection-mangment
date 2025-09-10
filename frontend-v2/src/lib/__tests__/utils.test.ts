import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('handles conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class')
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class')
    })

    it('handles undefined and null values', () => {
      expect(cn('base-class', undefined, null)).toBe('base-class')
    })

    it('handles empty input', () => {
      expect(cn()).toBe('')
    })

    it('handles arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })
  })
})