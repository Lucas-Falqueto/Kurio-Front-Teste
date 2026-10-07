import { apiClient } from '@/api/client'

const shouldSimulateError = () => {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('simulate-error') === 'true'
}

export const fetchNFTs = async (params: { page?: number; search?: string; category?: string; sort?: string; minPrice?: number; maxPrice?: number; network?: string }) => {
  if (shouldSimulateError()) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    throw new Error('Simulated NFT load error')
  }

  const response = await apiClient.get('/nfts', { params })
  return response.data
}

export const fetchNFTDetail = async (id: string) => {
  const response = await apiClient.get(`/nfts/${id}`)
  return response.data
}

export const fetchFavorites = async () => {
  const response = await apiClient.get('/favorites')
  return response.data
}

export const addFavorite = async (nftId: string) => {
  const response = await apiClient.post('/favorites', { nftId })
  return response.data
}

export const removeFavorite = async (nftId: string) => {
  const response = await apiClient.delete(`/favorites/${nftId}`)
  return response.data
}
