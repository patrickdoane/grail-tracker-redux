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

const COMPLETION_METRICS: CompletionMetric[] = [
  {
    id: 'uniques',
    label: 'Unique items logged',
    value: 137,
    total: 377,
    delta: 9,
    description: 'How many unique-tier drops you have recorded so far.',
    unit: 'count',
  },
  {
    id: 'sets',
    label: 'Set pieces secured',
    value: 92,
    total: 127,
    delta: 6,
    description: 'Progress toward assembling every set piece across difficulties.',
    unit: 'count',
  },
  {
    id: 'runewords',
    label: 'Runewords completed',
    value: 23,
    total: 78,
    delta: 2,
    description: 'Finished runewords that met level requirements and rune ownership.',
    unit: 'count',
  },
  {
    id: 'overall',
    label: 'Overall grail completion',
    value: 36,
    total: 100,
    delta: 2,
    description: 'Blended completion score factoring uniques, sets, and runewords.',
    unit: 'percent',
  },
]

const DROP_HISTORY: DropHistoryPoint[] = [
  { date: '2024-03-10', totalFinds: 6, uniques: 3, sets: 2, runes: 1 },
  { date: '2024-03-17', totalFinds: 9, uniques: 4, sets: 3, runes: 2 },
  { date: '2024-03-24', totalFinds: 7, uniques: 3, sets: 2, runes: 2 },
  { date: '2024-03-31', totalFinds: 12, uniques: 5, sets: 4, runes: 3 },
  { date: '2024-04-07', totalFinds: 8, uniques: 4, sets: 2, runes: 2 },
  { date: '2024-04-14', totalFinds: 11, uniques: 5, sets: 3, runes: 3 },
  { date: '2024-04-21', totalFinds: 13, uniques: 6, sets: 4, runes: 3 },
  { date: '2024-04-28', totalFinds: 10, uniques: 4, sets: 3, runes: 3 },
  { date: '2024-05-05', totalFinds: 14, uniques: 6, sets: 5, runes: 3 },
  { date: '2024-05-12', totalFinds: 9, uniques: 4, sets: 3, runes: 2 },
  { date: '2024-05-19', totalFinds: 15, uniques: 7, sets: 4, runes: 4 },
  { date: '2024-05-26', totalFinds: 18, uniques: 8, sets: 6, runes: 4 },
]

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

  const sessionsWithinTimeframe = useMemo(() => {
    const windowSize = TIMEFRAME_LENGTH[timeframe]
    const endIndex = DROP_HISTORY.length
    const startIndex = Math.max(0, endIndex - Math.ceil(windowSize / 7))
    return DROP_HISTORY.slice(startIndex, endIndex)
  }, [timeframe])

  const selectedDropMetric = useMemo(
    () => DROP_METRIC_OPTIONS.find((option) => option.key === dropMetric)!,
    [dropMetric],
  )

  const totalDropsInWindow = sessionsWithinTimeframe.reduce((total, point) => total + point[dropMetric], 0)
  const averageDropsPerRun = sessionsWithinTimeframe.length
    ? totalDropsInWindow / sessionsWithinTimeframe.length
    : 0

  return (
    <Container className="page stats-page" maxWidth="xl">
      <header className="page__header stats-page__header">
        <p className="page__eyebrow">Progress intelligence</p>
        <h1>Stats &amp; Insights</h1>
        <p className="page__lead">
          Prototype visualizations that summarize grail completion, highlight farming hotspots, and suggest next actions.
        </p>
      </header>

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
          {COMPLETION_METRICS.map((metric) => {
            const percent = metric.unit === 'percent' ? metric.value : (metric.value / metric.total) * 100
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
                    <span className="stats-metric-card__delta">+{metric.delta} this window</span>
                  </div>
                  <div className="stats-metric-card__progress" role="img" aria-label={`Progress ${percent.toFixed(0)} percent`}>
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
          <desc id={chartDescId}>{`Weekly totals from ${rangeLabel}. Peak value ${axisMaxLabel}.`}</desc>
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
      <p className="drop-chart__caption">Weekly totals from {rangeLabel}.</p>
    </div>
  )
}

export default StatsPage
