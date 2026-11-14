import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-background border border-border rounded-lg p-4 ${className}`}
      {...props}
    />
  )
}
