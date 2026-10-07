import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export function useCart() {
  const queryClient = useQueryClient()

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await apiClient.get('/cart')
      return res.data
    }
  })

  const updateCartMutation = useMutation({
    mutationFn: async ({ nftId, quantity }: { nftId: string, quantity: number }) => {
      const res = await apiClient.post('/cart', { nftId, quantity })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      queryClient.invalidateQueries({ queryKey: ['cart'], refetchType: 'active' })
    }
  })

  const applyCouponMutation = useMutation({
    mutationFn: async (coupon: string) => {
      const res = await apiClient.post('/quote', { coupon })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data)
      queryClient.invalidateQueries({ queryKey: ['cart'], refetchType: 'active' })
    }
  })

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    updateCart: updateCartMutation.mutate,
    applyCoupon: applyCouponMutation.mutate,
    isUpdating: updateCartMutation.isPending,
  }
}
