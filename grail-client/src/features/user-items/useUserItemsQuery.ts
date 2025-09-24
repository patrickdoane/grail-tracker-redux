import { useQuery } from '@tanstack/react-query'
import { fetchUserItems, userItemsKeys, type UserItem } from './userItemsApi'

export function useUserItemsQuery(userId?: number) {
  return useQuery<UserItem[]>({
    queryKey: typeof userId === 'number' ? userItemsKeys.byUser(userId) : userItemsKeys.all,
    queryFn: () => fetchUserItems(userId),
    enabled: typeof userId === 'number',
  })
}
