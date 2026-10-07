import { useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, MoreVertical, WalletCards } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useCart } from '@/features/cart/hooks/useCart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchNFTDetail } from '@/features/nfts/api/nftApi'
import type { CollectorDetails, NFT } from '@/api/types'

export const Route = createFileRoute('/payment')({ component: PaymentRoute })

import { fetchWallets } from '@/api/profileApi'
import type { Wallet } from '@/api/types'

function PaymentNFTItem({ item }: { item: { nftId: string; quantity: number; price?: string } }) {
  const { data: nft } = useQuery({ queryKey: ['nfts', item.nftId], queryFn: () => fetchNFTDetail(item.nftId) })
  if (!nft) return <div className="payment-nft-line is-loading" />
  const typedNft = nft as NFT
  return <div className="payment-nft-line"><img src={typedNft.image} alt="" /><div><strong>{typedNft.title}</strong><small>ID do token: #{item.nftId.replace(/\D/g, '').padStart(4, '0')}</small></div><span>({item.quantity})</span><strong>{(Number(item.price ?? typedNft.price) * item.quantity).toFixed(2)} ETH</strong></div>
}

function PaymentRoute() {
  const { cart, isLoading, applyCoupon } = useCart()
  const { data: session } = useQuery({ queryKey: ['session'], queryFn: async () => (await apiClient.get('/session')).data })
  const { data: walletsData } = useQuery<Wallet[]>({ queryKey: ['wallets'], queryFn: fetchWallets })
  
  const connectedWallets = walletsData || []
  
  const [walletAddress, setWalletAddress] = useState('nova.kurio.eth')
  const [network, setNetwork] = useState('Polygon')
  const [walletType, setWalletType] = useState('Coinbase Wallet')
  const [paymentMethod, setPaymentMethod] = useState('Coinbase Wallet')
  const [selectedConnectedWallet, setSelectedConnectedWallet] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [useAnotherWallet, setUseAnotherWallet] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const idempotencyKey = useRef(crypto.randomUUID())

  // Default selection when wallets load
  if (connectedWallets.length > 0 && !selectedConnectedWallet && !useAnotherWallet) {
    const primary = connectedWallets.find(w => w.isPrimary) || connectedWallets[0]
    setSelectedConnectedWallet(primary.id)
    setWalletAddress(primary.address)
    setWalletType(primary.type)
  }

  const selectConnectedWallet = (walletId: string) => {
    const wallet = connectedWallets.find((item) => item.id === walletId)
    if (!wallet) return
    setSelectedConnectedWallet(wallet.id)
    setWalletAddress(wallet.address)
    setWalletType(wallet.type)
  }

  const toggleConnectedWallet = () => {
    if (!connectedWallets.length) return
    setSelectedConnectedWallet((currentWalletId) => {
      const currentIndex = connectedWallets.findIndex(w => w.id === currentWalletId)
      const nextIndex = (currentIndex + 1) % connectedWallets.length
      const nextWallet = connectedWallets[nextIndex]

      if (!nextWallet) return currentWalletId

      setWalletAddress(nextWallet.address)
      setWalletType(nextWallet.type)

      return nextWallet.id
    })
  }

  const paymentMutation = useMutation({
    mutationFn: async (collectorDetails: CollectorDetails) => {
      const response = await apiClient.post('/orders', {
        idempotencyKey: idempotencyKey.current,
        walletAddress,
        network,
        walletType,
        paymentMethod,
        collectorDetails,
        expectedCart: {
          items: cart.items,
          subtotal: cart.subtotal,
          discount: cart.discount,
          fee: cart.fee,
          total: cart.total,
        },
      })
      return response.data
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['nfts'] })
      navigate({ to: '/order/$id', params: { id: order.id } })
    },
    onError: (cause: any) => {
      if (cause.response?.status === 409) queryClient.invalidateQueries({ queryKey: ['cart'] })
      setError(cause.response?.data?.message ?? 'Não foi possível iniciar o pagamento. Tente novamente.')
    },
  })

  if (isLoading) return <div className="marketplace-screen"><div className="screen-skeleton" /></div>
  if (!cart?.items?.length) return <div className="marketplace-screen cart-empty-state"><h1>Seu carrinho está vazio</h1><p>Adicione NFTs antes de iniciar o pagamento.</p><Button asChild><Link to="/">Explorar NFTs</Link></Button></div>

  return (
    <div className="marketplace-screen payment-page">
      <nav className="nft-breadcrumb" aria-label="Trilha de navegação"><Link to="/">Início</Link><span>/</span><Link to="/">Mercado</Link><span>/</span><span>Pagamento</span></nav>
      <header className="screen-heading payment-screen-heading"><p>MARKETPLACE / PAGAMENTO</p><h1>Perfil do colecionador</h1></header>
      <div className="payment-layout">
        <form id="payment-form" className="payment-form" noValidate onSubmit={(event) => {
          event.preventDefault()
          setError('')
          if (window.matchMedia('(min-width: 768px)').matches && !event.currentTarget.reportValidity()) return
          if (!session?.user) { navigate({ to: '/login' }); return }
          const formData = new FormData(event.currentTarget)
          paymentMutation.mutate({
            displayName: String(formData.get('displayName') ?? ''),
            username: String(formData.get('username') ?? ''),
            profileName: String(formData.get('profileName') ?? ''),
            secondaryWallet: String(formData.get('secondaryWallet') ?? ''),
            settlementCode: String(formData.get('settlementCode') ?? ''),
            email: String(formData.get('email') ?? ''),
            ensName: String(formData.get('ensName') ?? ''),
            useAnotherWallet: formData.has('useAnotherWallet'),
            note: String(formData.get('note') ?? ''),
          })
        }}>
          <div className="payment-fields">
            <label>Nome de exibição <span className="required-mark">*</span><Input name="displayName" placeholder="Nome de exibição" required /></label>
            <label>Nome de usuário <span className="required-mark">*</span><Input name="username" placeholder="Nome de usuário" required /></label>
            <label>Rede <span className="required-mark">*</span><select name="network" value={network} onChange={(event) => setNetwork(event.target.value)} required><option value="" disabled>Selecione uma rede</option><option value="Ethereum">Ethereum</option><option value="Polygon">Polygon</option><option value="Solana">Solana</option></select></label>
            <label>Nome do perfil <span className="required-mark">*</span><Input name="profileName" placeholder="Nome do perfil" required /></label>
            <label>Endereço da carteira <span className="required-mark">*</span><Input name="walletAddress" value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder="Endereço da carteira" required /></label>
            <label>ENS ou carteira secundária (opcional)<Input name="secondaryWallet" placeholder="nome.eth ou 0x..." /></label>
            <label>Tipo de carteira <span className="required-mark">*</span><select name="walletType" value={walletType} onChange={(event) => setWalletType(event.target.value)} required><option value="" disabled>Selecione uma carteira</option><option>MetaMask</option><option>WalletConnect</option><option>Coinbase Wallet</option></select></label>
            <label>Código de liquidação <span className="required-mark">*</span><Input name="settlementCode" placeholder="Código de liquidação" required /></label>
            <label>E-mail <span className="required-mark">*</span><Input name="email" type="email" placeholder="E-mail" required /></label>
            <label>Nome ENS <span className="required-mark">*</span><select name="ensName" defaultValue=".eth"><option>.eth</option><option>.art</option></select></label>
            <label className="payment-other-wallet"><input name="useAnotherWallet" type="checkbox" checked={useAnotherWallet} onChange={(event) => setUseAnotherWallet(event.target.checked)} /><span><Check size={10} /></span> Usar outra carteira?</label>
            <label className="payment-field-wide">Observação do colecionador (opcional)<textarea name="note" rows={4} placeholder="Deixe uma mensagem para o criador" /></label>
          </div>
        </form>
        <aside className="payment-summary">
          <h2 className="payment-summary-title">Seus NFTs</h2>
          <section className="mobile-connected-wallets" aria-label="Carteiras conectadas">
            <div className="mobile-wallet-heading"><strong>Carteira conectada</strong><button type="button" onClick={toggleConnectedWallet}>Trocar carteira</button></div>
            <div className="mobile-connected-wallet-list">
              {connectedWallets.map((wallet) => <div className={`mobile-connected-wallet-card ${selectedConnectedWallet === wallet.id ? 'selected' : ''}`} key={wallet.id}>
                <input id={`connected-wallet-${wallet.id}`} type="radio" name="connectedWallet" checked={selectedConnectedWallet === wallet.id} onChange={() => selectConnectedWallet(wallet.id)} />
                <label htmlFor={`connected-wallet-${wallet.id}`}>
                  <span className="connected-wallet-radio" />
                  <span className="connected-wallet-copy"><strong>{wallet.label}</strong><span>{wallet.address}</span><small>Tipo: {wallet.type}</small></span>
                </label>
                <button type="button" className="connected-wallet-more" aria-label={`Opções da carteira ${wallet.label}`} onClick={() => selectConnectedWallet(wallet.id)}><MoreVertical size={16} /></button>
              </div>)}
            </div>
          </section>
          <div className="payment-nft-table-heading"><span>NFTs</span><span>Subtotal</span></div>
          <div className="payment-nft-list">{cart.items.map((item: { nftId: string; quantity: number }) => <PaymentNFTItem key={item.nftId} item={item} />)}</div>
          <p className="payment-promo-note">Tem um código promocional? Aplique aqui.</p>
          <div className="payment-promo"><Input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Código promocional" aria-label="Código promocional" /><Button type="button" variant="outline" onClick={() => applyCoupon(couponCode)}>Aplicar</Button></div>
          <div className="summary-lines"><div className="summary-line"><span>Subtotal</span><span>{cart.subtotal} ETH</span></div><div className="summary-line"><span>Desconto de lançamento</span><span>-{Number(cart.discount).toFixed(2)} ETH</span></div><div className="summary-line"><span>Taxa de rede</span><span>{cart.fee} ETH</span></div><div className="summary-total"><span>Total</span><strong>{cart.total} ETH</strong></div></div>
          <fieldset className="payment-methods"><legend>Carteira e rede</legend>{[['WalletConnect', 'WalletConnect', 'W'], ['MetaMask', 'MetaMask', 'M'], ['Coinbase Wallet', 'Coinbase Wallet', 'wallet']].map(([value, label, icon]) => <label className={paymentMethod === value ? 'selected' : ''} key={value}>
            <input form="payment-form" type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => { setPaymentMethod(value); setWalletType(value) }} />
            <span className="payment-method-icon">{icon === 'wallet' ? <WalletCards size={17} /> : icon}</span>
            <span className="payment-method-radio"><Check size={9} /></span>
            <span className="payment-method-name">{label}</span>
          </label>)}</fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button className="confirm-payment-button" type="submit" form="payment-form" disabled={paymentMutation.isPending}>{paymentMutation.isPending ? 'Processando compra…' : 'Confirmar compra'}</Button>
        </aside>
      </div>
    </div>
  )
}
