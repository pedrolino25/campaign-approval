/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

// Extend Zod with openapi method for backward compatibility
declare module 'zod' {
  interface ZodType {
    openapi(metadata?: { description?: string; example?: unknown; title?: string }): this
  }
}

// Store OpenAPI metadata
const openApiMetadata = new WeakMap<z.ZodType, { description?: string; example?: unknown; title?: string }>()

export function extendZodWithOpenApi(z: { ZodType: { prototype: z.ZodType } }): void {
  z.ZodType.prototype.openapi = function (metadata?: { description?: string; example?: unknown; title?: string }): z.ZodType {
    if (metadata) {
      openApiMetadata.set(this, metadata)
    }
    return this
  }
}

export function getOpenApiMetadata(schema: z.ZodType): { description?: string; example?: unknown; title?: string } | undefined {
  return openApiMetadata.get(schema)
}

// Simple OpenAPI Registry
export class OpenAPIRegistry {
  private components: Record<string, Record<string, unknown>> = {
    schemas: {},
    securitySchemes: {},
  }
  private paths: Record<string, Record<string, unknown>> = {}
  public definitions: Record<string, unknown> = {}

  registerComponent(type: 'schemas' | 'securitySchemes', name: string, schema: z.ZodType | Record<string, unknown>): void {
    if (!this.components[type]) {
      this.components[type] = {}
    }

    const isZodSchema = (s: unknown): s is z.ZodType => {
      return typeof s === 'object' && s !== null && '_def' in s && 'parse' in s
    }

    if (isZodSchema(schema)) {
      // It's a Zod schema
      const jsonSchema = zodToJsonSchema(schema, { target: 'openApi3' }) as Record<string, unknown>
      const metadata = getOpenApiMetadata(schema)
      
      if (metadata) {
        if (metadata.description) {
          jsonSchema.description = metadata.description
        }
        if (metadata.example !== undefined) {
          jsonSchema.example = metadata.example
        }
        if (metadata.title) {
          jsonSchema.title = metadata.title
        }
      }

      this.components[type][name] = jsonSchema
      this.definitions[name] = jsonSchema
    } else {
      // It's a plain object (like security schemes)
      this.components[type][name] = schema
    }
  }

  private buildRequestBody(config: {
    request?: {
      body?: {
        content?: {
          'application/json'?: {
            schema?: z.ZodType
            example?: unknown
          }
        }
      }
    }
  }): Record<string, unknown> | undefined {
    const bodyContent = config.request?.body?.content?.['application/json']
    if (!bodyContent?.schema) {
      return undefined
    }

    const jsonSchema = zodToJsonSchema(bodyContent.schema, { target: 'openApi3' })
    const metadata = getOpenApiMetadata(bodyContent.schema)
    if (metadata?.example !== undefined) {
      jsonSchema.example = metadata.example
    } else if (bodyContent.example !== undefined) {
      jsonSchema.example = bodyContent.example
    }

    return {
      required: true,
      content: {
        'application/json': {
          schema: jsonSchema,
        },
      },
    }
  }

  private buildResponseContent(content?: {
    schema?: z.ZodType
    example?: unknown
  }): Record<string, unknown> | undefined {
    if (!content?.schema) {
      return undefined
    }

    const jsonSchema = zodToJsonSchema(content.schema, { target: 'openApi3' })
    const metadata = getOpenApiMetadata(content.schema)
    if (metadata?.example !== undefined) {
      jsonSchema.example = metadata.example
    } else if (content.example !== undefined) {
      jsonSchema.example = content.example
    }

    return {
      'application/json': {
        schema: jsonSchema,
      },
    }
  }

  private buildResponses(
    responses?: Record<
      string,
      {
        description?: string
        content?: {
          'application/json'?: {
            schema?: z.ZodType
            example?: unknown
          }
        }
      }
    >
  ): Record<string, unknown> | undefined {
    if (!responses) {
      return undefined
    }

    const result: Record<string, unknown> = {}
    Object.entries(responses).forEach(([statusCode, response]) => {
      const responseObj: Record<string, unknown> = {
        description: response.description || '',
      }

      const content = this.buildResponseContent(response.content?.['application/json'])
      if (content) {
        responseObj.content = content
      }

      result[statusCode] = responseObj
    })

    return result
  }

  private buildParameters(
    params?: z.ZodType,
    query?: z.ZodType
  ): Array<Record<string, unknown>> | undefined {
    const parameters: Array<Record<string, unknown>> = []

    if (params) {
      const paramSchema = zodToJsonSchema(params, { target: 'openApi3' })
      if (paramSchema.properties) {
        Object.entries(paramSchema.properties).forEach(([name, schema]) => {
          parameters.push({
            name,
            in: 'path',
            required: true,
            schema: schema as Record<string, unknown>,
          })
        })
      }
    }

    if (query) {
      const querySchema = zodToJsonSchema(query, { target: 'openApi3' })
      if (querySchema.properties) {
        Object.entries(querySchema.properties).forEach(([name, schema]) => {
          const required = Array.isArray(querySchema.required) && querySchema.required.includes(name)
          parameters.push({
            name,
            in: 'query',
            required: required || false,
            schema: schema as Record<string, unknown>,
          })
        })
      }
    }

    return parameters.length > 0 ? parameters : undefined
  }

  registerPath(config: {
    method: string
    path: string
    tags?: string[]
    summary?: string
    description?: string
    security?: Array<Record<string, unknown>>
    request?: {
      body?: {
        content?: {
          'application/json'?: {
            schema?: z.ZodType
            example?: unknown
          }
        }
      }
      params?: z.ZodType
      query?: z.ZodType
    }
    responses?: Record<
      string,
      {
        description?: string
        content?: {
          'application/json'?: {
            schema?: z.ZodType
            example?: unknown
          }
        }
      }
    >
  }): void {
    const pathKey = config.path
    const method = config.method.toLowerCase()

    if (!this.paths[pathKey]) {
      this.paths[pathKey] = {}
    }

    const pathItem: Record<string, unknown> = {
      tags: config.tags || [],
      summary: config.summary,
      description: config.description,
      security: config.security || [],
    }

    const parameters = this.buildParameters(config.request?.params, config.request?.query)
    if (parameters) {
      pathItem.parameters = parameters
    }

    const requestBody = this.buildRequestBody(config)
    if (requestBody) {
      pathItem.requestBody = requestBody
    }

    const responses = this.buildResponses(config.responses)
    if (responses) {
      pathItem.responses = responses
    }

    this.paths[pathKey][method] = pathItem
  }

  getComponents(): Record<string, Record<string, unknown>> {
    return this.components
  }

  getPaths(): Record<string, Record<string, unknown>> {
    return this.paths
  }
}

// Simple OpenAPI Generator
export class OpenAPIGenerator {
  constructor(
    private definitions: Record<string, unknown>,
    private version: string
  ) {}

  generateDocument(
    config: {
      info: { title: string; version: string }
      servers?: Array<{ url: string; description?: string }>
      security?: Array<Record<string, unknown>>
      tags?: Array<{ name: string; description?: string }>
    },
    registry: OpenAPIRegistry
  ): Record<string, unknown> {
    const components = registry.getComponents()
    const paths = registry.getPaths()

    return {
      openapi: this.version,
      info: config.info,
      servers: config.servers || [],
      security: config.security || [],
      tags: config.tags || [],
      paths,
      components,
    }
  }
}
