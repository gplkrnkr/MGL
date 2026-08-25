const DEV_FALLBACK_API_URL = 'http://localhost:8000'

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined

export const isConfigValid = Boolean(rawApiUrl) || !import.meta.env.PROD

export const API_BASE_URL = rawApiUrl ?? DEV_FALLBACK_API_URL

// The backend also serves signed file URLs (e.g. `/files/documents/...`) at its
// root, not under `/api` -- derive the bare origin for building absolute links
// to them (they're relative paths, meant to resolve against the backend, not
// wherever this web app happens to be hosted).
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
