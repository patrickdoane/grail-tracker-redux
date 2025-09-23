import { useQuery } from '@tanstack/react-query'
import { fetchItemDetail, itemsKeys, type ItemDetail } from './itemsApi'

const DISABLED_ITEM_ID = 0

export function useItemDetailQuery(itemId: number | null) {
  return useQuery<ItemDetail>({
    queryKey: itemsKeys.details(itemId ?? DISABLED_ITEM_ID),
    queryFn: () => fetchItemDetail(itemId ?? DISABLED_ITEM_ID),
    enabled: itemId != null,
    staleTime: 1000 * 60 * 5,
  })
}

export type { ItemDetail } from './itemsApi'
