import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../lib/classNames'

type StatusBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusBadgeVariant
  icon?: ReactNode
  subtle?: boolean
}

function StatusBadge({ variant = 'neutral', icon, subtle = false, className, children, ...rest }: StatusBadgeProps) {
  return (
    <span
      className={classNames(
        'ui-status-badge',
        `ui-status-badge--${variant}`,
        subtle && 'ui-status-badge--subtle',
        className,
      )}
      {...rest}
    >
      {icon && <span className="ui-status-badge__icon" aria-hidden="true">{icon}</span>}
      <span className="ui-status-badge__label">{children}</span>
    </span>
  )
}

export default StatusBadge
export type { StatusBadgeProps, StatusBadgeVariant }
