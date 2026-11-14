import { missingConfig } from '../lib/config'

export function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm bg-background border border-border rounded-lg p-4 flex flex-col gap-4 text-center">
        <h1 className="text-xl font-bold text-text">App misconfigured</h1>
        <p className="text-sm text-text-muted">
          These settings were not set at build time:{' '}
          {missingConfig.map((name, i) => (
            <span key={name}>
              {i > 0 && ', '}
              <code>{name}</code>
            </span>
          ))}
          . Rebuild the app with them set (see <code>.env.example</code>).
        </p>
      </div>
    </div>
  )
}
