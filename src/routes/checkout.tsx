import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCart } from '@/features/cart/hooks/useCart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { ShoppingCart, Trash2 } from 'lucide-react'

import { apiClient } from '@/api/client'
import { useQuery } from '@tanstack/react-query'
import { fetchNFTDetail } from '@/features/nfts/api/nftApi'
import { useNFTs } from '@/features/nfts/hooks/useNFTs'
import type { NFT } from '@/api/types'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout')({
  component: CheckoutRoute,
})

// Helper component for Cart Item
function CartItemRow({ item, onUpdate }: { item: any, onUpdate: (vars: {nftId: string, quantity: number}) => void }) {
  const { data: nft } = useQuery({
    queryKey: ['nfts', item.nftId],
    queryFn: () => fetchNFTDetail(item.nftId)
  })

  if (!nft) return <div className="animate-pulse h-24 bg-muted rounded-lg" />

  return (
    <div className="cart-line">
      <img src={nft.image} alt={nft.title} />
      <div className="cart-line-description">
        <h4>{nft.title}</h4>
        <p>{nft.edition ? `Edição: ${nft.edition}` : `ID do token: #${item.nftId.replace(/\D/g, '').padStart(4, '0')}`}</p>
      </div>
      <span className="cart-unit-price">{nft.price} ETH</span>
      <div className="cart-quantity">
        <Button variant="outline" size="icon" aria-label="Diminuir quantidade" onClick={() => onUpdate({nftId: item.nftId, quantity: item.quantity - 1})}>-</Button>
        <span className="w-8 text-center">{item.quantity}</span>
        <Button variant="outline" size="icon" aria-label="Aumentar quantidade" disabled={item.quantity >= nft.available} onClick={() => onUpdate({nftId: item.nftId, quantity: item.quantity + 1})}>+</Button>
      </div>
      <strong className="cart-line-total">{(Number(nft.price) * item.quantity).toFixed(2)} ETH</strong>
      <Button variant="ghost" size="icon" className="cart-remove-button" aria-label={`Remover ${nft.title} do carrinho`} onClick={() => onUpdate({ nftId: item.nftId, quantity: 0 })}><Trash2 size={13} /></Button>
    </div>
  )
}

function CheckoutRoute() {
  const { cart, isLoading, updateCart, applyCoupon } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const { data: session } = useQuery({ queryKey: ['session'], queryFn: async () => (await apiClient.get('/session')).data })
  const { data: nftData } = useNFTs({ page: 1 })
  const { data: nextNftPage } = useNFTs({ page: 2 })
  const [recommendationPage, setRecommendationPage] = useState(0)
  const navigate = useNavigate()

  if (isLoading) return <div className="marketplace-screen"><div className="screen-skeleton" /></div>

  if (!cart?.items?.length) {
    return (
      <div className="marketplace-screen cart-empty-state">
        <span className="empty-cart-icon"><ShoppingCart size={32} /></span>
        <h1>Seu carrinho está vazio</h1>
        <p>Adicione NFTs ao carrinho para continuar sua compra.</p>
        <Button size="lg" onClick={() => navigate({ to: '/', search: { page: 1 } })}>Explorar NFTs</Button>
      </div>
    )
  }

  const recommendations: NFT[] = ([...(nftData?.data ?? []), ...(nextNftPage?.data ?? [])] as NFT[]).filter((item) => !cart.items.some((cartItem: { nftId: string }) => cartItem.nftId === item.id)).slice(0, 15)
  const recommendationPages = Math.ceil(recommendations.length / 5)
  const visibleRecommendations = recommendations.slice(recommendationPage * 5, recommendationPage * 5 + 5)

  return (
    <div className="marketplace-screen cart-page">
      <nav className="nft-breadcrumb" aria-label="Trilha de navegação"><Link to="/">Início</Link><span>/</span><Link to="/">Mercado</Link><span>/</span><span>Carrinho</span></nav>
      <header className="screen-heading cart-screen-heading"><p>MARKETPLACE / CARRINHO</p><h1>Seu carrinho</h1></header>
      
      <div className="cart-layout">
        <section className="cart-items-panel" aria-label="Itens no carrinho">
          <div className="cart-table-heading"><span>NFTs</span><span>Preço</span><span>Edições</span><span>Subtotal</span><span aria-hidden="true" /></div>
          <div className="cart-items-list">
            {cart.items.map((item: any) => (
              <CartItemRow key={item.nftId} item={item} onUpdate={updateCart} />
            ))}
          </div>
        </section>

        <aside className="cart-summary">
            <h2>Resumo da carteira</h2>
            
            <div className="summary-lines">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>{cart.subtotal} ETH</span>
              </div>
              <div className="summary-line">
                <span>Taxa de rede</span>
                <span>{cart.fee} ETH</span>
              </div>
              <div className="summary-line discount-line">
                <span>Desconto de lançamento</span>
                <span>-{Number(cart.discount).toFixed(2)} ETH</span>
              </div>
              
              <div className="summary-total">
                  <span>Total</span>
                  <span>{cart.total} ETH</span>
              </div>
            </div>

            <div className="coupon-row">
                <Input 
                  placeholder="Digite o código promocional..." 
                  aria-label="Código promocional"
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                />
                <Button variant="secondary" onClick={() => applyCoupon(couponCode)}>Aplicar</Button>
            </div>

            <Button 
              className="continue-payment-button" 
              size="lg"
              onClick={() => {
                if (!session?.user) {
                  window.location.href = `/login?redirect=${encodeURIComponent('/checkout')}`
                } else {
                  navigate({ to: '/payment' })
                }
              }}
            >
              Conectar e finalizar
            </Button>
            <Button variant="outline" className="continue-shopping-button" onClick={() => navigate({ to: '/', search: { page: 1 } })}>Continuar explorando</Button>
        </aside>
      </div>

      <section className="cart-recommendations" aria-label="Colecionadores também viram">
        <h2>Colecionadores também viram</h2>
        <div className="cart-recommendation-grid">{visibleRecommendations.map((item) => <Link to="/nft/$id" params={{ id: item.id }} key={item.id} className="cart-recommendation"><img src={item.image} alt={item.title} loading="lazy" /><strong>{item.title}</strong><span>{item.price} ETH</span></Link>)}</div>
        {recommendationPages > 1 && <div className="nft-collection-pagination" role="group" aria-label="Páginas de recomendações">{Array.from({ length: recommendationPages }, (_, page) => <button type="button" key={page} className={recommendationPage === page ? 'active' : ''} aria-label={`Mostrar recomendações ${page + 1}`} aria-current={recommendationPage === page ? 'true' : undefined} onClick={() => setRecommendationPage(page)} />)}</div>}
      </section>
    </div>
  )
}
