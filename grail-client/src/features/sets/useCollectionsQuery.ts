import { useQuery } from '@tanstack/react-query'
import { fetchCollections, collectionsKeys, type CollectionsResponse } from './setsApi'

export function useCollectionsQuery(userId?: number) {
  return useQuery<CollectionsResponse>({
    queryKey: userId ? [...collectionsKeys.all, userId] : collectionsKeys.all,
    queryFn: () => fetchCollections(userId),
  })
}
