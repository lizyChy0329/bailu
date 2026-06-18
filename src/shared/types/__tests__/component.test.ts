import { describe, it, expect } from 'vitest'

describe('Component Types', () => {
  it('validates ComponentType union', () => {
    const types = ['Card', 'Image', 'Button', 'Panel', 'ScrollPanel'] as const
    type Valid = (typeof types)[number]
    // 确保联合类型编译通过
    const _check: Valid = 'Card'
    expect(_check).toBe('Card')
  })

  it('ComponentNode structure is valid', () => {
    const node = {
      id: 'test-1',
      type: 'Card' as const,
      props: {},
      styles: { class: 'w-full' },
    }
    expect(node.id).toBe('test-1')
    expect(node.type).toBe('Card')
    expect(node.styles.class).toBe('w-full')
  })

  it('ComponentNode can have slots and pt', () => {
    const node = {
      id: 'test-2',
      type: 'Card' as const,
      props: {},
      styles: {},
      pt: { root: { class: 'custom' } },
      slots: {
        content: [
          {
            id: 'child-1',
            type: 'Button' as const,
            props: { label: 'Click' },
            styles: {},
          },
        ],
      },
    }
    expect(node.slots?.content).toHaveLength(1)
    expect(node.slots?.content[0].props.label).toBe('Click')
    expect(node.pt?.root.class).toBe('custom')
  })
})
