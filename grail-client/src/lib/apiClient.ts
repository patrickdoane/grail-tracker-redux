export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiRequestOptions = {
  method?: HttpMethod
  headers?: HeadersInit
  body?: unknown
  signal?: AbortSignal
}

export type ApiErrorBody = {
  message?: string
  error?: string
  [key: string]: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null

  constructor(message: string, status: number, body: ApiErrorBody | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const API_BASE_URL = '/api'

function buildRequestInit(options: ApiRequestOptions = {}): RequestInit {
  const { method = 'GET', headers = {}, body, signal } = options
  const init: RequestInit = {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    signal,
  }

  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body)
  }

  return init
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')
  const hasJson = contentType && contentType.includes('application/json')
  const data = hasJson ? ((await response.json()) as T) : ((await response.text()) as unknown as T)

  if (!response.ok) {
    const body = (hasJson ? (data as ApiErrorBody) : null) ?? null
    const message = body?.message || body?.error || response.statusText || 'Request failed'
    throw new ApiError(message, response.status, body)
  }

  return data
}

export async function apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const init = buildRequestInit(options)
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  return handleResponse<T>(response)
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isApiError(error)) {
    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
