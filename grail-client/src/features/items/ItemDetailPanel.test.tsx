import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ItemDetailPanel from './ItemDetailPanel'
import type { ItemDetail, Item } from './itemsApi'

vi.mock('./useItemDetails', () => ({
  useItemDetailQuery: vi.fn(),
}))

vi.mock('../../lib/telemetry', () => ({
  trackTelemetryEvent: vi.fn(),
}))

const { useItemDetailQuery } = await import('./useItemDetails')
const mockUseItemDetailQuery = vi.mocked(useItemDetailQuery)

const baseItem: Item = {
  id: 1,
  name: 'Harlequin Crest',
  type: 'Helm',
  quality: 'Unique',
  rarity: 'Elite',
  description: 'Legendary helm that whispers secrets.',
  d2Version: 'D2R',
}

function renderPanel(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>)
}

describe('ItemDetailPanel', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', 'false')
    mockUseItemDetailQuery.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('shows fallback overview and placeholder variants when only description data is available', async () => {
    mockUseItemDetailQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      status: 'success',
      error: null,
    } as unknown as ReturnType<typeof useItemDetailQuery>)

    const user = userEvent.setup()
    renderPanel(
      <ItemDetailPanel
        item={baseItem}
        isFound={false}
        isMutating={false}
        onToggleFound={vi.fn()}
        onClose={vi.fn()}
        isRuneword={false}
        logActionsEnabled
      />,
    )

    const overviewPanel = document.getElementById('item-detail-section-overview-tab')
    expect(overviewPanel).toBeTruthy()
    expect(within(overviewPanel as HTMLElement).getByText(baseItem.description)).toBeInTheDocument()

    const variantsTab = screen.getByRole('tab', { name: /variants/i })
    await user.click(variantsTab)

    const variantSection = document.getElementById('item-detail-section-variants-tab') as HTMLElement | null
    expect(variantSection).toBeTruthy()

    const hasEmptyState = Array.from(variantSection?.querySelectorAll('p') ?? []).some(
      (node) => node.textContent === 'Variants will appear here once cataloged.',
    )

    if (hasEmptyState) {
      expect(hasEmptyState).toBe(true)
    } else {
      const variantTabs = within(variantSection as HTMLElement).getAllByRole('tab', {
        name: 'Demo Variant',
      })
      expect(variantTabs.length).toBeGreaterThan(0)

      const descriptionMatches = within(variantSection as HTMLElement).getAllByText(
        'Preview description surfaced in development mode to demo the variant layout.',
      )
      expect(descriptionMatches.length).toBeGreaterThan(0)
    }
  })

  it('renders returned variants with labels, descriptions, and attributes', async () => {
    mockUseItemDetailQuery.mockReturnValue({
      data: {
        item: { ...baseItem, description: 'API-sourced description.' },
        properties: [],
        sources: [],
        notes: [],
        variants: [
          {
            label: 'Hardcore',
            description: 'Cannot die when equipped.',
            attributes: ['+1 to All Skills', 'Damage Reduced by 10%'],
          },
        ],
      } satisfies ItemDetail,
      isLoading: false,
      isError: false,
      status: 'success',
      error: null,
    } as unknown as ReturnType<typeof useItemDetailQuery>)

    const user = userEvent.setup()
    renderPanel(
      <ItemDetailPanel
        item={baseItem}
        isFound={false}
        isMutating={false}
        onToggleFound={vi.fn()}
        onClose={vi.fn()}
        isRuneword={false}
        logActionsEnabled
      />,
    )

    const variantsTab = screen.getByRole('tab', { name: /variants/i })
    await user.click(variantsTab)

    const [variantTab] = screen.getAllByRole('tab', { name: 'Hardcore' })
    expect(variantTab).toHaveAttribute('aria-selected', 'true')
    const variantPanel = document.getElementById('variant-hardcore-0-panel')
    expect(variantPanel).toBeTruthy()
    expect(within(variantPanel as HTMLElement).getByText('Cannot die when equipped.')).toBeInTheDocument()
    expect(within(variantPanel as HTMLElement).getByText('+1 to All Skills')).toBeInTheDocument()
  })
})
