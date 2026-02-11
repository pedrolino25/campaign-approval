export class PathNormalizer {
  normalize(path: string): string {
    let normalized = path.replace(/^\/v1/, '')
    normalized = normalized.replace(/\/$/, '')
    return normalized || '/'
  }
}
