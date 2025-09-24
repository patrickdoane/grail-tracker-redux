import { apiRequest } from '../../lib/apiClient'

export type User = {
  id: number
  username: string
  email: string
  createdAt: string
}

export const usersKeys = {
  all: ['users'] as const,
}

export async function fetchUsers(): Promise<User[]> {
  return apiRequest<User[]>('/users')
}
