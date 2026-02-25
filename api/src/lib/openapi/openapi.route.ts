import type { HttpResponse } from '../../models'
import { generateOpenAPISpec } from './openapi.spec'

export function handleOpenAPIJson(): HttpResponse {
  try {
    const spec = generateOpenAPISpec()

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
      body: spec,
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate OpenAPI specification',
        },
      },
    }
  }
}