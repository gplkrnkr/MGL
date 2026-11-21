/**
 * The ?next= target after sign-in. Only same-site paths are accepted ("/jobs/123"), never
 * "//evil.example" or "/\\evil.example", which browsers treat as another site.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/')) return null
  if (value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}
