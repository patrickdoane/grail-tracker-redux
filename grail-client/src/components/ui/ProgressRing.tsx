import { useId, type HTMLAttributes } from 'react'
import { classNames } from '../../lib/classNames'

type ProgressRingProps = HTMLAttributes<HTMLDivElement> & {
  value: number
  min?: number
  max?: number
  size?: number
  thickness?: number
  label?: string
  showValue?: boolean
  valueFormatter?: (percentage: number, value: number) => string
}

function ProgressRing({
  value,
  min = 0,
  max = 100,
  size = 88,
  thickness = 8,
  label,
  className,
  showValue = true,
  valueFormatter,
  ...rest
}: ProgressRingProps) {
  const clampValue = Math.min(Math.max(value, min), max)
  const range = Math.max(max - min, 1)
  const fraction = (clampValue - min) / range
  const percentage = Math.round(fraction * 100)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - fraction)
  const baseId = useId()
  const labelId = label ? `${baseId}-label` : undefined
  const formattedValue = valueFormatter ? valueFormatter(percentage, clampValue) : `${percentage}%`

  return (
    <div
      className={classNames('ui-progress-ring', className)}
      role="progressbar"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(clampValue)}
      aria-labelledby={labelId}
      {...rest}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="ui-progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
          fill="transparent"
        />
        <circle
          className="ui-progress-ring__indicator"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
          strokeDasharray={circumference.toFixed(2)}
          strokeDashoffset={dashOffset.toFixed(2)}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {showValue && <span className="ui-progress-ring__value">{formattedValue}</span>}
      {label && (
        <span className="ui-progress-ring__label" id={labelId}>
          {label}
        </span>
      )}
    </div>
  )
}

export default ProgressRing
export type { ProgressRingProps }
