import { describe, expect, it } from 'vitest'
import { createProjectSchema, loginRequestSchema } from './schemas'

describe('shared validation schemas', () => {
  it('accepts valid login input', () => {
    const result = loginRequestSchema.safeParse({
      email: 'user@example.com',
      password: 'secure-password',
    })

    expect(result.success).toBe(true)
  })

  it('rejects malformed login input', () => {
    const result = loginRequestSchema.safeParse({
      email: 'not-an-email',
      password: 'short',
    })

    expect(result.success).toBe(false)
  })

  it('applies project defaults', () => {
    const result = createProjectSchema.parse({
      name: '2025 Calendar',
      year: 2025,
    })

    expect(result.weekStartsOn).toBe('monday')
  })

  it('rejects projects outside the supported year range', () => {
    const result = createProjectSchema.safeParse({
      name: 'Future Calendar',
      year: 2051,
    })

    expect(result.success).toBe(false)
  })
})
