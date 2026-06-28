// Auth service — all API calls for authentication
// Replace BASE_URL with the actual backend URL once connected

export const BASE_URL = '/api'

export async function login(email: string, password: string) {
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
