import { apiRequest } from '../../lib/apiClient'

export type UserItem = {
  id: number
  userId: number
  itemId: number
  foundAt: string
  notes: string | null
}

export type CreateUserItemInput = {
  userId: number
  itemId: number
  foundAt?: string
  notes?: string | null
}

export async function fetchUserItems(userId?: number): Promise<UserItem[]> {
  const searchParams = new URLSearchParams()
  if (typeof userId === 'number') {
    searchParams.set('userId', String(userId))
  }
  const query = searchParams.toString()
  const path = query ? `/user-items?${query}` : '/user-items'
  return apiRequest<UserItem[]>(path)
}

export async function createUserItem(input: CreateUserItemInput): Promise<UserItem> {
  return apiRequest<UserItem>('/user-items', {
    method: 'POST',
    body: input,
  })
}

export async function deleteUserItem(id: number): Promise<void> {
  await apiRequest(`/user-items/${id}`, {
    method: 'DELETE',
  })
}

export const userItemsKeys = {
  all: ['user-items'] as const,
  byUser: (userId: number) => [...userItemsKeys.all, userId] as const,
}
