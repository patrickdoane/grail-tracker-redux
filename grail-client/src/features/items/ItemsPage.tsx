import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  FilterChip,
  Grid,
  ProgressRing,
  Stack,
  StatusBadge,
  type StatusBadgeVariant,
  FloatingActionButton,
} from '../../components/ui'
import { classNames } from '../../lib/classNames'
import { getApiErrorMessage } from '../../lib/apiClient'
import { useItemsQuery } from './useItemsQuery'
import type { Item } from './itemsApi'
import ItemDetailPanel from './ItemDetailPanel'
import { normalizeRuneName, runeNamesMatch } from './runeUtils'
import './ItemsPage.css'
import { useUserItemsQuery } from '../user-items/useUserItemsQuery'
import { createUserItem, deleteUserItem, userItemsKeys, type UserItem } from '../user-items/userItemsApi'
import { useUsersQuery } from '../users/useUsersQuery'

const CATALOGUE_ESTIMATE = 500

type RarityFilter = 'all' | string

const isRuneword = (item: Item) => {
  const value = [item.quality, item.type, item.description]
    .filter(Boolean)
    .map((entry) => entry!.toLowerCase())
    .join(' ')
  return value.includes('runeword')
}

type LogFindVariables = {
  itemId: number
  found: boolean
}

type LogFindContext = {
  previous: Set<number>
  previousRecords: Map<number, UserItem>
}

function ItemsPage() {
  const queryClient = useQueryClient()
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [qualityFilter, setQualityFilter] = useState<RarityFilter>('all')
  const [versionFilter, setVersionFilter] = useState<RarityFilter>('all')
  const [showRunewordsOnly, setShowRunewordsOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [foundItemIds, setFoundItemIds] = useState<Set<number>>(() => new Set())
  const [userItemRecords, setUserItemRecords] = useState<Map<number, UserItem>>(() => new Map())
  const [runewordRunesOwned, setRunewordRunesOwned] = useState<Map<number, Set<string>>>(() => {
    if (typeof window === 'undefined') {
      return new Map()
    }
    const raw = window.localStorage.getItem('grail-runeword-runes')
    if (!raw) {
      return new Map()
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, string[]>
      const restored = new Map<number, Set<string>>()
      Object.entries(parsed).forEach(([key, value]) => {
        const id = Number(key)
        if (Number.isNaN(id) || !Array.isArray(value)) {
          return
        }
        const normalizedRunes = value
          .map((entry) => normalizeRuneName(String(entry)))
          .filter(Boolean)
        if (normalizedRunes.length > 0) {
          restored.set(id, new Set(normalizedRunes))
        }
      })
      return restored
    } catch (error) {
      console.warn('[grail] failed to restore rune tracking state', error)
      return new Map()
    }
  })

  const itemsQuery = useItemsQuery()
  const usersQuery = useUsersQuery()
  const activeUserId = useMemo(() => usersQuery.data?.[0]?.id ?? null, [usersQuery.data])
  const canLogFinds = typeof activeUserId === 'number'
  const userItemsQuery = useUserItemsQuery(activeUserId ?? undefined)
  const items = useMemo<Item[]>(() => itemsQuery.data ?? [], [itemsQuery.data])
  const userItems = useMemo<UserItem[]>(() => userItemsQuery.data ?? [], [userItemsQuery.data])
  useEffect(() => {
    setUserItemRecords(() => {
      const next = new Map<number, UserItem>()
      userItems.forEach((entry) => {
        next.set(entry.itemId, entry)
      })
      return next
    })
    setFoundItemIds(() => {
      const next = new Set<number>()
      userItems.forEach((entry) => {
        next.add(entry.itemId)
      })
      return next
    })
  }, [userItems])

  const rarityOptions = useMemo(() => {
    const values = new Set<string>()
    items.forEach((item) => {
      if (item.rarity) {
        values.add(item.rarity)
      }
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [items])

  const qualityOptions = useMemo(() => {
    const values = new Set<string>()
    items.forEach((item) => {
      if (item.quality) {
        values.add(item.quality)
      }
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [items])

  const versionOptions = useMemo(() => {
    const values = new Set<string>()
    items.forEach((item) => {
      if (item.d2Version) {
        values.add(item.d2Version)
      }
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [items])

  const searchTermLower = searchTerm.trim().toLowerCase()

  const filteredItems: Item[] = useMemo(() => {
    return items.filter((item) => {
      if (searchTermLower) {
        const haystack = [item.name, item.type, item.description, item.quality, item.d2Version]
          .filter(Boolean)
          .map((entry) => entry!.toLowerCase())
          .join(' ')
        if (!haystack.includes(searchTermLower)) {
          return false
        }
      }

      if (rarityFilter !== 'all' && item.rarity?.toLowerCase() !== rarityFilter.toLowerCase()) {
        return false
      }

      if (qualityFilter !== 'all' && item.quality?.toLowerCase() !== qualityFilter.toLowerCase()) {
        return false
      }

      if (versionFilter !== 'all' && item.d2Version?.toLowerCase() !== versionFilter.toLowerCase()) {
        return false
      }

      if (showRunewordsOnly && !isRuneword(item)) {
        return false
      }

      return true
    })
  }, [items, qualityFilter, rarityFilter, searchTermLower, showRunewordsOnly, versionFilter])

  useEffect(() => {
    if (selectedItemId && !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(null)
    }
  }, [filteredItems, selectedItemId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const payload: Record<number, string[]> = {}
    runewordRunesOwned.forEach((runes, runewordId) => {
      if (runes.size > 0) {
        payload[runewordId] = Array.from(runes)
      }
    })
    try {
      window.localStorage.setItem('grail-runeword-runes', JSON.stringify(payload))
    } catch (error) {
      console.warn('[grail] failed to persist rune tracking state', error)
    }
  }, [runewordRunesOwned])

  const catalogueMax = Math.max(items.length, CATALOGUE_ESTIMATE)
  const completionValue = items.length

  const getRarityVariant = (rarity: Item['rarity']): StatusBadgeVariant => {
    const value = rarity?.toLowerCase()
    switch (value) {
      case 'set':
        return 'success'
      case 'unique':
        return 'warning'
      case 'runeword':
        return 'info'
      case 'quest':
      case 'uber':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  const logFindMutation = useMutation<UserItem | null, Error, LogFindVariables, LogFindContext>({
    mutationFn: async ({ itemId, found }) => {
      if (!canLogFinds || typeof activeUserId !== 'number') {
        throw new Error('Select a grail profile before logging finds.')
      }

      if (found) {
        return createUserItem({
          userId: activeUserId,
          itemId,
          foundAt: new Date().toISOString(),
        })
      }

      const existing = userItemRecords.get(itemId)
      if (!existing || existing.id <= 0) {
        throw new Error('No logged find to remove for this item yet.')
      }
      await deleteUserItem(existing.id)
      return null
    },
    onMutate: (variables) => {
      const previous = new Set(foundItemIds)
      const previousRecords = new Map(userItemRecords)
      const timestamp = new Date().toISOString()
      if (!canLogFinds || typeof activeUserId !== 'number') {
        return { previous, previousRecords }
      }
      setUserItemRecords((prev) => {
        const next = new Map(prev)
        if (variables.found) {
          const placeholderId = -Date.now()
          next.set(variables.itemId, {
            id: placeholderId,
            userId: activeUserId,
            itemId: variables.itemId,
            foundAt: timestamp,
            notes: null,
          })
        } else {
          next.delete(variables.itemId)
        }
        return next
      })
      setFoundItemIds((prev) => {
        const next = new Set(prev)
        if (variables.found) {
          next.add(variables.itemId)
        } else {
          next.delete(variables.itemId)
        }
        return next
      })
      return { previous, previousRecords }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        setFoundItemIds(new Set(context.previous))
      }
      if (context?.previousRecords) {
        setUserItemRecords(new Map(context.previousRecords))
      }
    },
    onSuccess: (data, variables) => {
      if (variables.found && data) {
        setUserItemRecords((prev) => {
          const next = new Map(prev)
          next.set(variables.itemId, data)
          return next
        })
      }
      if (!variables.found) {
        setUserItemRecords((prev) => {
          const next = new Map(prev)
          next.delete(variables.itemId)
          return next
        })
      }
    },
    onSettled: () => {
      if (typeof activeUserId === 'number') {
        queryClient.invalidateQueries({ queryKey: userItemsKeys.byUser(activeUserId) })
      }
    },
  })

  const pendingItemId = logFindMutation.variables?.itemId
  const selectedItem = selectedItemId ? items.find((item) => item.id === selectedItemId) ?? null : null
  const selectedItemIsFound = selectedItem ? foundItemIds.has(selectedItem.id) : false
  const selectedItemIsRuneword = selectedItem ? isRuneword(selectedItem) : false
  const selectedItemIsMutating =
    Boolean(selectedItem) && logFindMutation.isPending && pendingItemId === selectedItem?.id

  const statusText = (() => {
    if (itemsQuery.status === 'pending') {
      return 'Fetching grail items from the server…'
    }
    if (itemsQuery.status === 'error') {
      return getApiErrorMessage(itemsQuery.error, 'Unable to load grail items right now.')
    }
    if (usersQuery.status === 'pending') {
      return 'Loading available grail hunter profiles…'
    }
    if (usersQuery.status === 'error') {
      return getApiErrorMessage(usersQuery.error, 'Unable to load grail profiles. Logging is disabled until this resolves.')
    }
    if (!canLogFinds) {
      return 'Create a grail hunter profile to start logging finds and tracking progress.'
    }
    if (userItemsQuery.status === 'pending') {
      return 'Fetching your logged finds from the server…'
    }
    if (userItemsQuery.status === 'error') {
      return 'Unable to refresh your logged finds. Progress indicators may be stale.'
    }
    if (userItemsQuery.isFetching && userItemsQuery.status === 'success') {
      return `Refreshing ${userItems.length} logged finds…`
    }
    if (itemsQuery.isFetching && itemsQuery.status === 'success') {
      return `Refreshing ${items.length} loaded items…`
    }
    return `Displaying ${filteredItems.length} of ${items.length} loaded items.`
  })()

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const toggleRunewordFilter = () => {
    setShowRunewordsOnly((value) => !value)
  }

  const toggleRuneOwnership = useCallback((runewordId: number, runeName: string) => {
    setRunewordRunesOwned((current) => {
      const next = new Map(current)
      const existingSet = next.get(runewordId)
      const normalized = normalizeRuneName(runeName)
      const updated = existingSet ? new Set(existingSet) : new Set<string>()
      if (updated.has(normalized)) {
        updated.delete(normalized)
      } else {
        updated.add(normalized)
      }
      if (updated.size === 0) {
        next.delete(runewordId)
      } else {
        next.set(runewordId, updated)
      }
      return next
    })
  }, [])

  const openRuneDetail = useCallback(
    (runeName: string) => {
      const normalized = normalizeRuneName(runeName)
      setRarityFilter('all')
      setQualityFilter('all')
      setVersionFilter('all')
      setShowRunewordsOnly(false)

      const runeItem = items.find((entry) => runeNamesMatch(entry.name, normalized))

      setSearchTerm(runeName)

      if (runeItem) {
        setSelectedItemId(runeItem.id)
      } else {
        setSelectedItemId(null)
      }
    },
    [items],
  )

  const toggleSelectedItem = (itemId: number) => {
    setSelectedItemId((current) => (current === itemId ? null : itemId))
  }

  const clearFilters = () => {
    setRarityFilter('all')
    setQualityFilter('all')
    setVersionFilter('all')
    setShowRunewordsOnly(false)
    setSearchTerm('')
  }

  const toggleItemFound = useCallback(
    (itemId: number, shouldBeFound: boolean) => {
      if (!canLogFinds) {
        return
      }
      logFindMutation.mutate({ itemId, found: shouldBeFound })
    },
    [canLogFinds, logFindMutation],
  )

  const filtersArePristine =
    rarityFilter === 'all' &&
    qualityFilter === 'all' &&
    versionFilter === 'all' &&
    !showRunewordsOnly &&
    searchTerm.trim() === ''

  const handleQuickLog = () => {
    const target =
      (selectedItemId && items.find((item) => item.id === selectedItemId)) || filteredItems[0] || null
    if (!target || !canLogFinds) {
      return
    }

    const isFound = foundItemIds.has(target.id)
    toggleItemFound(target.id, !isFound)
  }

  return (
    <Container className="items-page" maxWidth="xl" padding="lg">
      <Stack gap="lg">
        <Stack gap="xs">
          <StatusBadge variant="info" className="items-page__status-pill">
            Prototype
          </StatusBadge>
          <Stack gap="sm">
            <h1 className="items-page__title">Holy Grail Items</h1>
            <p className="items-page__lead">
              This view verifies that the React client is wired to the Spring Boot API. With the data
              flowing end-to-end we can now evolve the full dashboard experience.
            </p>
          </Stack>
        </Stack>

        <Card>
          <CardHeader className="items-page__summary">
            <Stack direction="horizontal" gap="lg" align="center" justify="between" wrap>
              <Stack gap="xs">
                <CardTitle>Collection snapshot</CardTitle>
                <CardDescription>{statusText}</CardDescription>
              </Stack>
              {items.length > 0 && (
                <ProgressRing
                  value={completionValue}
                  min={0}
                  max={catalogueMax}
                  label="Items loaded"
                  valueFormatter={(percentage) => `${percentage}%`}
                  className="items-page__progress"
                />
              )}
            </Stack>
          </CardHeader>
          <CardContent>
            <div className="items-page__controls">
              <label className="items-page__search">
                <span className="visually-hidden">Search items</span>
                <input
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="items-page__search-input"
                  placeholder="Search items…"
                  type="search"
                />
              </label>
              <FilterChip selected={showRunewordsOnly} onClick={toggleRunewordFilter}>
                Runewords only
              </FilterChip>
              <Button variant="ghost" onClick={clearFilters} disabled={filtersArePristine}>
                Reset filters
              </Button>
            </div>

            <div className="items-page__filters-grid">
              <div className="items-page__filter-group">
                <p className="items-page__filter-heading">Rarity</p>
                <div className="items-page__chip-group">
                  <FilterChip selected={rarityFilter === 'all'} onClick={() => setRarityFilter('all')}>
                    All
                  </FilterChip>
                  {rarityOptions.map((rarity) => (
                    <FilterChip
                      key={rarity}
                      selected={rarityFilter.toLowerCase() === rarity.toLowerCase()}
                      onClick={() => setRarityFilter(rarity)}
                    >
                      {rarity}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="items-page__filter-group">
                <p className="items-page__filter-heading">Quality</p>
                <div className="items-page__chip-group">
                  <FilterChip selected={qualityFilter === 'all'} onClick={() => setQualityFilter('all')}>
                    All
                  </FilterChip>
                  {qualityOptions.map((quality) => (
                    <FilterChip
                      key={quality}
                      selected={qualityFilter.toLowerCase() === quality.toLowerCase()}
                      onClick={() => setQualityFilter(quality)}
                    >
                      {quality}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="items-page__filter-group">
                <p className="items-page__filter-heading">Version</p>
                <div className="items-page__chip-group">
                  <FilterChip selected={versionFilter === 'all'} onClick={() => setVersionFilter('all')}>
                    All
                  </FilterChip>
                  {versionOptions.map((version) => (
                    <FilterChip
                      key={version}
                      selected={versionFilter.toLowerCase() === version.toLowerCase()}
                      onClick={() => setVersionFilter(version)}
                    >
                      {version}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {itemsQuery.status === 'pending' && (
          <Card className="items-page__status-card">
            <CardContent>
              <Stack gap="xs">
                <StatusBadge variant="info">Loading</StatusBadge>
                <CardDescription>Fetching item data from the API…</CardDescription>
              </Stack>
            </CardContent>
          </Card>
        )}

        {itemsQuery.status === 'error' && (
          <Card className="items-page__status-card">
            <CardContent>
              <Stack gap="sm">
                <Stack direction="horizontal" gap="sm" align="center">
                  <StatusBadge variant="danger">Error</StatusBadge>
                  <span className="items-page__error-message">
                    {getApiErrorMessage(itemsQuery.error)}
                  </span>
                </Stack>
                <CardDescription>
                  Ensure the backend is running on <code>localhost:8080</code> or adjust the Vite proxy.
                </CardDescription>
                <Button variant="secondary" onClick={() => itemsQuery.refetch()}>
                  Try again
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {itemsQuery.status === 'success' && filteredItems.length === 0 && (
          <Card className="items-page__status-card">
            <CardContent>
              <Stack gap="xs">
                <StatusBadge variant="warning">No data</StatusBadge>
                <CardDescription>
                  The grail collection is empty. Seed the database or import a saved catalogue to begin.
                </CardDescription>
              </Stack>
            </CardContent>
          </Card>
        )}

        {userItemsQuery.status === 'pending' && (
          <Card className="items-page__status-card">
            <CardContent>
              <Stack gap="xs">
                <StatusBadge variant="info">Syncing progress</StatusBadge>
                <CardDescription>
                  Loading your logged finds so we can highlight collected items.
                </CardDescription>
              </Stack>
            </CardContent>
          </Card>
        )}

        {userItemsQuery.status === 'error' && (
          <Card className="items-page__status-card">
            <CardContent>
              <Stack gap="sm">
                <Stack direction="horizontal" gap="sm" align="center">
                  <StatusBadge variant="danger">Sync failed</StatusBadge>
                  <span className="items-page__error-message">
                    {getApiErrorMessage(userItemsQuery.error)}
                  </span>
                </Stack>
                <CardDescription>
                  Progress indicators may be outdated until we reconnect. Ensure the backend is running and try
                  again.
                </CardDescription>
                <Button variant="secondary" onClick={() => userItemsQuery.refetch()}>
                  Retry syncing
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {filteredItems.length > 0 && (
          <Grid gap="lg" className="items-page__grid" minItemWidth="18rem">
            {filteredItems.map((item) => {
              const isFound = foundItemIds.has(item.id)
              const isSelected = selectedItemId === item.id
              const isMutating = logFindMutation.isPending && pendingItemId === item.id

              return (
                <Card
                  key={item.id}
                  className={classNames(
                    'items-page__item-card',
                    isSelected && 'items-page__item-card--selected',
                    isFound && 'items-page__item-card--found',
                  )}
                >
                  <CardHeader>
                    <Stack direction="horizontal" gap="sm" justify="between" align="center">
                      <CardTitle>{item.name}</CardTitle>
                      <Stack direction="horizontal" gap="xs" align="center">
                        {item.quality && (
                          <StatusBadge variant="info" subtle>
                            {item.quality}
                          </StatusBadge>
                        )}
                        {isFound && (
                          <StatusBadge variant="success">Found</StatusBadge>
                        )}
                      </Stack>
                    </Stack>
                    {item.rarity && (
                      <StatusBadge variant={getRarityVariant(item.rarity)} subtle>
                        {item.rarity}
                      </StatusBadge>
                    )}
                  </CardHeader>
                  <CardContent className="items-page__item-content">
                    <dl className="items-page__item-meta">
                      {item.type && (
                        <div>
                          <dt>Type</dt>
                          <dd>{item.type}</dd>
                        </div>
                      )}
                      {item.d2Version && (
                        <div>
                          <dt>Version</dt>
                          <dd>{item.d2Version}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="items-page__item-description">
                      {item.description || 'No description provided yet.'}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Stack direction="horizontal" gap="sm" justify="between" align="center">
                      <Button
                        variant={isFound ? 'surface' : 'primary'}
                        loading={isMutating}
                        disabled={!canLogFinds}
                        onClick={() => toggleItemFound(item.id, !isFound)}
                      >
                        {isFound ? 'Mark as missing' : 'Log find'}
                      </Button>
                      <Button variant="ghost" onClick={() => toggleSelectedItem(item.id)}>
                        {isSelected ? 'Close details' : 'View details'}
                      </Button>
                    </Stack>
                  </CardFooter>
                </Card>
              )
            })}
          </Grid>
        )}

        {selectedItem && (
          <div className="items-page__detail-panel">
            <ItemDetailPanel
              item={selectedItem}
              isFound={selectedItemIsFound}
              isMutating={selectedItemIsMutating}
              onToggleFound={() => toggleItemFound(selectedItem.id, !selectedItemIsFound)}
              onClose={() => setSelectedItemId(null)}
              isRuneword={selectedItemIsRuneword}
              logActionsEnabled={canLogFinds}
              runeTracking={
                selectedItemIsRuneword
                  ? {
                      ownedRunes:
                        runewordRunesOwned.get(selectedItem.id) ?? new Set<string>(),
                      onToggleRune: (runeName: string) =>
                        toggleRuneOwnership(selectedItem.id, runeName),
                      onOpenRune: openRuneDetail,
                    }
                  : undefined
              }
            />
          </div>
        )}
      </Stack>

      <FloatingActionButton
        className="items-page__fab"
        icon={
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 0 1 0-2h5V6a1 1 0 0 1 1-1z"
              fill="currentColor"
            />
          </svg>
        }
        onClick={handleQuickLog}
        aria-label="Log find for selected item"
        disabled={!canLogFinds || logFindMutation.isPending || filteredItems.length === 0}
      >
        {logFindMutation.isPending ? 'Logging…' : 'Quick log'}
      </FloatingActionButton>
    </Container>
  )
}

export default ItemsPage
