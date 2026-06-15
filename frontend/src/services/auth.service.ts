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
  const data = await res.json()
  if (!res.ok) {
    const message = data?.message || data?.error || 'Unable to sign in. Please check your email and password.'
    throw new Error(message)
  }
  return data
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
