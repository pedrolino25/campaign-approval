export interface CursorPaginationParams {
  cursor?: string
  limit?: number
}

export interface CursorPaginationResult<T> {
  data: T[]
  nextCursor: string | null
}

export interface CursorData {
  createdAt: string
  id: string
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const MIN_LIMIT = 1

export function normalizePaginationParams(
  params: CursorPaginationParams
): {
  cursor: CursorData | null
  limit: number
} {
  const limit = params.limit ?? DEFAULT_LIMIT

  if (limit < MIN_LIMIT) {
    throw new Error(`Limit must be at least ${MIN_LIMIT}`)
  }

  if (limit > MAX_LIMIT) {
    throw new Error(`Limit cannot exceed ${MAX_LIMIT}`)
  }

  let cursor: CursorData | null = null

  if (params.cursor) {
    try {
      const decoded = Buffer.from(params.cursor, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded) as CursorData

      if (!parsed.createdAt || !parsed.id) {
        throw new Error('Invalid cursor format: missing required fields')
      }

      cursor = {
        createdAt: parsed.createdAt,
        id: parsed.id,
      }
    } catch (error) {
      throw new Error(`Invalid cursor format: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  return {
    cursor,
    limit,
  }
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

export function createCursorWhereCondition(
  cursor: CursorData | null
): {
  OR?: Array<{
    createdAt: { lt: Date }
  } | {
    createdAt: Date
    id: { lt: string }
  }>
} {
  if (!cursor) {
    return {}
  }

  const cursorDate = new Date(cursor.createdAt)

  return {
    OR: [
      {
        createdAt: {
          lt: cursorDate,
        },
      },
      {
        createdAt: cursorDate,
        id: {
          lt: cursor.id,
        },
      },
    ],
  }
}

export function determineNextCursor<T extends { createdAt: Date; id: string }>(
  items: T[],
  limit: number
): string | null {
  if (items.length < limit) {
    return null
  }

  const lastItem = items[items.length - 1]
  if (!lastItem) {
    return null
  }

  return encodeCursor({
    createdAt: lastItem.createdAt.toISOString(),
    id: lastItem.id,
  })
}

export const CURSOR_ORDER_BY = {
  createdAt: 'desc' as const,
  id: 'desc' as const,
}
