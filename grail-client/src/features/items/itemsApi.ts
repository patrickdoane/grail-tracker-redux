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

export type ItemProperty = {
  id: number
  itemId: number
  propertyName: string
  propertyValue: string
}

export type ItemSource = {
  id: number
  itemId: number
  sourceType: string
  sourceName: string
}

export type ItemVariant = {
  label: string
  description: string | null
  attributes: string[]
}

export type ItemNote = {
  id: number
  itemId: number
  authorName: string
  createdAt: string
  body: string
}

export type CreateItemNoteInput = {
  authorName: string
  body: string
}

export type ItemDetail = {
  item: Item
  properties: ItemProperty[]
  sources: ItemSource[]
  variants: ItemVariant[]
  notes: ItemNote[]
}

const itemsQueryKey = ['items'] as const

export const itemsKeys = {
  all: itemsQueryKey,
  details: (itemId: number) => [...itemsQueryKey, 'detail', itemId] as const,
}

export async function fetchItems(): Promise<Item[]> {
  return apiRequest<Item[]>('/items')
}

export async function fetchItemDetail(itemId: number): Promise<ItemDetail> {
  return apiRequest<ItemDetail>(`/items/${itemId}/details`)
}

export async function createItemNote(
  itemId: number,
  input: CreateItemNoteInput,
): Promise<ItemNote> {
  return apiRequest<ItemNote>(`/items/${itemId}/notes`, {
    method: 'POST',
    body: input,
  })
}
