// The sign-in session lives in an HttpOnly cookie set by the backend, which page scripts can't
// read (so an injected script can't steal it). The browser only keeps this non-secret hint, so the
// site knows whether to ask the backend who is signed in. Anonymous visitors then never trigger a
// 401.
const SIGNED_IN_KEY = 'mgl_signed_in'
// Before the cookie, the token itself sat in localStorage under this key.
const LEGACY_TOKEN_KEY = 'mgl_token'

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Removes a token left by the old localStorage sign-in. Those users sign in once more. */
export function dropLegacyToken(): void {
  try {
    storage()?.removeItem(LEGACY_TOKEN_KEY)
  } catch {
    // Storage blocked: nothing to drop.
  }
}

export function isSignedIn(): boolean {
  try {
    return storage()?.getItem(SIGNED_IN_KEY) === '1'
  } catch {
    return false
  }
}

export function markSignedIn(): void {
  try {
    storage()?.setItem(SIGNED_IN_KEY, '1')
  } catch {
    // Storage blocked: the session cookie still works for this page view.
  }
}

export function markSignedOut(): void {
  try {
    storage()?.removeItem(SIGNED_IN_KEY)
  } catch {
    // Nothing stored.
  }
}
