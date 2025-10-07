import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'

vi.mock('./itemsApi', async () => {
  const actual = await vi.importActual<typeof import('./itemsApi')>('./itemsApi')
  return {
    ...actual,
    fetchItemDetail: vi.fn(),
  }
})

import { useItemDetailQuery } from './useItemDetails'
import { fetchItemDetail, itemsKeys, type ItemDetail } from './itemsApi'

const mockedFetchItemDetail = vi.mocked(fetchItemDetail)

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

const detailFixture: ItemDetail = {
  item: {
    id: 42,
    name: 'Enigma',
    type: 'Runeword',
    quality: 'Runeword',
    rarity: 'Unique',
    description: 'Teleport armor',
    d2Version: 'D2R',
  },
  properties: [],
  sources: [],
  variants: [],
  notes: [],
}

test('disables fetching when no item id is provided and uses the fallback query key', () => {
  const queryClient = createQueryClient()
  const wrapper = createWrapper(queryClient)

  const { result } = renderHook(() => useItemDetailQuery(null), { wrapper })

  expect(mockedFetchItemDetail).not.toHaveBeenCalled()
  expect(result.current.fetchStatus).toBe('idle')
  const storedQuery = queryClient.getQueryCache().find({ queryKey: itemsKeys.details(0) })
  expect(storedQuery).toBeDefined()
})

test('fetches item detail when an id is provided', async () => {
  const queryClient = createQueryClient()
  const wrapper = createWrapper(queryClient)

  mockedFetchItemDetail.mockResolvedValueOnce(detailFixture)

  const { result } = renderHook(() => useItemDetailQuery(42), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(mockedFetchItemDetail).toHaveBeenCalledWith(42)
  expect(result.current.data).toEqual(detailFixture)

  const storedQuery = queryClient.getQueryCache().find({ queryKey: itemsKeys.details(42) })
  expect(storedQuery).toBeDefined()
})
