export class PathNormalizer {
  normalize(path: string): string {
    const normalized = path.replace(/\/$/, '')
    return normalized || '/'
  }
}
