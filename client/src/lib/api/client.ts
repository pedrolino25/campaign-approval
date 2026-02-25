import { type ApiError, parseApiError } from './error-handler'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined')
}

let isHandling401 = false

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await parseApiError(response)

    if (error.status === 401 && typeof window !== 'undefined' && !isHandling401) {
      isHandling401 = true

      window.dispatchEvent(new CustomEvent('session-invalidated'))

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }

      setTimeout(() => {
        isHandling401 = false
      }, 1000)
    }

    throw error as ApiError
  }

  return response.json()
}
