import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useNFTDetail, useNFTs, useFavorites, useToggleFavorite } from '@/features/nfts/hooks/useNFTs'
import type { NFT } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Check, Copy, Heart, Minus, Plus, Share2, ZoomIn, ShoppingCart } from 'lucide-react'

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export const Route = createFileRoute('/nft/$id')({
  component: NFTDetailRoute,
})

function NFTDetailRoute() {
  const navigate = useNavigate({ from: '/nft/$id' })
  const { id } = Route.useParams()
  const { data: nft, isLoading } = useNFTDetail(id)
  const { data: collectionData } = useNFTs({ page: 1 })
  
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await apiClient.get('/session')).data,
    retry: false,
  })
  const isAuthenticated = !!(session as any)?.user
  const { data: favoritesData } = useFavorites()
  const { mutate: toggleFav } = useToggleFavorite()
  
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')
  const [collectionPage, setCollectionPage] = useState(0)
  const [edition, setEdition] = useState('1/1')
  const [isZoomed, setIsZoomed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState('')
  
  const addToCartMutation = useMutation({
    mutationFn: async (itemQuantity: number) => {
      const res = await apiClient.post('/cart', { nftId: id, quantity: itemQuantity })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      // Toast notification would go here
    }
  })

  if (isLoading) return <div className="marketplace-screen nft-detail-page"><div className="screen-skeleton" /></div>
  
  if (!nft) return <div className="marketplace-screen not-found-page"><h1>Obra não encontrada</h1><p>Este NFT não está mais disponível no marketplace.</p></div>

  const relatedNfts: NFT[] = (collectionData?.data ?? []).filter((item: NFT) => item.id !== nft.id)
  const collectionPageCount = Math.ceil(relatedNfts.length / 5)
  const visibleCollectionNfts = relatedNfts.slice(collectionPage * 5, collectionPage * 5 + 5)
  const galleryImages = [nft.image, ...relatedNfts.map((item) => item.image)].slice(0, 4)
  const selectedImage = galleryImages[activeImage] ?? nft.image

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setShareError('')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setShareError('Não foi possível copiar o link neste navegador.')
    }
  }

  const handleAddToCart = (itemQuantity: number) => {
    addToCartMutation.mutate(itemQuantity)
  }

  return (
    <div className="marketplace-screen nft-detail-page">
      <nav className="nft-breadcrumb" aria-label="Trilha de navegação">
        <Link to="/" search={{ page: 1 }}>Início</Link>
        <span>/</span><span>Mercado</span>
      </nav>
      <section className="nft-detail-layout" aria-label="Detalhes do NFT">
        <div className="nft-gallery">
          <div className="nft-thumbnails" aria-label="Imagens do NFT">
            {galleryImages.map((image, index) => <button type="button" className={activeImage === index ? 'active' : ''} key={`${image}-${index}`} onClick={() => setActiveImage(index)} aria-label={`Ver imagem ${index + 1} de ${nft.title}`} aria-pressed={activeImage === index}><img src={image} alt="" /></button>)}
          </div>
          <div className={`nft-artwork-panel ${isZoomed ? 'is-zoomed' : ''}`}>
            <img src={selectedImage} alt={nft.title} className="nft-main-artwork" />
            <button className="artwork-zoom" type="button" onClick={() => setIsZoomed((zoomed) => !zoomed)} aria-label={isZoomed ? 'Reduzir imagem' : 'Ampliar imagem'}><ZoomIn size={16} /></button>
          </div>
        </div>

        <div className="nft-information">
          <div className="nft-title-row"><h1>{nft.title}</h1></div>
          <div className="nft-price-rating"><strong>{nft.price} ETH</strong><span aria-label="5 de 5 estrelas"><span className="nft-stars">★★★★★</span><small>19 avaliações de colecionadores</small></span></div>
          <div className="nft-overview"><h2>Sobre este NFT</h2><p>{nft.description}</p><p>Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na blockchain, com arte desbloqueável e acesso para colecionadores.</p></div>
          <div className="nft-edition"><strong>Edição:</strong><div role="group" aria-label="Selecionar edição">{['1/1', '1/18', '1/50', 'Aberta'].map((option) => <button type="button" key={option} className={edition === option ? 'selected' : ''} aria-pressed={edition === option} onClick={() => setEdition(option)}>{option}</button>)}</div></div>
          <div className="nft-actions desktop-only">
            <div className="nft-quantity" aria-label="Quantidade">
              <button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={13} /></button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Aumentar quantidade" disabled={quantity >= nft.available} onClick={() => setQuantity((value) => Math.min(nft.available, value + 1))}><Plus size={13} /></button>
            </div>
            <Button size="lg" className="nft-add-button" disabled={nft.available === 0 || addToCartMutation.isPending} onClick={() => handleAddToCart(quantity)}>
              {nft.available === 0 ? 'ESGOTADO' : addToCartMutation.isPending ? 'ADICIONANDO...' : 'COMPRAR'}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className={`nft-favorite-button ${isAuthenticated && Array.isArray(favoritesData) && favoritesData.includes(nft.id) ? 'is-favorite' : ''}`} 
              aria-pressed={isAuthenticated && Array.isArray(favoritesData) && favoritesData.includes(nft.id)} 
              onClick={() => {
                if (!isAuthenticated) return navigate({ to: '/login' });
                toggleFav({ nftId: nft.id, isFavorite: isAuthenticated && Array.isArray(favoritesData) && favoritesData.includes(nft.id) });
              }}
            >
              <Heart size={14} fill={isAuthenticated && Array.isArray(favoritesData) && favoritesData.includes(nft.id) ? 'currentColor' : 'none'} /> Favoritar
            </Button>
          </div>

          <div className="mobile-fixed-action-bar mobile-only">
            <div className="mobile-action-top-row">
              <div className="mobile-action-qty">
                <span>Qtd.</span>
                <div className="nft-quantity">
                  <button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={13} /></button>
                  <span aria-live="polite">{quantity}</span>
                  <button type="button" disabled={quantity >= nft.available} onClick={() => setQuantity((value) => Math.min(nft.available, value + 1))}><Plus size={13} /></button>
                </div>
              </div>
              <div className="mobile-action-price">{nft.price} ETH</div>
            </div>
            <div className="mobile-action-bottom-row">
              <Button size="lg" className="mobile-action-buy-btn" disabled={nft.available === 0 || addToCartMutation.isPending} onClick={() => handleAddToCart(quantity)}>
                {nft.available === 0 ? 'ESGOTADO' : addToCartMutation.isPending ? 'ADICIONANDO...' : 'Adicionar ao carrinho'}
              </Button>
              <button className="mobile-action-cart-btn" type="button" aria-label="Abrir carrinho" onClick={() => navigate({ to: '/checkout' })}><ShoppingCart size={18} /></button>
            </div>
          </div>
          <div className="nft-facts"><p>ID do token: <strong>#{nft.id.replace(/\D/g, '').padStart(4, '0')}</strong></p><p>Coleção: <strong>Kurio Ape</strong></p><p>Atributos: <strong>Óculos, Esmeralda, Raro</strong></p><div><span>Compartilhar este NFT:</span><button type="button" onClick={copyLink} aria-label={copied ? 'Link copiado' : 'Copiar link'}>{copied ? <Check size={13} /> : <Copy size={13} />}</button><button type="button" onClick={copyLink} aria-label="Compartilhar NFT"><Share2 size={13} /></button></div></div>
          {addToCartMutation.isSuccess && <p className="nft-feedback" role="status">{quantity} {quantity === 1 ? 'unidade adicionada' : 'unidades adicionadas'} ao carrinho.</p>}
          {addToCartMutation.isError && <p className="nft-feedback nft-error" role="alert">Não foi possível adicionar ao carrinho. Tente novamente.</p>}
          {shareError && <p className="nft-feedback nft-error" role="alert">{shareError}</p>}
        </div>
      </section>

      <section className="nft-detail-tabs" aria-label="Informações e avaliações">
        <div className="nft-tab-list" role="tablist">
          <button type="button" role="tab" aria-selected={activeTab === 'details'} className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>Detalhes do NFT</button>
          <button type="button" role="tab" aria-selected={activeTab === 'reviews'} className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Avaliações de colecionadores (19)</button>
        </div>
        {activeTab === 'details' ? <div className="nft-detail-copy" role="tabpanel">
          <p>{nft.title} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.</p>
          <p>A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrado na rede. Sua taxa recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.</p>
          <p><strong>Rede:</strong><br />Confiada na Ethereum com procedência imutável e metadados armazenados no IPFS.</p>
          <p><strong>Contrato:</strong><br />Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</p>
          <p><strong>Direitos autorais:</strong><br />0x7A2...1198 · Contrato inteligente ERC-721 verificado.</p>
        </div> : <div className="nft-review-panel" role="tabpanel">
          <div><span className="nft-stars">★★★★★</span><strong>5,0</strong><small>19 avaliações verificadas</small></div>
          <p><strong>Peça incrível, acabamento impecável.</strong><span> Colecionador verificado · há 2 dias</span></p>
          <p><strong>Arte e procedência excelentes.</strong><span> Colecionador verificado · há 1 semana</span></p>
        </div>}
      </section>

      <section className="nft-collection-section" aria-label="Mais desta coleção">
        <h2>Mais desta coleção</h2>
        <div className="nft-collection-grid">{visibleCollectionNfts.map((item) => <Link to="/nft/$id" params={{ id: item.id }} className="nft-collection-card" key={item.id}><img src={item.image} alt={item.title} loading="lazy" /><strong>{item.title}</strong><span>{item.price} ETH</span></Link>)}</div>
        {collectionPageCount > 1 && <div className="nft-collection-pagination" role="group" aria-label="Navegação da coleção">
          {Array.from({ length: collectionPageCount }, (_, page) => <button type="button" key={page} className={collectionPage === page ? 'active' : ''} aria-label={`Mostrar página ${page + 1} da coleção`} aria-current={collectionPage === page ? 'true' : undefined} onClick={() => setCollectionPage(page)} />)}
        </div>}
      </section>
    </div>
  )
}
