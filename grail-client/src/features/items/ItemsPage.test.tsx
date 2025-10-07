import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ItemsPage from './ItemsPage'
import type { Item } from './itemsApi'
import type { UserItem } from '../user-items/userItemsApi'

vi.mock('./useItemsQuery', () => ({
  useItemsQuery: vi.fn(),
}))

vi.mock('../user-items/useUserItemsQuery', () => ({
  useUserItemsQuery: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../user-items/userItemsApi', () => ({
  createUserItem: vi.fn(),
  deleteUserItem: vi.fn(),
  fetchUserItems: vi.fn(),
  userItemsKeys: {
    all: ['user-items'] as const,
    byUser: (userId: number) => ['user-items', userId] as const,
  },
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderWithProviders(ui: ReactNode) {
  const client = createQueryClient()
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const { useItemsQuery } = await import('./useItemsQuery')
const { useUserItemsQuery } = await import('../user-items/useUserItemsQuery')
const { useAuth } = await import('../auth/AuthContext')
const { createUserItem, deleteUserItem, fetchUserItems } = await import('../user-items/userItemsApi')

const mockItemsQuery = vi.mocked(useItemsQuery)
const mockUserItemsQuery = vi.mocked(useUserItemsQuery)
const mockUseAuth = vi.mocked(useAuth)
const mockCreateUserItem = vi.mocked(createUserItem)
const mockDeleteUserItem = vi.mocked(deleteUserItem)
const mockFetchUserItems = vi.mocked(fetchUserItems)

const baseItems: Item[] = [
  {
    id: 1,
    name: 'Harlequin Crest',
    type: 'Helm',
    quality: 'Unique',
    rarity: 'Elite',
    description: 'Shako',
    d2Version: 'D2R',
  },
  {
    id: 2,
    name: 'Enigma',
    type: 'Runeword',
    quality: 'Runeword',
    rarity: 'Elite',
    description: 'Teleport everywhere',
    d2Version: 'D2R',
  },
  {
    id: 3,
    name: 'Spirit',
    type: 'Runeword',
    quality: 'Runeword',
    rarity: 'Exceptional',
    description: 'Tal + Thul + Ort + Amn',
    d2Version: 'D2',
  },
]

describe('ItemsPage', () => {
  beforeEach(() => {
    mockItemsQuery.mockReturnValue({
      data: baseItems,
      isLoading: false,
    } as ReturnType<typeof useItemsQuery>)

    mockUserItemsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useUserItemsQuery>)

    mockUseAuth.mockReturnValue({
      user: { id: 99, username: 'tester' },
      isLoading: false,
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>)

    const createdUserItem: UserItem = {
      id: 123,
      userId: 99,
      itemId: 2,
      foundAt: '2025-02-01T00:00:00Z',
      notes: null,
    }

    mockCreateUserItem.mockResolvedValue(createdUserItem)

    mockDeleteUserItem.mockResolvedValue(undefined)
    mockFetchUserItems.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('filters items by search term and toggles optimistic logging state', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ItemsPage />)

    const searchInput = screen.getByRole('searchbox', { name: /search items/i })
    await user.type(searchInput, 'enig')

    expect(screen.getByRole('heading', { name: 'Enigma' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Harlequin Crest' })).not.toBeInTheDocument()

    const logButton = screen.getByRole('button', { name: 'Log find' })
    await user.click(logButton)

    await waitFor(() =>
      expect(mockCreateUserItem).toHaveBeenCalledWith({
        itemId: 2,
        userId: 99,
      }),
    )

    const unlogButton = await screen.findByRole('button', { name: 'Mark as missing' })
    await waitFor(() => expect(unlogButton).toHaveAttribute('data-record-id', '123'))
    await user.click(unlogButton)

    await waitFor(() => expect(mockDeleteUserItem).toHaveBeenCalledWith(123))
  })
})
