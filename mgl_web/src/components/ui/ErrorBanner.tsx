export function ErrorBanner({ message = "Couldn't load this. Try refreshing the page." }: { message?: string }) {
  return (
    <div className="bg-danger-light border border-danger/20 rounded-lg p-4 text-sm text-danger">
      {message}
    </div>
  )
}
