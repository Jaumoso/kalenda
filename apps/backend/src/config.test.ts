import { afterEach, describe, expect, it, vi } from 'vitest'
<<<<<<< HEAD
import { getSecret } from './config.js'
=======
import { getSecret, isUserRegistrationEnabled } from './config.js'
>>>>>>> origin/dev

describe('getSecret', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

<<<<<<< HEAD
=======
  describe('isUserRegistrationEnabled', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it.each(['1', 'true', 'TRUE', 'yes', 'on'])('accepts %s as enabled', (value) => {
      vi.stubEnv('ALLOW_USER_REGISTRATION', value)

      expect(isUserRegistrationEnabled()).toBe(true)
    })

    it('is disabled by default', () => {
      vi.stubEnv('ALLOW_USER_REGISTRATION', '')

      expect(isUserRegistrationEnabled()).toBe(false)
    })

    it('rejects unsupported values', () => {
      vi.stubEnv('ALLOW_USER_REGISTRATION', 'enabled')

      expect(isUserRegistrationEnabled()).toBe(false)
    })
  })

>>>>>>> origin/dev
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
