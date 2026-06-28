import type { User } from '../types'
import { BASE_URL } from './auth.service'

export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/load-users`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}


export async function createUser(data: { email: string, firstName: string, lastName: string, password: string, role: 'admin' | 'staff', securityQuestion: string, securityAnswer: string }) {
    const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include', 
    })
    if (!res.ok) {
        let errorMessage = 'Failed to create user'
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

export async function updateUser(_id: string, data: { email: string, firstName: string, lastName: string, role: 'admin' | 'staff', password?: string }) {
  const res = await fetch(`${BASE_URL}/update-user/${_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to update user')
  return res.json()
}
/*
WAITING FOR BACKEND IMPLEMENTATION
export async function updateUser(_id: string, data: Partial<User>) {
  const res = await fetch(`${BASE_URL}/update-user/${_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to update user')
}
*/

export async function searchUsers(query: string): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/search-users?query=${encodeURIComponent(query)}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to search users')
  return res.json()
}


export async function deleteUser(_id: string) {
  const res = await fetch(`${BASE_URL}/delete-user/${_id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete user')
}
