import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-text-inverse hover:bg-primary-dark',
  secondary: 'bg-background text-text border border-border hover:bg-page',
  ghost: 'bg-transparent text-primary hover:bg-primary-light',
}

export function Button({ variant = 'primary', className = '', disabled, ...props }: Props) {
  return (
    <button
      disabled={disabled}
      className={`h-14 px-6 rounded-lg font-semibold transition-opacity active:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
