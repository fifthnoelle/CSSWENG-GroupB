import type { User } from '../types'
//import { BASE_URL } from './auth.service'

export async function getAllUsers(): Promise<User[]> {
  const res = await fetch('${BASE_URL}/load-users', {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}


export async function createUser(data: { email: string, firstName: string, lastName: string, password: string, role: 'admin' | 'staff' }) {
    const res = await fetch('${BASE_URL}/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include', 
    })
    if (!res.ok) throw new Error('Failed to create user')
    return res.json()
}

/*
WAITING FOR BACKEND IMPLEMENTATION
export async function updateUser(userId: string, data: Partial<User>) {
  const res = await fetch('${BASE_URL}/update-user/${userId}', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to update user')
}
*/

/*
WAITING FOR BACKEND IMPLEMENTATION
export async function deleteUser(userId: string) {
  const res = await fetch('${BASE_URL}/delete-user/${userId}', {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete user')
}
  */