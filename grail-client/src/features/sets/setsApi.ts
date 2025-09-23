import { apiRequest } from '../../lib/apiClient'

export type CollectionItem = {
  itemId: number
  name: string
  slot: string | null
  found: boolean
}

export type CollectionSummary = {
  id: string
  name: string
  type: 'set' | 'runeword'
  description: string | null
  totalItems: number
  foundItems: number
  items: CollectionItem[]
}

export type CollectionsResponse = {
  sets: CollectionSummary[]
  runewords: CollectionSummary[]
}

export async function fetchCollections(userId?: number): Promise<CollectionsResponse> {
  const searchParams = new URLSearchParams()
  if (typeof userId === 'number') {
    searchParams.set('userId', String(userId))
  }
  const query = searchParams.toString()
  const path = query ? `/collections?${query}` : '/collections'
  return apiRequest<CollectionsResponse>(path)
}

export const collectionsKeys = {
  all: ['collections'] as const,
}
