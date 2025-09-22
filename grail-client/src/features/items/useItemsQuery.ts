import { useQuery } from '@tanstack/react-query'
import { fetchItems, itemsKeys, type Item } from './itemsApi'

export function useItemsQuery() {
  return useQuery<Item[]>({
    queryKey: itemsKeys.all,
    queryFn: fetchItems,
    select: (items: Item[]) => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  })
}
