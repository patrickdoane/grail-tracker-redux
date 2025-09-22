import type { HTMLAttributes } from 'react'
import { classNames } from '../../lib/classNames'

type CardProps = HTMLAttributes<HTMLDivElement>

function Card({ className, ...rest }: CardProps) {
  return <div className={classNames('ui-card', className)} {...rest} />
}

type CardSectionProps = HTMLAttributes<HTMLDivElement>

function CardHeader({ className, ...rest }: CardSectionProps) {
  return <div className={classNames('ui-card__header', className)} {...rest} />
}

function CardContent({ className, ...rest }: CardSectionProps) {
  return <div className={classNames('ui-card__content', className)} {...rest} />
}

function CardFooter({ className, ...rest }: CardSectionProps) {
  return <div className={classNames('ui-card__footer', className)} {...rest} />
}

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>

function CardTitle({ className, ...rest }: CardTitleProps) {
  return <h3 className={classNames('ui-card__title', className)} {...rest} />
}

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>

function CardDescription({ className, ...rest }: CardDescriptionProps) {
  return <p className={classNames('ui-card__description', className)} {...rest} />
}

export default Card
export { CardHeader, CardContent, CardFooter, CardTitle, CardDescription }
export type { CardProps }
