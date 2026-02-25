export interface ApiError {
  status: number
  message: string
  code?: string
}

export async function parseApiError(res: Response): Promise<ApiError> {
  let message = 'An error occurred'
  let code: string | undefined

  try {
    const body = await res.json()
    message = body.message || body.error || message
    code = body.code
  } catch {
    // If JSON parsing fails, use status text
    message = res.statusText || message
  }

  return {
    status: res.status,
    message,
    code,
  }
}
