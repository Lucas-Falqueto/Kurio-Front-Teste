import { apiClient } from './client'

export const fetchProfile = async () => {
  const response = await apiClient.get('/profile')
  return response.data
}

export const updateProfile = async (data: any) => {
  const response = await apiClient.patch('/profile', data)
  return response.data
}

export const updatePassword = async (data: any) => {
  const response = await apiClient.patch('/profile/password', data)
  return response.data
}

export const fetchWallets = async () => {
  const response = await apiClient.get('/wallets')
  return response.data
}

export const addWallet = async (data: any) => {
  const response = await apiClient.post('/wallets', data)
  return response.data
}

export const updateWallet = async (id: string, data: any) => {
  const response = await apiClient.put(`/wallets/${id}`, data)
  return response.data
}
