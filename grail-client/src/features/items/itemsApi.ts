import { apiRequest } from '../../lib/apiClient'

export type Item = {
  id: number
  name: string
  type: string | null
  quality: string | null
  rarity: string | null
  description: string | null
  d2Version: string | null
}

const itemsQueryKey = ['items'] as const

export const itemsKeys = {
  all: itemsQueryKey,
}

export async function fetchItems(): Promise<Item[]> {
  return apiRequest<Item[]>('/items')
}
