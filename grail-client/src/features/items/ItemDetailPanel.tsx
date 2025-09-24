import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardContent, Stack, StatusBadge } from '../../components/ui'
import { classNames } from '../../lib/classNames'
import { trackTelemetryEvent } from '../../lib/telemetry'
import { getApiErrorMessage } from '../../lib/apiClient'
import { useItemDetailQuery } from './useItemDetails'
import {
  createItemNote,
  itemsKeys,
  type CreateItemNoteInput,
  type Item,
  type ItemDetail,
  type ItemNote,
  type ItemProperty,
  type ItemSource,
  type ItemVariant,
} from './itemsApi'
import { normalizeRuneName } from './runeUtils'
import './ItemDetailPanel.css'

type SectionId = 'overview' | 'sources' | 'variants' | 'notes'

type VariantEntry = ItemVariant & {
  key: string
  displayLabel: string
}

type VariantUiState = {
  entries: VariantEntry[]
  activeKey: string | null
  expandedKeys: Set<string>
  onSelect: (key: string) => void
  onToggle: (key: string, open: boolean) => void
}

type HeroArt =
  | {
      type: 'image'
      src: string
      alt: string
    }
  | {
      type: 'initial'
      value: string
    }

type NoteFormRenderProps = {
  authorName: string
  noteBody: string
  isSubmitting: boolean
  isSubmitDisabled: boolean
  errorMessage: string | null
  onAuthorChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBodyChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

type ItemDetailPanelProps = {
  item: Item
  isFound: boolean
  isMutating: boolean
  onToggleFound: () => void
  onClose: () => void
  isRuneword: boolean
  runeTracking?: RuneTrackingControls
}

type RuneTrackingControls = {
  ownedRunes: ReadonlySet<string>
  onToggleRune: (runeName: string) => void
  onOpenRune: (runeName: string) => void
}

function ItemDetailPanel({
  item: fallbackItem,
  isFound,
  isMutating,
  onToggleFound,
  onClose,
  isRuneword,
  runeTracking,
}: ItemDetailPanelProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(() => new Set(['overview']))

  const detailQuery = useItemDetailQuery(fallbackItem.id)
  const detail = detailQuery.data ?? null

  const detailItem = detail?.item ?? fallbackItem
  const properties = useMemo<ItemProperty[]>(() => detail?.properties ?? [], [detail?.properties])
  const sources = useMemo<ItemSource[]>(() => detail?.sources ?? [], [detail?.sources])
  const variants = useMemo<ItemVariant[]>(() => detail?.variants ?? [], [detail?.variants])
  const notes = useMemo<ItemNote[]>(() => detail?.notes ?? [], [detail?.notes])

  const variantsWithDevFallback = useMemo<ItemVariant[]>(() => {
    if (variants.length === 0 && import.meta.env.DEV) {
      return [
        {
          label: 'Demo Variant',
          description: 'Preview description surfaced in development mode to demo the variant layout.',
          attributes: ['Example attribute', 'Another modifier'],
        },
      ]
    }
    return variants
  }, [variants])

  const variantEntries = useMemo<VariantEntry[]>(() => {
    return variantsWithDevFallback.map((variant, index) => {
      const displayLabel = variant.label?.trim() || `Variant ${index + 1}`
      const normalizedKey = createVariantKey(displayLabel, index)
      const attributes = (variant.attributes ?? [])
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
      return {
        ...variant,
        displayLabel,
        key: normalizedKey,
        attributes,
      }
    })
  }, [variantsWithDevFallback])

  const [activeVariantKey, setActiveVariantKey] = useState<string | null>(null)
  const [expandedVariantKeys, setExpandedVariantKeys] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (variantEntries.length === 0) {
      setActiveVariantKey(null)
      setExpandedVariantKeys(new Set())
      return
    }

    const firstKey = variantEntries[0].key

    setActiveVariantKey((current) => {
      const stillExists = current ? variantEntries.some((entry) => entry.key === current) : false
      return stillExists ? current : firstKey
    })

    setExpandedVariantKeys((current) => {
      const next = new Set<string>()
      variantEntries.forEach((entry) => {
        if (current.has(entry.key)) {
          next.add(entry.key)
        }
      })
      next.add(firstKey)
      return next
    })
  }, [variantEntries])

  const handleVariantSelect = useCallback((key: string) => {
    setActiveVariantKey(key)
    setExpandedVariantKeys((current) => {
      const next = new Set(current)
      next.add(key)
      return next
    })
  }, [])

  const handleVariantAccordionToggle = useCallback((key: string, open: boolean) => {
    setExpandedVariantKeys((current) => {
      const next = new Set(current)
      if (open) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }, [])

  const variantUiState = useMemo<VariantUiState>(
    () => ({
      entries: variantEntries,
      activeKey: activeVariantKey,
      expandedKeys: expandedVariantKeys,
      onSelect: handleVariantSelect,
      onToggle: handleVariantAccordionToggle,
    }),
    [variantEntries, activeVariantKey, expandedVariantKeys, handleVariantSelect, handleVariantAccordionToggle],
  )

  const queryClient = useQueryClient()
  const [noteAuthor, setNoteAuthor] = useState('Anonymous')
  const [noteBody, setNoteBody] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)

  const handleAuthorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNoteAuthor(event.target.value)
  }

  const handleBodyChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteBody(event.target.value)
  }

  const createNoteMutation = useMutation({
    mutationFn: (input: CreateItemNoteInput) => createItemNote(detailItem.id, input),
    onSuccess: (newNote) => {
      queryClient.setQueryData<ItemDetail | undefined>(
        itemsKeys.details(detailItem.id),
        (current) => {
          if (!current) {
            return current
          }
          return { ...current, notes: [newNote, ...current.notes] }
        },
      )
      setNoteBody('')
      setNoteError(null)
    },
    onError: (error) => {
      setNoteError(getApiErrorMessage(error, 'Unable to add note right now.'))
    },
  })

  const handleNoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedBody = noteBody.trim()
    if (!trimmedBody) {
      setNoteError('Please enter a note before submitting.')
      return
    }

    const payload: CreateItemNoteInput = {
      authorName: noteAuthor.trim() || 'Anonymous',
      body: trimmedBody,
    }

    setNoteError(null)
    createNoteMutation.mutate(payload)
  }

  const noteFormProps: NoteFormRenderProps = {
    authorName: noteAuthor,
    noteBody,
    isSubmitting: createNoteMutation.isPending,
    isSubmitDisabled:
      createNoteMutation.isPending || detailQuery.status === 'pending' || noteBody.trim() === '',
    errorMessage: noteError,
    onAuthorChange: handleAuthorChange,
    onBodyChange: handleBodyChange,
    onSubmit: handleNoteSubmit,
  }

  const accentColor = useMemo(() => getAccentColor(detailItem), [detailItem])
  const heroInitial = useMemo(() => detailItem.name.charAt(0).toUpperCase(), [detailItem.name])

  const heroArt = useMemo(
    () => deriveHeroArt(detailItem, properties, heroInitial),
    [detailItem, heroInitial, properties],
  )

  const heroArtLabel = heroArt.type === 'image' ? undefined : `${detailItem.name} emblem`

  const heroMeta = useMemo(() => {
    const parts = [detailItem.type, detailItem.quality, detailItem.d2Version].filter(Boolean)
    return parts.join(' • ')
  }, [detailItem.d2Version, detailItem.quality, detailItem.type])

  const setName = useMemo(() => findPropertyValue(properties, 'Set Name'), [properties])

  const wikiUrl = useMemo(() => getWikiSourceUrl(sources), [sources])

  const handleSelectSection = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId)
    setExpandedSections((current) => {
      const next = new Set(current)
      next.add(sectionId)
      return next
    })
  }, [])

  const handleAccordionToggle = useCallback((sectionId: SectionId, open: boolean) => {
    setExpandedSections((current) => {
      const next = new Set(current)
      if (open) {
        next.add(sectionId)
      } else {
        next.delete(sectionId)
      }
      return next
    })
  }, [])

  const heroStyles = { '--item-detail-accent': accentColor } as CSSProperties

  const handleJumpToSection = useCallback(
    (sectionId: SectionId) => {
      handleSelectSection(sectionId)
      if (typeof window === 'undefined') {
        return
      }
      window.requestAnimationFrame(() => {
        const target = getSectionAnchor(sectionId)
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    [handleSelectSection],
  )

  return (
    <Card className="item-detail" style={heroStyles}>
      <div className="item-detail__hero">
        <div className="item-detail__art-shell">
          {detailItem.rarity && (
            <span className="item-detail__rarity-ribbon">{detailItem.rarity}</span>
          )}
          <div
            className={classNames(
              'item-detail__art',
              heroArt.type === 'image' && 'item-detail__art--image',
            )}
            role="img"
            aria-label={heroArtLabel}
          >
            {heroArt.type === 'image' ? (
              <img src={heroArt.src} alt={heroArt.alt} />
            ) : (
              <span aria-hidden="true">{heroArt.value}</span>
            )}
          </div>
        </div>
        <div className="item-detail__hero-body">
          <Stack gap="xs">
            <div className="item-detail__hero-top">
              <Stack direction="horizontal" gap="xs" align="center" wrap>
                {setName && (
                  <StatusBadge variant="info" subtle>
                    Part of {setName}
                  </StatusBadge>
                )}
                {isRuneword && (
                  <StatusBadge variant="warning" subtle>
                    Runeword-compatible
                  </StatusBadge>
                )}
                {isFound && <StatusBadge variant="success">Logged</StatusBadge>}
              </Stack>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close item detail view">
                Close
              </Button>
            </div>
            <div>
              <h2 className="item-detail__title">{detailItem.name}</h2>
              {heroMeta && <p className="item-detail__meta">{heroMeta}</p>}
            </div>
            <div className="item-detail__actions">
              <Stack direction="horizontal" gap="sm" wrap>
                <Button
                  variant={isFound ? 'surface' : 'primary'}
                  loading={isMutating}
                  onClick={onToggleFound}
                >
                  {isFound ? 'Mark as missing' : 'Log find'}
                </Button>
                {wikiUrl && (
                  <Button
                    variant="secondary"
                    onClick={(event) => handleOpenWiki(wikiUrl, detailItem.id, 'hero', event)}
                    trailingIcon={<ExternalLinkIcon />}
                  >
                    Open wiki
                  </Button>
                )}
              </Stack>
              <Stack direction="horizontal" gap="xs" wrap className="item-detail__quick-actions">
                <Button variant="ghost" size="sm" onClick={() => handleJumpToSection('overview')}>
                  Item overview
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleJumpToSection('variants')}>
                  View variants
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleJumpToSection('notes')}>
                  Add note
                </Button>
              </Stack>
            </div>
          </Stack>
        </div>
      </div>

      <CardContent className="item-detail__body">
        <nav className="item-detail__tabs" role="tablist" aria-label="Item detail sections">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              className={classNames(
                'item-detail__tab',
                activeSection === section.id && 'item-detail__tab--active',
              )}
              onClick={() => handleSelectSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="item-detail__tab-panels">
          {SECTIONS.map((section) => (
            <div
              key={section.id}
              role="tabpanel"
              hidden={activeSection !== section.id}
              id={`item-detail-section-${section.id}-tab`}
              className="item-detail__panel"
            >
              {renderSectionContent({
                sectionId: section.id,
                item: detailItem,
                properties,
                sources,
                variants: variantsWithDevFallback,
                notes,
                status: detailQuery.status,
                error: detailQuery.error,
                isFetching: detailQuery.isFetching,
                noteFormProps,
                variantUiState: section.id === 'variants' ? variantUiState : undefined,
                runeTracking,
              })}
            </div>
          ))}
        </div>

        <div className="item-detail__accordion">
          {SECTIONS.map((section) => {
            const isOpen = expandedSections.has(section.id)
            return (
              <details
                key={section.id}
                open={isOpen}
                onToggle={(event) => handleAccordionToggle(section.id, event.currentTarget.open)}
                id={`item-detail-section-${section.id}-accordion`}
              >
                <summary>{section.label}</summary>
                <div className="item-detail__panel">
                  {renderSectionContent({
                    sectionId: section.id,
                    item: detailItem,
                    properties,
                    sources,
                    variants: variantsWithDevFallback,
                    notes,
                    status: detailQuery.status,
                    error: detailQuery.error,
                    isFetching: detailQuery.isFetching,
                    noteFormProps,
                    variantUiState: section.id === 'variants' ? variantUiState : undefined,
                    runeTracking,
                  })}
                </div>
              </details>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'sources', label: 'Drop Sources' },
  { id: 'variants', label: 'Variants' },
  { id: 'notes', label: 'Notes' },
]

function renderSectionContent({
  sectionId,
  item,
  properties,
  sources,
  variants,
  notes,
  status,
  error,
  isFetching,
  noteFormProps,
  variantUiState,
  runeTracking,
}: {
  sectionId: SectionId
  item: Item
  properties: ItemProperty[]
  sources: ItemSource[]
  variants: ItemVariant[]
  notes: ItemNote[]
  status: 'pending' | 'error' | 'success'
  error: unknown
  isFetching: boolean
  noteFormProps?: NoteFormRenderProps
  variantUiState?: VariantUiState
  runeTracking?: RuneTrackingControls
}) {
  const isLoading = status === 'pending'
  const isError = status === 'error'
  const errorMessage = isError ? getApiErrorMessage(error) : null
  const isRunewordItem = item.quality?.toLowerCase() === 'runeword'
  const runewordMeta = isRunewordItem ? buildRunewordMeta(item, properties) : null
  const displayProperties = isRunewordItem
    ? properties.filter((property) => {
        const name = property.propertyName?.toLowerCase()
        return name !== 'runeword details' && name !== 'runeword bases'
      })
    : properties

  switch (sectionId) {
    case 'overview': {
      const noProperties = displayProperties.length === 0

      return (
        <div className="item-detail__overview">
          <dl className="item-detail__summary">
            {item.type && (
              <div>
                <dt>Type</dt>
                <dd>{item.type}</dd>
              </div>
            )}
            {item.quality && (
              <div>
                <dt>Quality</dt>
                <dd>{item.quality}</dd>
              </div>
            )}
            {item.d2Version && (
              <div>
                <dt>Version</dt>
                <dd>{item.d2Version}</dd>
              </div>
            )}
            {displayProperties.map((property) => (
              <div key={property.id}>
                <dt>{property.propertyName}</dt>
                <dd>{property.propertyValue}</dd>
              </div>
            ))}
          </dl>

          {runewordMeta && <RunewordRecipe meta={runewordMeta} runeTracking={runeTracking} />}

          {isLoading && noProperties && (
            <p className="item-detail__state">Loading item overview…</p>
          )}
          {isError && noProperties && errorMessage && (
            <p className="item-detail__state item-detail__state--error">{errorMessage}</p>
          )}

          <p className="item-detail__description">
            {runewordMeta
              ? buildRunewordSummary(runewordMeta)
              : item.description || 'Lore and flavor text will surface here as the database expands.'}
          </p>
        </div>
      )
    }
    case 'sources':
      if (isLoading && sources.length === 0) {
        return <p className="item-detail__state">Loading drop sources…</p>
      }
      if (isError && sources.length === 0 && errorMessage) {
        return <p className="item-detail__state item-detail__state--error">{errorMessage}</p>
      }
      if (sources.length === 0) {
        return <p className="item-detail__state">No sources recorded yet.</p>
      }
      return (
        <div className="item-detail__list-wrapper">
          {isFetching && (
            <p className="item-detail__state">Refreshing drop sources…</p>
          )}
          <ul className="item-detail__list">
            {sources.map((source) => {
              const isWiki = isWikiSourceType(source.sourceType)
              const url = isWiki ? source.sourceName : null
              const canLink = isWiki && isValidExternalUrl(url)
              const displayValue = canLink && url ? formatExternalLinkLabel(url) : source.sourceName
              return (
                <li key={source.id}>
                  <span className="item-detail__list-label">
                    {formatSourceType(source.sourceType)}
                  </span>
                  {canLink && url ? (
                    <a
                      className="item-detail__list-value item-detail__list-link"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => handleOpenWiki(url, item.id, 'sources', event)}
                    >
                      {displayValue}
                    </a>
                  ) : (
                    <span className="item-detail__list-value">{displayValue}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )
    case 'variants': {
      if (isLoading && variants.length === 0) {
        return <p className="item-detail__state">Loading variants…</p>
      }
      if (isError && variants.length === 0 && errorMessage) {
        return <p className="item-detail__state item-detail__state--error">{errorMessage}</p>
      }
      if (variants.length === 0) {
        return <p className="item-detail__state">Variants will appear here once cataloged.</p>
      }

      if (!variantUiState) {
        return (
          <ul className="item-detail__list item-detail__variant-fallback">
            {variants.map((variant, index) => {
              const displayLabel = variant.label?.trim() || `Variant ${index + 1}`
              const attributes = (variant.attributes ?? [])
                .map((value) => value?.trim())
                .filter((value): value is string => Boolean(value))
              return (
                <li key={`${displayLabel}-${index}`}>
                  <span className="item-detail__list-label">{displayLabel}</span>
                  {variant.description && (
                    <span className="item-detail__list-value">{variant.description}</span>
                  )}
                  {attributes.length > 0 && (
                    <ul className="item-detail__variant-attributes">
                      {attributes.map((attribute, attributeIndex) => (
                        <li key={attributeIndex}>{attribute}</li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )
      }

      if (variantUiState.entries.length === 0) {
        return <p className="item-detail__state">Variants will appear here once cataloged.</p>
      }

      const activeKey =
        variantUiState.activeKey &&
        variantUiState.entries.some((entry) => entry.key === variantUiState.activeKey)
          ? variantUiState.activeKey
          : variantUiState.entries[0].key

      return (
        <div className="item-detail__variants">
          <div className="item-detail__variant-tabs" role="tablist" aria-label="Item variants">
            {variantUiState.entries.map((variant) => {
              const isActive = variant.key === activeKey
              const tabId = `${variant.key}-tab`
              const panelId = `${variant.key}-panel`
              return (
                <button
                  key={variant.key}
                  type="button"
                  id={tabId}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={panelId}
                  className={classNames(
                    'item-detail__variant-tab',
                    isActive && 'item-detail__variant-tab--active',
                  )}
                  onClick={() => variantUiState.onSelect(variant.key)}
                >
                  {variant.displayLabel}
                </button>
              )
            })}
          </div>

          <div className="item-detail__variant-panels">
            {variantUiState.entries.map((variant) => {
              const isActive = variant.key === activeKey
              const panelId = `${variant.key}-panel`
              const tabId = `${variant.key}-tab`
              return (
                <div
                  key={variant.key}
                  id={panelId}
                  role="tabpanel"
                  aria-labelledby={tabId}
                  hidden={!isActive}
                  className="item-detail__variant-panel"
                >
                  {renderVariantDetail(variant)}
                </div>
              )
            })}
          </div>

          <div className="item-detail__variant-accordion">
            {variantUiState.entries.map((variant) => {
              const isOpen = variantUiState.expandedKeys.has(variant.key)
              return (
                <details
                  key={variant.key}
                  open={isOpen}
                  onToggle={(event) => variantUiState.onToggle(variant.key, event.currentTarget.open)}
                >
                  <summary>{variant.displayLabel}</summary>
                  <div className="item-detail__variant-panel">{renderVariantDetail(variant)}</div>
                </details>
              )
            })}
          </div>
        </div>
      )
    }
    case 'notes':
      if (!noteFormProps) {
        return null
      }

      if (isLoading && notes.length === 0) {
        return <p className="item-detail__state">Loading notes…</p>
      }

      if (isError && errorMessage) {
        return <p className="item-detail__state item-detail__state--error">{errorMessage}</p>
      }

      return (
        <div className="item-detail__notes">
          <form className="item-detail__note-form" onSubmit={noteFormProps.onSubmit}>
            <div className="item-detail__note-fields">
              <label className="item-detail__note-field">
                <span>Display name</span>
                <input
                  className="item-detail__note-input"
                  value={noteFormProps.authorName}
                  onChange={noteFormProps.onAuthorChange}
                  maxLength={60}
                  placeholder="Anonymous"
                />
              </label>
              <label className="item-detail__note-field">
                <span>Note</span>
                <textarea
                  className="item-detail__note-textarea"
                  value={noteFormProps.noteBody}
                  onChange={noteFormProps.onBodyChange}
                  placeholder="What did you find?"
                  maxLength={1024}
                  required
                />
              </label>
            </div>
            {noteFormProps.errorMessage && (
              <p className="item-detail__note-error">{noteFormProps.errorMessage}</p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={noteFormProps.isSubmitting}
              disabled={noteFormProps.isSubmitDisabled}
            >
              Post note
            </Button>
          </form>

          {notes.length === 0 ? (
            <p className="item-detail__state">No notes logged yet. Be the first to share a find.</p>
          ) : (
            <ul className="item-detail__notes-list">
              {notes.map((note) => (
                <li key={note.id} className="item-detail__note">
                  <div className="item-detail__note-meta">
                    <span className="item-detail__note-author">{note.authorName}</span>
                    <time dateTime={note.createdAt}>{formatNoteTimestamp(note.createdAt)}</time>
                  </div>
                  <p className="item-detail__note-body">{note.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    default:
      return null
  }
}

function renderVariantDetail(variant: VariantEntry) {
  const description = variant.description?.trim()
  const attributes = variant.attributes ?? []

  return (
    <div className="item-detail__variant-body">
      {description ? (
        <p className="item-detail__variant-description">{description}</p>
      ) : (
        <p className="item-detail__variant-description item-detail__variant-description--muted">
          No description recorded for this variant yet.
        </p>
      )}
      {attributes.length > 0 && (
        <ul className="item-detail__variant-attributes">
          {attributes.map((attribute, index) => (
            <li key={index}>{attribute}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

type RunewordMeta = {
  runes: string[]
  sockets?: string
  highestRune?: string
  ladder?: string
  bases?: string
}

function buildRunewordMeta(item: Item, properties: ItemProperty[]): RunewordMeta | null {
  const baseProperty = properties.find(
    (property) => property.propertyName?.toLowerCase() === 'runeword bases',
  )
  const detailsProperty = properties.find(
    (property) => property.propertyName?.toLowerCase() === 'runeword details',
  )

  const detailSource = (item.description || detailsProperty?.propertyValue || '').trim()
  const detailMap: Record<string, string> = {}

  if (detailSource) {
    detailSource.split('|').forEach((segment) => {
      const [rawKey, ...rest] = segment.split(':')
      const key = rawKey?.trim().toLowerCase()
      const value = rest.join(':').trim()
      if (key) {
        detailMap[key] = value
      }
    })
  }

  const runesRaw = detailMap['runes'] || ''
  const runes = runesRaw
    .split('+')
    .map((token) => token.trim())
    .filter(Boolean)

  const sockets = normalizeSockets(detailMap['sockets'])
  const highestRune = detailMap['highest rune'] || detailMap['highest'] || undefined
  const ladder = detailMap['ladder'] || undefined
  const bases = baseProperty?.propertyValue?.trim() || item.type || undefined

  if (runes.length === 0 && !sockets && !highestRune && !ladder && !bases) {
    return null
  }

  return {
    runes,
    sockets,
    highestRune,
    ladder,
    bases,
  }
}

function normalizeSockets(raw?: string): string | undefined {
  if (!raw) {
    return undefined
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return undefined
  }
  if (/^\d+$/.test(trimmed)) {
    return `${trimmed} socket${trimmed === '1' ? '' : 's'}`
  }
  return trimmed
}

function buildRunewordSummary(meta: RunewordMeta): string {
  const baseText = meta.bases
    ? `Socket the listed runes into ${meta.bases}.`
    : 'Socket the listed runes into the required base.'
  const details: string[] = []
  if (meta.sockets) {
    details.push(`Requires ${meta.sockets}`)
  }
  if (meta.highestRune) {
    details.push(`Highest rune needed: ${meta.highestRune}`)
  }
  if (meta.ladder) {
    details.push(meta.ladder)
  }
  if (details.length === 0) {
    return baseText
  }
  return `${baseText} ${details.join(' • ')}`
}

function RunewordRecipe({
  meta,
  runeTracking,
}: {
  meta: RunewordMeta
  runeTracking?: RuneTrackingControls
}) {
  return (
    <section className="item-detail__runeword" aria-labelledby="item-runeword-heading">
      <h3 id="item-runeword-heading">Runeword recipe</h3>
      {meta.runes.length > 0 && (
        <div className="item-detail__runeword-runes" role="list">
          {meta.runes.map((rune, index) => {
            const normalizedRune = normalizeRuneName(rune)
            const isOwned = runeTracking?.ownedRunes?.has(normalizedRune) ?? false
            const toggleLabel = isOwned ? `Mark ${rune} as missing` : `Mark ${rune} as owned`

            return (
              <div
                key={`${rune}-${index}`}
                className={classNames(
                  'item-detail__rune-chip',
                  runeTracking && 'item-detail__rune-chip--interactive',
                  isOwned && 'item-detail__rune-chip--owned',
                )}
                role="listitem"
              >
                <button
                  type="button"
                  className="item-detail__rune-toggle"
                  aria-pressed={isOwned}
                  onClick={() => runeTracking?.onToggleRune(rune)}
                  title={toggleLabel}
                  aria-label={toggleLabel}
                  disabled={!runeTracking}
                >
                  {isOwned && (
                    <span className="item-detail__rune-icon" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  )}
                  <span className="item-detail__rune-name">{rune}</span>
                </button>
                <button
                  type="button"
                  className="item-detail__rune-link"
                  onClick={() => runeTracking?.onOpenRune(rune)}
                  aria-label={`Open ${rune} rune details`}
                  title={`Open ${rune} rune details`}
                  disabled={!runeTracking}
                >
                  <ExternalLinkIcon />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <dl className="item-detail__runeword-meta">
        {meta.bases && (
          <div>
            <dt>Eligible bases</dt>
            <dd>{meta.bases}</dd>
          </div>
        )}
        {meta.sockets && (
          <div>
            <dt>Sockets required</dt>
            <dd>{meta.sockets}</dd>
          </div>
        )}
        {meta.highestRune && (
          <div>
            <dt>Highest rune</dt>
            <dd>{meta.highestRune}</dd>
          </div>
        )}
        {meta.ladder && (
          <div>
            <dt>Ladder status</dt>
            <dd>{meta.ladder}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}

function getAccentColor(item: Item): string {
  const rarity = item.rarity?.toLowerCase()
  switch (rarity) {
    case 'set':
      return '#14b8a6'
    case 'unique':
      return '#f59e0b'
    case 'runeword':
      return '#6366f1'
    case 'quest':
    case 'uber':
      return '#ef4444'
    default:
      return '#38bdf8'
  }
}

function findPropertyValue(properties: ItemProperty[], name: string): string | null {
  const property = properties.find((entry) => entry.propertyName?.toLowerCase() === name.toLowerCase())
  return property?.propertyValue ?? null
}

function formatSourceType(type: string): string {
  const normalized = type.toLowerCase()
  if (normalized === 'wiki') {
    return 'Wiki'
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function formatNoteTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function handleOpenWiki(
  url: string,
  itemId: number,
  origin: 'hero' | 'sources',
  event?: MouseEvent<HTMLElement>,
) {
  event?.preventDefault()
  trackTelemetryEvent('outbound_link', { url, itemId, source: 'item_detail', origin })
  window.open(url, '_blank', 'noopener,noreferrer')
}

function deriveHeroArt(item: Item, properties: ItemProperty[], fallbackInitial: string): HeroArt {
  const artCandidate = properties.find((property) => {
    const name = property.propertyName?.toLowerCase()
    if (!name) {
      return false
    }
    return ['icon', 'art', 'image', 'sprite'].some((keyword) => name.includes(keyword))
  })

  const rawValue = artCandidate?.propertyValue?.trim()

  if (rawValue && /^https?:\/\//i.test(rawValue)) {
    return {
      type: 'image',
      src: rawValue,
      alt: `${item.name} artwork`,
    }
  }

  const safeInitial = fallbackInitial || item.name.charAt(0).toUpperCase()

  return {
    type: 'initial',
    value: safeInitial,
  }
}

function getSectionAnchor(sectionId: SectionId): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null
  }

  const prefersAccordion =
    typeof window !== 'undefined' &&
    'matchMedia' in window &&
    window.matchMedia('(max-width: 768px)').matches

  if (prefersAccordion) {
    const accordionAnchor = document.getElementById(`item-detail-section-${sectionId}-accordion`)
    if (accordionAnchor) {
      return accordionAnchor
    }
  }

  const tabAnchor = document.getElementById(`item-detail-section-${sectionId}-tab`)
  if (tabAnchor) {
    return tabAnchor
  }

  return document.getElementById(`item-detail-section-${sectionId}-accordion`)
}

function createVariantKey(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `variant-${slug || 'entry'}-${index}`
}

function getWikiSourceUrl(sources: ItemSource[]): string | null {
  const candidate = sources.find((source) => {
    if (!isWikiSourceType(source.sourceType)) {
      return false
    }
    return isValidExternalUrl(source.sourceName)
  })
  return candidate?.sourceName ?? null
}

function isWikiSourceType(value: string | null | undefined): boolean {
  return (value ?? '').toLowerCase() === 'wiki'
}

function isValidExternalUrl(value: string | null | undefined): value is string {
  if (!value) {
    return false
  }
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function formatExternalLinkLabel(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 11.2a1 1 0 0 1-.73-.32l-2-2.2a1 1 0 1 1 1.46-1.36l1.25 1.37 4.3-4.5a1 1 0 0 1 1.44 1.38l-5 5.2a1 1 0 0 1-.72.33z"
      />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11 3a1 1 0 0 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1z"
      />
      <path
        fill="currentColor"
        d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 1 0 0-2z"
      />
    </svg>
  )
}

export default ItemDetailPanel
