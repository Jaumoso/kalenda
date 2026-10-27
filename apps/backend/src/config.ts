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

export function getSecret(name: string, developmentFallback: string): string {
  const value = process.env[name]
  if (value) return value

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be configured in production`)
  }

  return developmentFallback
}
