export const rateLimitConfig = {
  default: {
    max: 100,
    timeWindow: '1 minute',
  },
  strict: {
    max: 30,
    timeWindow: '1 minute',
  },
  login: {
    max: 5,
    timeWindow: '1 minute',
  },
}

export function isUserRegistrationEnabled(): boolean {
  return ['1', 'true', 'yes', 'on'].includes(
    (process.env.ALLOW_USER_REGISTRATION ?? 'false').trim().toLowerCase()
  )
}

export function getSecret(name: string, developmentFallback: string): string {
  const value = process.env[name]
  if (value) return value

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be configured in production`)
  }

  return developmentFallback
}
