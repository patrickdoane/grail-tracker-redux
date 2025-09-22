import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { classNames } from '../../lib/classNames'

type ButtonVariant = 'primary' | 'secondary' | 'surface' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    loading = false,
    className,
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      className={classNames(
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        loading && 'ui-button--loading',
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className="ui-button__content">
        {(leadingIcon || loading) && (
          <span className="ui-button__icon" aria-hidden="true">
            {loading ? <span className="ui-spinner" /> : leadingIcon}
          </span>
        )}
        <span className="ui-button__label">{children}</span>
        {trailingIcon && !loading && (
          <span className="ui-button__icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </span>
    </button>
  )
})

export default Button
export type { ButtonProps, ButtonSize, ButtonVariant }
