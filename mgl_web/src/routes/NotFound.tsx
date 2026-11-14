import { Button } from '../components/ui/Button'

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold text-text">Page not found</h1>
        <p className="text-sm text-text-muted">
          The page you're looking for doesn't exist or has moved.
        </p>
        {/* A plain link (full page load): the home page is served outside this app. */}
        <a href="/">
          <Button>Back to home</Button>
        </a>
      </div>
    </div>
  )
}
