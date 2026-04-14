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