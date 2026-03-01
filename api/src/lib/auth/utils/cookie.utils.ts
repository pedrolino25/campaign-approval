import { parse } from 'cookie'

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}
  const parsed = parse(cookieHeader)
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (value) {
      result[key] = value
    }
  }
  return result
}
