import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
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
import { getApiErrorMessage } from '../../lib/apiClient'
import { useItemsQuery } from './useItemsQuery'
import type { Item } from './itemsApi'
import './ItemsPage.css'

const CATALOGUE_ESTIMATE = 500

type RarityFilter = 'all' | string

function ItemsPage() {
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const itemsQuery = useItemsQuery()

  const items: Item[] = itemsQuery.data ?? []

  const rarityOptions = useMemo(() => {
    const values = new Set<string>()
    items.forEach((item) => {
      if (item.rarity) {
        values.add(item.rarity)
      }
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [items])

  const filteredItems: Item[] = useMemo(() => {
    if (rarityFilter === 'all') {
      return items
    }
    return items.filter((item) => item.rarity?.toLowerCase() === rarityFilter.toLowerCase())
  }, [items, rarityFilter])

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

  const statusText = (() => {
    if (itemsQuery.status === 'pending') {
      return 'Fetching grail items from the server…'
    }
    if (itemsQuery.isFetching && itemsQuery.status === 'success') {
      return `Refreshing ${items.length} loaded items…`
    }
    return `Displaying ${filteredItems.length} of ${items.length} loaded items.`
  })()

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
            <Stack direction="horizontal" gap="sm" wrap className="items-page__filters">
              <FilterChip selected={rarityFilter === 'all'} onClick={() => setRarityFilter('all')}>
                All rarities
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
            </Stack>
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

        {filteredItems.length > 0 && (
          <Grid gap="lg" className="items-page__grid" minItemWidth="18rem">
            {filteredItems.map((item) => (
              <Card key={item.id} className="items-page__item-card">
                <CardHeader>
                  <Stack direction="horizontal" gap="sm" justify="between" align="center">
                    <CardTitle>{item.name}</CardTitle>
                    {item.quality && (
                      <StatusBadge variant="info" subtle>
                        {item.quality}
                      </StatusBadge>
                    )}
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
                  {item.description && <p className="items-page__item-description">{item.description}</p>}
                </CardContent>
              </Card>
            ))}
          </Grid>
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
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Log a new find"
      >
        Log find
      </FloatingActionButton>
    </Container>
  )
}

export default ItemsPage
