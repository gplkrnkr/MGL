import { getApps, initializeApp } from 'firebase/app'
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type Auth,
} from 'firebase/auth'
import { firebaseConfig } from './config'

// Phone sign-in goes through Firebase (it sends the SMS and verifies the code); the backend then
// swaps the Firebase ID token for its own session at /api/auth/firebase/verify.

let verifier: RecaptchaVerifier | null = null

function firebaseAuth(): Auth {
  const app = getApps()[0] ?? initializeApp(firebaseConfig)
  return getAuth(app)
}

/** Indian mobile numbers only for now: accepts `9876543210`, `+91 98765 43210`, `919876543210`. */
export function toE164(input: string): string {
  const digits = input.replace(/[^\d+]/g, '')
  if (/^\+91[6-9]\d{9}$/.test(digits)) return digits
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`
  throw new PhoneAuthError('Enter a valid 10-digit Indian mobile number.')
}

export class PhoneAuthError extends Error {}

export function phoneAuthErrorMessage(error: unknown): string {
  if (error instanceof PhoneAuthError) return error.message
  switch ((error as { code?: string })?.code) {
    case 'auth/invalid-verification-code':
      return 'That code is incorrect. Check it and try again.'
    case 'auth/code-expired':
      return 'This code has expired. Request a new one.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    case 'auth/invalid-phone-number':
      return 'Enter a valid mobile number.'
    case 'auth/operation-not-allowed':
    case 'auth/unauthorized-domain':
      return 'Phone sign-in is not enabled for this site yet.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

/**
 * Sends a verification code to `phone`. Resolves to a function that checks the code and returns a
 * Firebase ID token for the backend. `recaptchaContainerId` must be an element in the page.
 */
export async function sendCode(
  phone: string,
  recaptchaContainerId: string,
): Promise<(code: string) => Promise<string>> {
  const e164 = toE164(phone)
  const auth = firebaseAuth()
  verifier?.clear()
  verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' })
  const confirmation = await signInWithPhoneNumber(auth, e164, verifier)

  return async (code: string) => {
    const credential = await confirmation.confirm(code.trim())
    const idToken = await credential.user.getIdToken()
    // The backend's JWT is the session from here on; don't keep a parallel Firebase session.
    await signOut(auth).catch(() => {})
    return idToken
  }
}
