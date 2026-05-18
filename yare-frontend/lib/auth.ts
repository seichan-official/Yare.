'use client'

const ACCESS_TOKEN_KEY = 'yare_access_token'
const REFRESH_TOKEN_KEY = 'yare_refresh_token'
const USER_KEY = 'yare_user'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function saveUser(user: object) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser<T>(): T | null {
  if (typeof window === 'undefined') return null
  const s = localStorage.getItem(USER_KEY)
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}
