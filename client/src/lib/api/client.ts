import { handleError, type ParsedError } from '../errors'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined')
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`

  let response: Response

  try {
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      mode: 'cors',
    })
  } catch (error) {
    const parsedError = await handleError(error)
    throw parsedError
  }

  if (!response.ok) {
    const parsedError = await handleError(null, response, {
      onError: (error) => {
        if (error.statusCode === 401 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('session-invalidated'))
        }
      },
    })

    throw parsedError
  }

  return response.json()
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'userMessage' in error) {
    return (error as ParsedError).userMessage
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message
  }
  return 'An error occurred'
}
