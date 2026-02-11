import pino from 'pino'

export const logger = pino({
  level: 'info',
  formatters: {
    level: (label: string) => {
      return { level: label }
    },
  },
})
