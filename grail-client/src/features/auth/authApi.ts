import { apiRequest } from '../../lib/apiClient'

export type AuthUser = {
  id: number
  username: string
  email: string
  createdAt: string
  role: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type RegisterInput = {
  username: string
  email: string
  password: string
}

export type LoginInput = {
  usernameOrEmail: string
  password: string
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
  })
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
  })
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me')
}
