import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { classNames } from '../../lib/classNames'

type FilterChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  selected?: boolean
  icon?: ReactNode
}

const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(function FilterChip(
  { selected = false, icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={classNames('ui-filter-chip', selected && 'ui-filter-chip--selected', className)}
      type="button"
      aria-pressed={selected}
      {...rest}
    >
      {icon && <span className="ui-filter-chip__icon" aria-hidden="true">{icon}</span>}
      <span className="ui-filter-chip__label">{children}</span>
    </button>
  )
})

export default FilterChip
export type { FilterChipProps }
