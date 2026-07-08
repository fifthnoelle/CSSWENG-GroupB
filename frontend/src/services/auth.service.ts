// Auth service — all API calls for authentication
// Replace BASE_URL with the actual backend URL once connected

import type { PreviousLogin } from '../types'

export const BASE_URL = '/api'

// Bug fix (#6): typed so previousLogin isn't just `any` at every call site.
export interface LoginResponse {
  message: string
  role: 'admin' | 'staff'
  previousLogin: PreviousLogin
}

// Bug fix (#8): this shared helper is used by inventory.service.ts,
// user.service.ts, logs.service.ts, and reports.service.ts, which used to
// each define their own near-identical parseError function — and only two
// of the four (logs, reports) redirected to /login on a 401 (session
// expired), so an expired session behaved differently depending on which
// page you were on. Now all four behave the same way.
//
// login/getUser/getSecurityQuestion/resetPasswordWithAnswer below
// intentionally do NOT use this — a 401 from those means "wrong password"
// or "no session yet" (getUser is literally how the app checks whether
// there IS a session), not "your session just expired", so redirecting
// would be wrong, or on the login page itself, a pointless no-op / loop.
export async function parseApiError(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) {
    window.location.href = '/login'
  }
  try {
    const body = await res.json()
    return body?.error || body?.message || fallback
  } catch {
    return fallback
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  })

  if (!res.ok) {
    let errorMessage = 'Invalid email or password'
    try {
      const errorBody = await res.json()
      if (errorBody?.error) errorMessage = errorBody.error
      else if (errorBody?.message) errorMessage = errorBody.message
    } catch {
      // ignore invalid JSON body
    }
    throw new Error(errorMessage)
  }

  return res.json()
}

export async function getUser() {
  const res = await fetch(`${BASE_URL}/current-user`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

// 2.1.8 — password recovery step 1: fetch the account's security question
export async function getSecurityQuestion(email: string): Promise<{ question: string }> {
  const res = await fetch(`${BASE_URL}/forgot-password/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    let errorMessage = 'Unable to find a security question for that email'
    try {
      const errorBody = await res.json()
      if (errorBody?.error) errorMessage = errorBody.error
    } catch {
      // ignore invalid JSON body
    }
    throw new Error(errorMessage)
  }

  return res.json()
}

// 2.1.8 / 2.1.9 — password recovery step 2: verify the answer and set a new password
export async function resetPasswordWithAnswer(email: string, securityAnswer: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/forgot-password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, securityAnswer, newPassword }),
  })

  if (!res.ok) {
    let errorMessage = 'Failed to reset password'
    try {
      const errorBody = await res.json()
      if (errorBody?.error) errorMessage = errorBody.error
    } catch {
      // ignore invalid JSON body
    }
    throw new Error(errorMessage)
  }

  return res.json()
}
export async function logout() {
  await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

// 2.1.12 — self-service password change, re-authenticated server-side with currentPassword
export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
    credentials: 'include',
  })

  if (!res.ok) {
    let errorMessage = 'Failed to change password'
    try {
      const errorBody = await res.json()
      if (errorBody?.error) errorMessage = errorBody.error
    } catch {
      // ignore invalid JSON body
    }
    throw new Error(errorMessage)
  }

  return res.json()
}
