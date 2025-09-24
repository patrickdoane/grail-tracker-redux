import { useId, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  FilterChip,
  Grid,
  Stack,
} from '../../components/ui'
import { getApiErrorMessage } from '../../lib/apiClient'
import { useItemsQuery } from '../items/useItemsQuery'
import type { Item } from '../items/itemsApi'
import { useUserItemsQuery } from '../user-items/useUserItemsQuery'
import { type UserItem } from '../user-items/userItemsApi'
import { useUsersQuery } from '../users/useUsersQuery'
import './StatsPage.css'

type CompletionMetric = {
  id: string
  label: string
  value: number
  total: number
  delta: number
  description: string
  unit: 'count' | 'percent'
}

type DropHistoryPoint = {
  date: string
  totalFinds: number
  uniques: number
  sets: number
  runes: number
}

type Timeframe = '7d' | '30d' | '90d'

const TIMEFRAME_LENGTH: Record<Timeframe, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

type DropMetricKey = 'totalFinds' | 'uniques' | 'sets' | 'runes'

const DROP_METRIC_OPTIONS: { key: DropMetricKey; label: string; description: string }[] = [
  {
    key: 'totalFinds',
    label: 'All finds',
    description: 'Every tracked grail drop across categories.',
  },
  {
    key: 'uniques',
    label: 'Uniques',
    description: 'Unique-tier drops by session.',
  },
  {
    key: 'sets',
    label: 'Set items',
    description: 'Tracked set piece finds by session.',
  },
  {
    key: 'runes',
    label: 'Runes',
    description: 'Rune drops that matter for runewords.',
  },
]

type FarmingHotspot = {
  id: string
  location: string
  difficulty: 'Normal' | 'Nightmare' | 'Hell'
  efficiencyScore: number
  bestFor: string
  recentFinds: number
}

const FARMING_HOTSPOTS: FarmingHotspot[] = [
  {
    id: 'pit-hell',
    location: 'The Pit — Tamoe Highland',
    difficulty: 'Hell',
    efficiencyScore: 94,
    bestFor: 'High level uniques, socket bases',
    recentFinds: 7,
  },
  {
    id: 'andy-nightmare',
    location: "Andariel Runs",
    difficulty: 'Nightmare',
    efficiencyScore: 82,
    bestFor: 'Set jewelry, mid-tier uniques',
    recentFinds: 5,
  },
  {
    id: 'cow-hell',
    location: 'Secret Cow Level',
    difficulty: 'Hell',
    efficiencyScore: 76,
    bestFor: 'Runes, base items',
    recentFinds: 6,
  },
  {
    id: 'trav-hell',
    location: 'Travincal Council',
    difficulty: 'Hell',
    efficiencyScore: 71,
    bestFor: 'High runes, unique jewelry',
    recentFinds: 4,
  },
]

type MilestoneProjection = {
  id: string
  title: string
  description: string
  completionPercent: number
  eta: string
  blockers: string[]
}

const MILESTONE_PROJECTIONS: MilestoneProjection[] = [
  {
    id: 'unique-75',
    title: 'Reach 75% unique completion',
    description: 'Prioritize TC 84 zones to close the remaining high-tier uniques.',
    completionPercent: 62,
    eta: 'Targeting 3 weeks',
    blockers: ['Need Stormlash or equivalent high rune drops'],
  },
  {
    id: 'runeword-30',
    title: 'Craft 30 runewords',
    description: 'Focus on farming Gul+ runes and finding ethereal bases.',
    completionPercent: 48,
    eta: 'Stretch goal in 5 weeks',
    blockers: ['Lacking Vex and Ohm runes', 'Need 4os ethereal polearm'],
  },
  {
    id: 'set-complete',
    title: 'Finish Tal Rasha\'s Wrappings',
    description: 'Set-targeted farming for amulet and armor variants.',
    completionPercent: 80,
    eta: 'Likely this week',
    blockers: ['Armor variants only drop in Hell difficulty'],
  },
]

const TIMEFRAME_OPTIONS: { label: string; value: Timeframe }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
]

function StatsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('30d')
  const [dropMetric, setDropMetric] = useState<DropMetricKey>('totalFinds')

  const itemsQuery = useItemsQuery()
  const usersQuery = useUsersQuery()
  const activeUserId = useMemo(() => usersQuery.data?.[0]?.id ?? null, [usersQuery.data])
  const hasActiveUser = typeof activeUserId === 'number'
  const userItemsQuery = useUserItemsQuery(activeUserId ?? undefined)

  const items = useMemo<Item[]>(() => itemsQuery.data ?? [], [itemsQuery.data])
  const userItems = useMemo<UserItem[]>(() => userItemsQuery.data ?? [], [userItemsQuery.data])

  const itemsById = useMemo(() => {
    const map = new Map<number, Item>()
    items.forEach((item) => {
      map.set(item.id, item)
    })
    return map
  }, [items])

  const completionMetrics = useMemo(
    () => buildCompletionMetrics(items, itemsById, userItems, timeframe),
    [items, itemsById, timeframe, userItems],
  )

  const dropHistory = useMemo(
    () => buildDropHistory(userItems, itemsById),
    [itemsById, userItems],
  )

  const sessionsWithinTimeframe = useMemo(
    () => filterDropHistory(dropHistory, timeframe),
    [dropHistory, timeframe],
  )

  const selectedDropMetric = useMemo(
    () => DROP_METRIC_OPTIONS.find((option) => option.key === dropMetric) ?? DROP_METRIC_OPTIONS[0],
    [dropMetric],
  )

  const totalDropsInWindow = sessionsWithinTimeframe.reduce((total, point) => total + point[dropMetric], 0)
  const averageDropsPerRun = sessionsWithinTimeframe.length
    ? totalDropsInWindow / sessionsWithinTimeframe.length
    : 0

  const isLoading =
    itemsQuery.status === 'pending' ||
    usersQuery.status === 'pending' ||
    (hasActiveUser && userItemsQuery.status === 'pending')

  const errorMessage = (() => {
    if (itemsQuery.status === 'error') {
      return getApiErrorMessage(itemsQuery.error, 'Unable to load grail catalogue right now.')
    }
    if (usersQuery.status === 'error') {
      return getApiErrorMessage(usersQuery.error, 'Unable to load grail profiles right now.')
    }
    if (hasActiveUser && userItemsQuery.status === 'error') {
      return getApiErrorMessage(userItemsQuery.error, 'Unable to load your profile statistics right now.')
    }
    return null
  })()

  return (
    <Container className="page stats-page" maxWidth="xl">
      <header className="page__header stats-page__header">
        <p className="page__eyebrow">Progress intelligence</p>
        <h1>Stats &amp; Insights</h1>
        <p className="page__lead">
          Prototype visualizations that summarize grail completion, highlight farming hotspots, and suggest next actions.
        </p>
      </header>

      {errorMessage ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load profile data</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading profile statistics…</CardTitle>
            <CardDescription>Fetching your latest grail progress and drop history.</CardDescription>
          </CardHeader>
        </Card>
      ) : !hasActiveUser ? (
        <Card>
          <CardHeader>
            <CardTitle>No grail profile available</CardTitle>
            <CardDescription>
              Create a grail hunter user via the API to start logging finds and unlock personalized stats.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <section className="stats-page__section">
            <Stack direction="horizontal" gap="sm" wrap>
              {TIMEFRAME_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  selected={timeframe === option.value}
                  onClick={() => setTimeframe(option.value)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </Stack>

            <Grid className="stats-metrics" minItemWidth="16rem" gap="lg">
              {completionMetrics.map((metric) => {
                const percent =
                  metric.unit === 'percent'
                    ? metric.value
                    : metric.total > 0
                      ? (metric.value / metric.total) * 100
                      : 0
                const deltaPrefix = metric.delta >= 0 ? '+' : '−'
                const deltaValue = Math.abs(metric.delta)
                const deltaLabel =
                  metric.unit === 'percent'
                    ? `${deltaPrefix}${deltaValue}% this window`
                    : `${deltaPrefix}${deltaValue} this window`

                return (
                  <Card key={metric.id} className="stats-metric-card" aria-live="polite">
                    <CardHeader>
                      <CardTitle>{metric.label}</CardTitle>
                      <CardDescription>{metric.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="stats-metric-card__value">
                        <span className="stats-metric-card__number">
                          {metric.unit === 'percent' ? `${metric.value}%` : `${metric.value} / ${metric.total}`}
                        </span>
                        <span className="stats-metric-card__delta">{deltaLabel}</span>
                      </div>
                      <div
                        className="stats-metric-card__progress"
                        role="img"
                        aria-label={`Progress ${percent.toFixed(0)} percent`}
                      >
                        <div className="stats-metric-card__progress-bar" style={{ ['--value' as string]: `${percent}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </Grid>
          </section>

          <section className="stats-page__section">
            <Stack direction="horizontal" justify="between" align="center" wrap gap="sm">
              <div>
                <h2 className="stats-section-title">Drop activity</h2>
                <p className="stats-section-subtitle">Session-by-session breakdown of tracked finds.</p>
              </div>
              <Stack direction="horizontal" gap="xs" wrap align="center">
                {DROP_METRIC_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.key}
                    selected={dropMetric === option.key}
                    onClick={() => setDropMetric(option.key)}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </Stack>
            </Stack>

            <Card className="stats-chart-card">
              <CardHeader>
                <CardTitle>{selectedDropMetric.label}</CardTitle>
                <CardDescription>{selectedDropMetric.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <DropMetricChart
                  data={sessionsWithinTimeframe}
                  metric={dropMetric}
                  metricLabel={selectedDropMetric.label}
                />
                <dl className="chart-insights">
                  <div>
                    <dt>Sessions analyzed</dt>
                    <dd>{sessionsWithinTimeframe.length}</dd>
                  </div>
                  <div>
                    <dt>Total drops</dt>
                    <dd>{totalDropsInWindow}</dd>
                  </div>
                  <div>
                    <dt>Average per run</dt>
                    <dd>{averageDropsPerRun.toFixed(1)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <section className="stats-page__section">
        <h2 className="stats-section-title">Farming hotspots</h2>
        <p className="stats-section-subtitle">
          Candidate zones ranked by recent efficiency so we can model recommended runs.
        </p>
        <Grid minItemWidth="20rem" gap="md">
          {FARMING_HOTSPOTS.map((hotspot) => (
            <Card key={hotspot.id} className="hotspot-card">
              <CardHeader>
                <CardTitle>{hotspot.location}</CardTitle>
                <CardDescription>{hotspot.bestFor}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="hotspot-card__meta">
                  <span className="hotspot-card__badge">{hotspot.difficulty}</span>
                  <span className="hotspot-card__score" aria-label="Efficiency score">
                    {hotspot.efficiencyScore}
                  </span>
                </div>
                <p className="hotspot-card__hint">
                  Logged {hotspot.recentFinds} qualifying drops this timeframe. Use this to feed routing suggestions.
                </p>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </section>

      <section className="stats-page__section">
        <h2 className="stats-section-title">Milestone projections</h2>
        <p className="stats-section-subtitle">
          Future-focused goals with blockers to surface next best actions.
        </p>
        <Stack gap="md">
          {MILESTONE_PROJECTIONS.map((milestone) => (
            <Card key={milestone.id} className="milestone-card">
              <CardHeader>
                <CardTitle>{milestone.title}</CardTitle>
                <CardDescription>{milestone.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="milestone-card__progress" role="img" aria-label={`Completion ${milestone.completionPercent} percent`}>
                  <div
                    className="milestone-card__progress-bar"
                    style={{ ['--value' as string]: `${milestone.completionPercent}%` }}
                  />
                </div>
                <div className="milestone-card__details">
                  <span className="milestone-card__eta">{milestone.eta}</span>
                  <ul className="milestone-card__blockers">
                    {milestone.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </section>
    </Container>
  )
}

type ItemCategory = 'unique' | 'set' | 'runeword' | 'rune' | 'other'

function buildCompletionMetrics(
  items: Item[],
  itemsById: Map<number, Item>,
  userItems: UserItem[],
  timeframe: Timeframe,
): CompletionMetric[] {
  const totals = {
    unique: 0,
    set: 0,
    runeword: 0,
  }

  items.forEach((item) => {
    const category = classifyItem(item)
    if (category === 'unique') {
      totals.unique += 1
    } else if (category === 'set') {
      totals.set += 1
    } else if (category === 'runeword') {
      totals.runeword += 1
    }
  })

  const found = {
    unique: new Set<number>(),
    set: new Set<number>(),
    runeword: new Set<number>(),
  }

  const windowFound = {
    unique: new Set<number>(),
    set: new Set<number>(),
    runeword: new Set<number>(),
  }

  const windowStart = getTimeframeStart(timeframe)

  userItems.forEach((entry) => {
    const item = itemsById.get(entry.itemId)
    const category = classifyItem(item)
    const foundAt = parseDate(entry.foundAt)
    const inWindow = foundAt ? foundAt >= windowStart : false

    if (category === 'unique') {
      found.unique.add(entry.itemId)
      if (inWindow) {
        windowFound.unique.add(entry.itemId)
      }
    }

    if (category === 'set') {
      found.set.add(entry.itemId)
      if (inWindow) {
        windowFound.set.add(entry.itemId)
      }
    }

    if (category === 'runeword') {
      found.runeword.add(entry.itemId)
      if (inWindow) {
        windowFound.runeword.add(entry.itemId)
      }
    }
  })

  const totalCollectionItems = totals.unique + totals.set + totals.runeword
  const totalFoundItems = found.unique.size + found.set.size + found.runeword.size
  const totalWindowItems = windowFound.unique.size + windowFound.set.size + windowFound.runeword.size

  const overallPercent = totalCollectionItems > 0 ? Math.round((totalFoundItems / totalCollectionItems) * 100) : 0
  const windowPercent = totalCollectionItems > 0 ? Math.round((totalWindowItems / totalCollectionItems) * 100) : 0

  return [
    {
      id: 'uniques',
      label: 'Unique items logged',
      value: found.unique.size,
      total: totals.unique,
      delta: windowFound.unique.size,
      description: 'How many unique-tier drops you have recorded so far.',
      unit: 'count',
    },
    {
      id: 'sets',
      label: 'Set pieces secured',
      value: found.set.size,
      total: totals.set,
      delta: windowFound.set.size,
      description: 'Progress toward assembling every set piece across difficulties.',
      unit: 'count',
    },
    {
      id: 'runewords',
      label: 'Runewords completed',
      value: found.runeword.size,
      total: totals.runeword,
      delta: windowFound.runeword.size,
      description: 'Finished runewords that met level requirements and rune ownership.',
      unit: 'count',
    },
    {
      id: 'overall',
      label: 'Overall grail completion',
      value: overallPercent,
      total: 100,
      delta: windowPercent,
      description: 'Blended completion score factoring uniques, sets, and runewords.',
      unit: 'percent',
    },
  ]
}

function buildDropHistory(userItems: UserItem[], itemsById: Map<number, Item>): DropHistoryPoint[] {
  const groups = new Map<string, DropHistoryPoint>()

  userItems.forEach((entry) => {
    const timestamp = parseDate(entry.foundAt)
    if (!timestamp) {
      return
    }

    const dateKey = formatDateKey(timestamp)
    const bucket = groups.get(dateKey) ?? {
      date: dateKey,
      totalFinds: 0,
      uniques: 0,
      sets: 0,
      runes: 0,
    }

    bucket.totalFinds += 1

    const item = itemsById.get(entry.itemId)
    const category = classifyItem(item)

    if (category === 'unique') {
      bucket.uniques += 1
    } else if (category === 'set') {
      bucket.sets += 1
    } else if (category === 'rune') {
      bucket.runes += 1
    }

    groups.set(dateKey, bucket)
  })

  return Array.from(groups.values()).sort((left, right) => left.date.localeCompare(right.date))
}

function filterDropHistory(data: DropHistoryPoint[], timeframe: Timeframe): DropHistoryPoint[] {
  const windowStart = getTimeframeStart(timeframe)

  return data.filter((point) => {
    const date = parseDate(`${point.date}T00:00:00`)
    return date ? date >= windowStart : false
  })
}

function getTimeframeStart(timeframe: Timeframe): Date {
  const days = TIMEFRAME_LENGTH[timeframe]
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return start
}

function classifyItem(item?: Item | null): ItemCategory {
  const value = item?.quality?.toLowerCase() ?? ''
  if (value === 'unique') {
    return 'unique'
  }
  if (value === 'set') {
    return 'set'
  }
  if (value === 'runeword') {
    return 'runeword'
  }
  if (value === 'rune') {
    return 'rune'
  }
  return 'other'
}

function parseDate(input: string | null | undefined): Date | null {
  if (!input) {
    return null
  }
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

type DropMetricChartProps = {
  data: DropHistoryPoint[]
  metric: DropMetricKey
  metricLabel: string
}

function DropMetricChart({ data, metric, metricLabel }: DropMetricChartProps) {
  const uniqueId = useId().replace(/:/g, '')
  const chartTitleId = `drop-chart-title-${uniqueId}`
  const chartDescId = `drop-chart-desc-${uniqueId}`
  const gradientId = `drop-chart-gradient-${uniqueId}`

  if (data.length === 0) {
    return (
      <div className="drop-chart drop-chart--empty">
        <p>No tracked sessions in this window yet.</p>
      </div>
    )
  }

  const width = 720
  const height = 320
  const padding = { top: 24, right: 32, bottom: 56, left: 64 }
  const baselineY = height - padding.bottom
  const horizontalRange = width - padding.left - padding.right
  const verticalRange = height - padding.top - padding.bottom

  const values = data.map((point) => point[metric])
  const actualMaxValue = Math.max(...values)
  const maxValue = actualMaxValue === 0 ? 1 : actualMaxValue
  const pointCount = data.length

  const getX = (index: number) => {
    if (pointCount === 1) {
      return padding.left + horizontalRange / 2
    }
    return padding.left + (index / (pointCount - 1)) * horizontalRange
  }

  const getY = (value: number) => baselineY - (value / maxValue) * verticalRange

  const singlePoint = pointCount === 1
  const linePath = singlePoint
    ? (() => {
        const y = getY(values[0])
        return `M${padding.left} ${y} L${padding.left + horizontalRange} ${y}`
      })()
    : data
        .map((point, index) => {
          const command = index === 0 ? 'M' : 'L'
          return `${command}${getX(index)} ${getY(point[metric])}`
        })
        .join(' ')

  const areaPath = singlePoint
    ? (() => {
        const y = getY(values[0])
        return `M${padding.left} ${baselineY} L${padding.left} ${y} L${padding.left + horizontalRange} ${y} L${padding.left + horizontalRange} ${baselineY} Z`
      })()
    : `M${getX(0)} ${baselineY} ${data
        .map((point, index) => `L${getX(index)} ${getY(point[metric])}`)
        .join(' ')} L${getX(pointCount - 1)} ${baselineY} Z`

  const circles = singlePoint
    ? [
        {
          x: padding.left + horizontalRange / 2,
          y: getY(values[0]),
          date: data[0].date,
          value: values[0],
        },
      ]
    : data.map((point, index) => ({
        x: getX(index),
        y: getY(point[metric]),
        date: point.date,
        value: point[metric],
      }))

  const yTicks = 4
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, index) => (maxValue / yTicks) * index)

  const xTickIndexes: number[] = (() => {
    if (pointCount <= 6) {
      return data.map((_, index) => index)
    }
    const midIndex = Math.round((pointCount - 1) / 2)
    return Array.from(new Set([0, midIndex, pointCount - 1]))
  })()

  const formatDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`)
    return DATE_FORMATTER.format(date)
  }

  const rangeLabel = `${formatDate(data[0].date)} – ${formatDate(data[pointCount - 1].date)}`

  const formatNumber = (value: number) => {
    if (value === 0) {
      return '0'
    }
    if (value >= 10 || Number.isInteger(value)) {
      return value.toFixed(0)
    }
    if (value >= 1) {
      return value.toFixed(1)
    }
    return value.toFixed(2)
  }

  const axisMaxLabel = formatNumber(actualMaxValue)

  return (
    <div className="drop-chart">
      <div className="drop-chart__surface">
        <svg
          className="drop-chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${chartTitleId} ${chartDescId}`}
        >
          <title id={chartTitleId}>{`${metricLabel} per session`}</title>
          <desc id={chartDescId}>{`Tracked totals from ${rangeLabel}. Peak value ${axisMaxLabel}.`}</desc>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTickValues.map((tickValue) => {
            const y = getY(tickValue)
            return (
              <g key={`y-${tickValue}`}>
                <line
                  className="drop-chart__grid-line"
                  x1={padding.left}
                  x2={padding.left + horizontalRange}
                  y1={y}
                  y2={y}
                />
                <text
                  className="drop-chart__axis-label"
                  x={padding.left - 12}
                  y={y}
                  alignmentBaseline="middle"
                  textAnchor="end"
                >
                  {formatNumber(tickValue)}
                </text>
              </g>
            )
          })}

          <line
            className="drop-chart__axis"
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={baselineY}
          />
          <line
            className="drop-chart__axis"
            x1={padding.left}
            x2={padding.left + horizontalRange}
            y1={baselineY}
            y2={baselineY}
          />

          <path className="drop-chart__area" d={areaPath} fill={`url(#${gradientId})`} />
          <path className="drop-chart__line" d={linePath} />

          {circles.map((point) => (
            <g key={point.date}>
              <circle className="drop-chart__point" cx={point.x} cy={point.y} r={6}>
                <title>
                  {`${formatDate(point.date)}: ${point.value} ${metricLabel.toLowerCase()}`}
                </title>
              </circle>
            </g>
          ))}

          {xTickIndexes.map((index) => {
            const x = getX(index)
            return (
              <text
                key={`x-${data[index].date}`}
                className="drop-chart__axis-label"
                x={x}
                y={baselineY + 24}
                textAnchor="middle"
              >
                {formatDate(data[index].date)}
              </text>
            )
          })}
        </svg>
      </div>
      <p className="drop-chart__caption">Tracked totals from {rangeLabel}.</p>
    </div>
  )
}

export default StatsPage
