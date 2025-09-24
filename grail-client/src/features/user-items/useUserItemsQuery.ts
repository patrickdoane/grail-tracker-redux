import { useQuery } from '@tanstack/react-query'
import { fetchUserItems, userItemsKeys, type UserItem } from './userItemsApi'

export function useUserItemsQuery(userId?: number) {
  return useQuery<UserItem[]>({
    queryKey: userId ? [...userItemsKeys.all, userId] : userItemsKeys.all,
    queryFn: () => fetchUserItems(userId),
  })
}
