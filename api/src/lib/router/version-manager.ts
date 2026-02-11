import { ApiVersion } from '../../models/index.js'

function isApiVersion(value: string): value is ApiVersion {
  return Object.values(ApiVersion).includes(value as ApiVersion)
}

export class VersionManager {
  private readonly supportedVersions: Set<ApiVersion> = new Set(Object.values(ApiVersion))

  isSupported(version: ApiVersion): boolean {
    return this.supportedVersions.has(version)
  }

  getSupportedVersions(): ApiVersion[] {
    return Array.from(this.supportedVersions)
  }

  extractVersionFromPath(path: string): ApiVersion | null {
    const versionPattern = /^\/(v\d+)/
    const matchResult = versionPattern.exec(path)
    if (!matchResult || !matchResult[1]) {
      return null
    }
    const matchedVersion = matchResult[1]
    if (isApiVersion(matchedVersion) && this.isSupported(matchedVersion)) {
      return matchedVersion
    }
    return null
  }

  removeVersionFromPath(path: string): string {
    return path.replace(/^\/v\d+/, '') || '/'
  }
}
