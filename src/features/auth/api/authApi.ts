import { apiClient } from '@/api/client'

export const login = async (credentials: any) => {
  const response = await apiClient.post('/auth/login', credentials)
  return response.data
}

export const logout = async () => {
  const response = await apiClient.post('/auth/logout')
  return response.data
}
