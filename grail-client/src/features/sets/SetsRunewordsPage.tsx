import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  Container,
  Grid,
  Stack,
  StatusBadge,
  FilterChip,
} from '../../components/ui'
import { getApiErrorMessage } from '../../lib/apiClient'
import { classNames } from '../../lib/classNames'
import { useCollectionsQuery } from './useCollectionsQuery'
import type { CollectionSummary, CollectionItem } from './setsApi'
import './SetsRunewordsPage.css'

type SectionConfig = {
  title: string
  description: string
  type: CollectionSummary['type']
}

const SECTIONS: SectionConfig[] = [
  {
    title: 'Class Sets',
    description: 'Reforge archetype-defining bonuses by completing each armor ensemble.',
    type: 'set',
  },
  {
    title: 'Runewords',
    description: 'Assemble rune sequences and bases to unlock endgame power boosts.',
    type: 'runeword',
  },
]

const getUnitCopy = (collection: CollectionSummary) => {
  if (collection.type === 'runeword') {
    return {
      singular: 'rune',
      plural: 'runes',
      verb: 'assembled',
    }
  }

  return {
    singular: 'piece',
    plural: 'pieces',
    verb: 'secured',
  }
}

function SetsRunewordsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const collectionsQuery = useCollectionsQuery()
  const data = collectionsQuery.data
  const setCollections = useMemo(() => data?.sets ?? [], [data?.sets])
  const runewordCollections = useMemo(() => data?.runewords ?? [], [data?.runewords])

  const viewParam = searchParams.get('view')
  const activeView: 'all' | 'set' | 'runeword' =
    viewParam === 'set' || viewParam === 'runeword' ? viewParam : 'all'

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)

  const selectedCollection = useMemo(() => {
    if (!selectedCollectionId) {
      return null
    }
    return [...setCollections, ...runewordCollections].find(
      (collection) => collection.id === selectedCollectionId,
    ) ?? null
  }, [selectedCollectionId, setCollections, runewordCollections])

  const openChecklist = (collectionId: string) => {
    setSelectedCollectionId(collectionId)
  }

  const closeChecklist = () => {
    setSelectedCollectionId(null)
  }

  const updateView = (next: 'all' | 'set' | 'runeword') => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next === 'all') {
        params.delete('view')
      } else {
        params.set('view', next)
      }
      return params
    })
  }

  const renderCollectionCard = (collection: CollectionSummary) => {
    const totalCount = collection.totalItems ?? collection.items.length
    const foundCount =
      collection.foundItems ?? collection.items.filter((item) => item.found).length
    const completion = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0
    const badgeVariant = collection.type === 'set' ? 'success' : 'info'
    const unitCopy = getUnitCopy(collection)
    const unitLabel = totalCount === 1 ? unitCopy.singular : unitCopy.plural

    const previewItems = collection.items.slice(0, 3)
    const remaining = Math.max(totalCount - previewItems.length, 0)

    return (
      <Card key={collection.id} className="collection-card">
        <CardHeader>
          <Stack direction="horizontal" gap="sm" align="center" justify="between" className="collection-card__header">
            <div>
              <CardTitle>{collection.name}</CardTitle>
              {collection.description && <CardDescription>{collection.description}</CardDescription>}
            </div>
            <StatusBadge variant={badgeVariant} subtle>
              {collection.type === 'set' ? 'Set' : 'Runeword'}
            </StatusBadge>
          </Stack>
        </CardHeader>
        <CardContent className="collection-card__content">
          <div className="collection-card__progress" aria-label={`${completion}% complete`} role="img">
            <div className="collection-card__progress-track">
              <div className="collection-card__progress-fill" style={{ width: `${completion}%` }} />
            </div>
            <span className="collection-card__progress-label">
              {foundCount} of {totalCount} {unitLabel} {unitCopy.verb}
            </span>
          </div>
          <Stack gap="xs" className="collection-card__summary">
            {previewItems.map((item) => (
              <CollectionSummaryRow key={item.itemId ?? item.name} item={item} />
            ))}
            {remaining > 0 && (
              <p className="collection-card__more">+{remaining} more checklist goals</p>
            )}
          </Stack>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" onClick={() => openChecklist(collection.id)}>
            Open Checklist
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const renderSection = (config: SectionConfig) => {
    const collections = config.type === 'set' ? setCollections : runewordCollections

    if (collectionsQuery.status === 'pending') {
      return <p className="sets-page__state">Loading {config.type === 'set' ? 'sets' : 'runewords'}…</p>
    }

    if (collectionsQuery.status === 'error') {
      const message = getApiErrorMessage(collectionsQuery.error, 'Unable to load collections right now.')
      return <p className="sets-page__state sets-page__state--error">{message}</p>
    }

    if (collections.length === 0) {
      return <p className="sets-page__state">No {config.type === 'set' ? 'sets' : 'runewords'} cataloged yet.</p>
    }

    return (
      <Grid className="collection-grid" minItemWidth="22rem" gap="lg">
        {collections.map(renderCollectionCard)}
      </Grid>
    )
  }

  return (
    <Container className="sets-page" maxWidth="xl">
      <header className="sets-page__header">
        <p className="sets-page__eyebrow">Collection hub</p>
        <h1 className="sets-page__title">Sets & Runewords</h1>
        <p className="sets-page__lead">
          Track your multi-piece grinds in one place. Each card highlights progress, remaining pieces, and jump-off
          checklists so you can plan your next farming session.
        </p>
        <Stack direction="horizontal" gap="xs" className="sets-page__view-toggle" wrap>
          <FilterChip selected={activeView === 'all'} onClick={() => updateView('all')}>
            All
          </FilterChip>
          <FilterChip selected={activeView === 'set'} onClick={() => updateView('set')}>
            Sets
          </FilterChip>
          <FilterChip selected={activeView === 'runeword'} onClick={() => updateView('runeword')}>
            Runewords
          </FilterChip>
        </Stack>
      </header>

      {SECTIONS.filter((section) => {
        if (activeView === 'all') {
          return true
        }
        return section.type === activeView
      }).map((section) => (
        <section key={section.type} className="sets-section">
          <div className="sets-section__header">
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </div>
          {renderSection(section)}
        </section>
      ))}

      {selectedCollection && (
        <CollectionChecklist collection={selectedCollection} onClose={closeChecklist} />
      )}
    </Container>
  )
}

type CollectionSummaryRowProps = {
  item: CollectionItem
}

function CollectionSummaryRow({ item }: CollectionSummaryRowProps) {
  return (
    <div className={classNames('collection-card__item', item.found && 'collection-card__item--found')}>
      <span className="collection-card__item-name">{item.name}</span>
      {item.slot && item.slot.trim() !== '' && (
        <span className="collection-card__item-slot">{item.slot}</span>
      )}
    </div>
  )
}

type CollectionChecklistProps = {
  collection: CollectionSummary
  onClose: () => void
}

function CollectionChecklist({ collection, onClose }: CollectionChecklistProps) {
  useTrapEscape(onClose)

  const foundCount =
    collection.foundItems ?? collection.items.filter((item) => item.found).length
  const totalCount = collection.totalItems ?? collection.items.length
  const completion = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0
  const unitCopy = getUnitCopy(collection)
  const unitLabel = totalCount === 1 ? unitCopy.singular : unitCopy.plural

  return (
    <div className="collection-checklist" role="presentation">
      <button className="collection-checklist__backdrop" type="button" aria-label="Close checklist" onClick={onClose} />
      <div
        className="collection-checklist__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-checklist-title"
        aria-describedby="collection-checklist-description"
      >
        <header className="collection-checklist__header">
          <Stack direction="horizontal" gap="sm" align="center" justify="between">
            <div>
              <p className="collection-checklist__eyebrow">Checklist</p>
              <h2 id="collection-checklist-title">{collection.name}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </Stack>
          {collection.description && (
            <p id="collection-checklist-description" className="collection-checklist__lead">
              {collection.description}
            </p>
          )}
          <div className="collection-checklist__progress">
            <span>{completion}% complete</span>
            <span>
              {foundCount} / {totalCount} {unitLabel} {unitCopy.verb}
            </span>
          </div>
        </header>

        <ul className="collection-checklist__list">
          {collection.items.map((item) => (
            <li key={item.itemId ?? item.name} className="collection-checklist__item">
              <label className="collection-checklist__item-label">
                <input type="checkbox" checked={item.found} readOnly />
                <span className="collection-checklist__item-name">{item.name}</span>
                {item.slot && item.slot.trim() !== '' && (
                  <span className="collection-checklist__item-slot">{item.slot}</span>
                )}
              </label>
            </li>
          ))}
        </ul>

        <section className="collection-checklist__notes" aria-labelledby="collection-notes-title">
          <div className="collection-checklist__notes-header">
            <h3 id="collection-notes-title">Trading collaboration notes</h3>
            <p>
              Jot down socket donors, crafting priorities, or trade offers to share with your fireteam. Real-time sync
              will land in a future drop—save drafts locally for now.
            </p>
          </div>
          <textarea
            className="collection-checklist__notes-field"
            placeholder="Hit the ground running with a farming plan, rune wish list, or trading notes."
            rows={4}
          />
          <span className="collection-checklist__notes-footer">Cloud collaboration coming soon.</span>
        </section>

        <footer className="collection-checklist__footer">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </footer>
      </div>
    </div>
  )
}

function useTrapEscape(onClose: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
}

export default SetsRunewordsPage
