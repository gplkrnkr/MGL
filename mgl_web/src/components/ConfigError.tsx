export function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm bg-background border border-border rounded-lg p-4 flex flex-col gap-4 text-center">
        <h1 className="text-xl font-bold text-text">App misconfigured</h1>
        <p className="text-sm text-text-muted">
          <code>VITE_API_URL</code> was not set at build time. This deployment doesn't know which
          backend to talk to. Rebuild the app with <code>VITE_API_URL</code> pointing at the
          backend's public URL.
        </p>
      </div>
    </div>
  )
}
