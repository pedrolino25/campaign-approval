import { match as pathMatch } from 'path-to-regexp'

interface MatchResult {
  params?: Record<string, string>
}

export type PathMatcher = (path: string) => MatchResult | false

export class PathMatcherFactory {
  create(pattern: string): PathMatcher {
    const matchOptions = {
      decode: decodeURIComponent,
    } as const

    const matchFunction = pathMatch as (
      pattern: string,
      options: { decode: (value: string) => string }
    ) => (path: string) => MatchResult | false

    const typedMatcher = matchFunction(pattern, matchOptions)

    return (path: string): MatchResult | false => {
      const result = typedMatcher(path)

      if (result && typeof result === 'object' && 'params' in result) {
        return {
          params: result.params,
        }
      }

      return false
    }
  }
}
