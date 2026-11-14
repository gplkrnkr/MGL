const DEV_FALLBACK_API_URL = 'http://localhost:8000'

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined

// Web app config from Firebase console → Project settings → Your apps (Web). These values are
// public by design (they ship in every Firebase web app); access is controlled by Firebase's
// authorized domains and the backend verifying the ID token.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const missingConfig: string[] = [
  ...(rawApiUrl ? [] : ['VITE_API_URL']),
  ...Object.entries({
    VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    VITE_FIREBASE_APP_ID: firebaseConfig.appId,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name),
]

export const isConfigValid = missingConfig.length === 0 || !import.meta.env.PROD

// The demo pages (/demo/*), the field agent portal and employer worker search aren't ready for the
// public site yet. Production builds hide links to them unless VITE_SHOW_PREVIEWS=true; dev builds
// always show them. The routes themselves still work if you know the URL.
export const showPreviews = import.meta.env.VITE_SHOW_PREVIEWS === 'true' || !import.meta.env.PROD

export const API_BASE_URL = rawApiUrl ?? DEV_FALLBACK_API_URL

// The backend also serves signed file URLs (e.g. `/files/documents/...`) at its
// root, not under `/api` -- derive the bare origin for building absolute links
// to them (they're relative paths, meant to resolve against the backend, not
// wherever this web app happens to be hosted).
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
