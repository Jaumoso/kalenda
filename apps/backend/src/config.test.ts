import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSecret } from './config.js'

describe('getSecret', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the configured value when present', () => {
    vi.stubEnv('COOKIE_SECRET', 'configured-secret')
    vi.stubEnv('NODE_ENV', 'production')

    expect(getSecret('COOKIE_SECRET', 'fallback-secret')).toBe('configured-secret')
  })

  it('uses the development fallback outside production', () => {
    vi.stubEnv('COOKIE_SECRET', '')
    vi.stubEnv('NODE_ENV', 'development')

    expect(getSecret('COOKIE_SECRET', 'fallback-secret')).toBe('fallback-secret')
  })

  it('rejects missing secrets in production', () => {
    vi.stubEnv('COOKIE_SECRET', '')
    vi.stubEnv('NODE_ENV', 'production')

    expect(() => getSecret('COOKIE_SECRET', 'fallback-secret')).toThrow(
      'COOKIE_SECRET must be configured in production'
    )
  })
})
