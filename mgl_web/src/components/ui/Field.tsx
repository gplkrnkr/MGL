import type { ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-bold tracking-widest text-text-muted uppercase text-center">{label}</p>
      {children}
    </div>
  )
}
