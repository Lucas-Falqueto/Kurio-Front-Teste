import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { subscribeToEvents } from '@/api/socket'
import { useQueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { MarketplaceFooter, MarketplaceHeader } from './HomePage'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // We import socket here or simply use the existing import
    import('@/api/socket').then(({ socket }) => {
      socket.connect();
    });

    const unsubscribe = subscribeToEvents({
      onNftUpdated: () => {
        // Optimistic cache update or invalidation
        queryClient.invalidateQueries({ queryKey: ['nfts'] })
      },
      onOrderUpdated: (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        toast(`O pedido ${data.orderId || ''} mudou para o status: ${data.status}`)
      }
    })
    return () => {
      unsubscribe();
      import('@/api/socket').then(({ socket }) => {
        socket.disconnect();
      });
    }
  }, [queryClient])

  return (
    <div className="app-shell">
      <MarketplaceHeader />
      <main className="app-main"><Outlet /></main>
      <MarketplaceFooter />
      <Toaster />
    </div>
  )
}

