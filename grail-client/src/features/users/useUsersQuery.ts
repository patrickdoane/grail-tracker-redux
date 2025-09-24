import { useQuery } from '@tanstack/react-query'
import { fetchUsers, usersKeys, type User } from './usersApi'

export function useUsersQuery() {
  return useQuery<User[]>({
    queryKey: usersKeys.all,
    queryFn: fetchUsers,
  })
}
