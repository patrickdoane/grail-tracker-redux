import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { classNames } from '../../lib/classNames'

type FloatingActionButtonVariant = 'primary' | 'surface'

type FloatingActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  icon: ReactNode
  label?: string
  variant?: FloatingActionButtonVariant
  extended?: boolean
}

const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(function FloatingActionButton(
  { icon, label, extended = false, variant = 'primary', className, children, ...rest },
  ref,
) {
  const content = children ?? label
  const isExtended = extended || Boolean(content)

  return (
    <button
      ref={ref}
      type="button"
      className={classNames('ui-fab', `ui-fab--${variant}`, isExtended ? 'ui-fab--extended' : undefined, className)}
      {...rest}
    >
      <span className="ui-fab__icon" aria-hidden="true">
        {icon}
      </span>
      {isExtended && content && <span className="ui-fab__label">{content}</span>}
    </button>
  )
})

export default FloatingActionButton
export type { FloatingActionButtonProps, FloatingActionButtonVariant }
