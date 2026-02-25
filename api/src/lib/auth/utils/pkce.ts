import { createHash, randomBytes } from 'crypto'

export function generateCodeVerifier(): string {
  const bytes = randomBytes(32)
  return base64UrlEncode(bytes)
}

export function generateCodeChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest()
  return base64UrlEncode(hash)
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
