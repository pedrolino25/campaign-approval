import { logger } from '../logger'

export class RequestParser {
  parseQueryParameters(
    queryStringParameters: Record<string, string | undefined> | null
  ): Record<string, string> {
    if (!queryStringParameters) {
      return {}
    }

    const parsed: Record<string, string> = {}

    for (const [key, value] of Object.entries(queryStringParameters)) {
      if (value !== null && value !== undefined) {
        parsed[key] = value
      }
    }

    return parsed
  }

  parseBody(body: string | null | undefined): unknown {
    if (!body) {
      return undefined
    }

    try {
      return JSON.parse(body) as unknown
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          body,
        },
        'Failed to parse request body'
      )
      throw new Error('Invalid JSON in request body')
    }
  }
}
