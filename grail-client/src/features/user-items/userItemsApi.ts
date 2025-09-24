import { apiRequest } from '../../lib/apiClient'

export type UserItem = {
  id: number
  userId: number
  itemId: number
  foundAt: string
  notes: string | null
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

export const userItemsKeys = {
  all: ['user-items'] as const,
}
