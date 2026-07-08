// User service — all API calls for user management (admin only)

// Bug fix (#8): shared parseApiError (see auth.service.ts) replaces the
// local parseError this file used to define — the local version never
// redirected to /login on a 401, unlike logs/reports.service.ts, so an
// expired session behaved differently depending on which page you were on.
import { BASE_URL, parseApiError as parseError } from './auth.service'

export async function getAllUsers() {
  const res = await fetch(`${BASE_URL}/load-users`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch users'))
  return res.json()
}

export async function searchUsers(query: string) {
  const res = await fetch(`${BASE_URL}/search-users?query=${encodeURIComponent(query)}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to search users'))
  return res.json()
}

export async function createUser(data: {
  email: string
  firstName: string
  // Bug fix (#2): middleName is now actually sent/stored — it used to be
  // collected on the Create Account form and then silently dropped before
  // it ever reached the API.
  middleName?: string
  lastName: string
  password: string
  role: 'admin' | 'staff'
  securityQuestion: string
  securityAnswer: string
}) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to create user'))
  }

  return res.json()
}

export async function updateUser(_id: string, data: {
  email: string
  firstName: string
  middleName?: string
  lastName: string
  role: 'admin' | 'staff'
  // Bug fix (#3): this was already supported by the backend, but nothing
  // in the Edit User UI ever sent it — there was no way for an admin to
  // reset a user's password. Now optional here AND wired up from the form.
  password?: string
}) {
  const res = await fetch(`${BASE_URL}/update-user/${_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to update user'))
  }

  return res.json()
}

export async function deleteUser(_id: string) {
  const res = await fetch(`${BASE_URL}/delete-user/${_id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to delete user'))
  }

  return res.json()
}
