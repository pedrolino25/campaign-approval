import { buildOpenAPISpec } from './openapi.builder'


export function generateOpenAPISpec(): Record<string, unknown> {
  return buildOpenAPISpec()
}
