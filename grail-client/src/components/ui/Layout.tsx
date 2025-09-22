import type { CSSProperties, HTMLAttributes } from 'react'
import { classNames } from '../../lib/classNames'

type ContainerWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full'
type ContainerPadding = 'none' | 'sm' | 'md' | 'lg'

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  maxWidth?: ContainerWidth
  padding?: ContainerPadding
}

function Container({ className, maxWidth = 'lg', padding = 'lg', ...rest }: ContainerProps) {
  return (
    <div
      className={classNames('ui-container', `ui-container--${maxWidth}`, `ui-container--pad-${padding}`, className)}
      {...rest}
    />
  )
}

type StackDirection = 'vertical' | 'horizontal'
type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type StackAlign = 'start' | 'center' | 'end' | 'stretch'
type StackJustify = 'start' | 'center' | 'end' | 'between'

type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: StackDirection
  gap?: StackGap
  align?: StackAlign
  justify?: StackJustify
  wrap?: boolean
}

function Stack({
  className,
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  ...rest
}: StackProps) {
  return (
    <div
      className={classNames(
        'ui-stack',
        `ui-stack--${direction}`,
        `ui-stack--gap-${gap}`,
        `ui-stack--align-${align}`,
        `ui-stack--justify-${justify}`,
        wrap && 'ui-stack--wrap',
        className,
      )}
      {...rest}
    />
  )
}

type GridGap = 'xs' | 'sm' | 'md' | 'lg'

type GridProps = HTMLAttributes<HTMLDivElement> & {
  minItemWidth?: string
  gap?: GridGap
  align?: 'start' | 'center' | 'stretch'
}

function Grid({ className, minItemWidth = '14rem', gap = 'md', align = 'start', style, ...rest }: GridProps) {
  const cssVariables: CSSProperties = {
    ...style,
    ['--ui-grid-min' as string]: minItemWidth,
  }

  return (
    <div
      className={classNames('ui-grid', `ui-grid--gap-${gap}`, `ui-grid--align-${align}`, className)}
      style={cssVariables}
      {...rest}
    />
  )
}

export { Container, Stack, Grid }
export type { ContainerProps, StackProps, GridProps }
