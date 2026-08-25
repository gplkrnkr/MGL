import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function TextField({ label, id, className = '', ...props }: Props) {
  return (
    <label className="flex flex-col gap-1" htmlFor={id}>
      {label && <span className="text-sm font-semibold text-text">{label}</span>}
      <input
        id={id}
        className={`h-14 px-4 rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:border-primary ${className}`}
        {...props}
      />
    </label>
  )
}
