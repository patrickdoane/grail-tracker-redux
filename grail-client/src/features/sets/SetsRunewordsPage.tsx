import { useEffect, useMemo, useState } from 'react'
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
} from '../../components/ui'
import { classNames } from '../../lib/classNames'
import './SetsRunewordsPage.css'

type CollectionType = 'set' | 'runeword'

type CollectionItem = {
  id: string
  name: string
  slot: string
  found: boolean
}

type CollectionSummary = {
  id: string
  name: string
  type: CollectionType
  lore?: string
  items: CollectionItem[]
}

const COLLECTIONS: CollectionSummary[] = [
  {
    id: 'set-tal-rasha',
    name: "Tal Rasha's Wrappings",
    type: 'set',
    lore: 'A cornerstone Sorceress set prized for its resistances and elemental mastery.',
    items: [
      { id: 'tal-mask', name: "Tal Rasha's Horadric Crest", slot: 'Helm', found: true },
      { id: 'tal-armor', name: "Tal Rasha's Guardianship", slot: 'Armor', found: false },
      { id: 'tal-belt', name: "Tal Rasha's Fine-Spun Cloth", slot: 'Belt', found: false },
      { id: 'tal-amulet', name: "Tal Rasha's Adjudication", slot: 'Amulet', found: true },
      { id: 'tal-orb', name: "Tal Rasha's Lidless Eye", slot: 'Orb', found: false },
    ],
  },
  {
    id: 'set-griswold',
    name: "Griswold's Legacy",
    type: 'set',
    lore: 'Paladin-centric plate with powerful aura synergy once fully assembled.',
    items: [
      { id: 'gris-armor', name: "Griswold's Heart", slot: 'Armor', found: false },
      { id: 'gris-shield', name: "Griswold's Honor", slot: 'Shield', found: false },
      { id: 'gris-helm', name: "Griswold's Valor", slot: 'Helm', found: false },
      { id: 'gris-weapon', name: "Griswold's Redemption", slot: 'Caduceus', found: false },
    ],
  },
  {
    id: 'runeword-enigma',
    name: 'Enigma',
    type: 'runeword',
    lore: 'Grant teleport to any class by socketing Jah • Ith • Ber into body armor.',
    items: [
      { id: 'rune-jah', name: 'Jah Rune', slot: 'Rune', found: false },
      { id: 'rune-ith', name: 'Ith Rune', slot: 'Rune', found: true },
      { id: 'rune-ber', name: 'Ber Rune', slot: 'Rune', found: false },
      { id: 'base-armor', name: '3os Body Armor Base', slot: 'Armor Base', found: true },
    ],
  },
  {
    id: 'runeword-spirit',
    name: 'Spirit',
    type: 'runeword',
    lore: 'Staple caster runeword offering FCR and +skills in swords or shields.',
    items: [
      { id: 'rune-tal', name: 'Tal Rune', slot: 'Rune', found: true },
      { id: 'rune-thul', name: 'Thul Rune', slot: 'Rune', found: true },
      { id: 'rune-ort', name: 'Ort Rune', slot: 'Rune', found: true },
      { id: 'rune-amn', name: 'Amn Rune', slot: 'Rune', found: true },
      { id: 'base-4os', name: '4os Sword/Shield Base', slot: 'Base Item', found: true },
    ],
  },
]

function SetsRunewordsPage() {
  const [selectedCollection, setSelectedCollection] = useState<CollectionSummary | null>(null)

  const groupedCollections = useMemo(() => {
    return COLLECTIONS.reduce(
      (acc, collection) => {
        acc[collection.type].push(collection)
        return acc
      },
      {
        set: [] as CollectionSummary[],
        runeword: [] as CollectionSummary[],
      },
    )
  }, [])

  const openChecklist = (collection: CollectionSummary) => {
    setSelectedCollection(collection)
  }

  const closeChecklist = () => {
    setSelectedCollection(null)
  }

  const renderCollectionCard = (collection: CollectionSummary) => {
    const foundCount = collection.items.filter((item) => item.found).length
    const totalCount = collection.items.length
    const completion = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0
    const badgeVariant = collection.type === 'set' ? 'success' : 'info'

    return (
      <Card key={collection.id} className="collection-card">
        <CardHeader>
          <Stack direction="horizontal" gap="sm" align="center" justify="between" className="collection-card__header">
            <div>
              <CardTitle>{collection.name}</CardTitle>
              {collection.lore && <CardDescription>{collection.lore}</CardDescription>}
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
              {foundCount} of {totalCount} pieces secured
            </span>
          </div>
          <Stack gap="xs" className="collection-card__summary">
            {collection.items.slice(0, 3).map((item) => (
              <div key={item.id} className={classNames('collection-card__item', item.found && 'collection-card__item--found')}>
                <span className="collection-card__item-name">{item.name}</span>
                <span className="collection-card__item-slot">{item.slot}</span>
              </div>
            ))}
            {collection.items.length > 3 && (
              <p className="collection-card__more">+{collection.items.length - 3} more checklist goals</p>
            )}
          </Stack>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" onClick={() => openChecklist(collection)}>
            Open Checklist
          </Button>
        </CardFooter>
      </Card>
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
      </header>

      <section className="sets-section">
        <div className="sets-section__header">
          <h2>Class Sets</h2>
          <p>Reforge archetype-defining bonuses by completing each armor ensemble.</p>
        </div>
        <Grid className="collection-grid" minItemWidth="22rem" gap="lg">
          {groupedCollections.set.map(renderCollectionCard)}
        </Grid>
      </section>

      <section className="sets-section">
        <div className="sets-section__header">
          <h2>Runewords</h2>
          <p>Assemble rune sequences and bases to unlock endgame power boosts.</p>
        </div>
        <Grid className="collection-grid" minItemWidth="22rem" gap="lg">
          {groupedCollections.runeword.map(renderCollectionCard)}
        </Grid>
      </section>

      {selectedCollection && (
        <CollectionChecklist collection={selectedCollection} onClose={closeChecklist} />
      )}
    </Container>
  )
}

type CollectionChecklistProps = {
  collection: CollectionSummary
  onClose: () => void
}

function CollectionChecklist({ collection, onClose }: CollectionChecklistProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const foundCount = collection.items.filter((item) => item.found).length
  const totalCount = collection.items.length
  const completion = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0

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
          {collection.lore && (
            <p id="collection-checklist-description" className="collection-checklist__lead">
              {collection.lore}
            </p>
          )}
          <div className="collection-checklist__progress">
            <span>{completion}% complete</span>
            <span>
              {foundCount} / {totalCount} items secured
            </span>
          </div>
        </header>

        <ul className="collection-checklist__list">
          {collection.items.map((item) => (
            <li key={item.id} className="collection-checklist__item">
              <label className="collection-checklist__item-label">
                <input type="checkbox" checked={item.found} readOnly />
                <span className="collection-checklist__item-name">{item.name}</span>
                <span className="collection-checklist__item-slot">{item.slot}</span>
              </label>
            </li>
          ))}
        </ul>

        <footer className="collection-checklist__footer">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default SetsRunewordsPage
