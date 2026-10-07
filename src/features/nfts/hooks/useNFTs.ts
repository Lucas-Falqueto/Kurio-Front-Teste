import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNFTs, fetchNFTDetail, fetchFavorites, addFavorite, removeFavorite } from '../api/nftApi'

export function useNFTs(params: { page?: number; search?: string; category?: string; sort?: string; minPrice?: number; maxPrice?: number; network?: string }) {
  return useQuery({
    queryKey: ['nfts', params],
    queryFn: () => fetchNFTs(params),
    retry: false,
  })
}

export function useNFTDetail(id: string) {
  return useQuery({
    queryKey: ['nfts', id],
    queryFn: () => fetchNFTDetail(id),
    retry: false,
  })
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    retry: false,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nftId, isFavorite }: { nftId: string, isFavorite: boolean }) => {
      if (isFavorite) {
        return await removeFavorite(nftId)
      }
      return await addFavorite(nftId)
    },
    onMutate: async ({ nftId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previousFavorites = queryClient.getQueryData<string[]>(['favorites'])
      
      queryClient.setQueryData<string[]>(['favorites'], old => {
        if (!old) return isFavorite ? [] : [nftId]
        return isFavorite ? old.filter(id => id !== nftId) : [...old, nftId]
      })
      
      return { previousFavorites }
    },
    onError: (_err, _newFav, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
