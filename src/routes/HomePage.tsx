import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ArrowRight, ChevronDown, ChevronRight, LogIn, LogOut, Search, ShoppingCart, Settings2, ChevronLeft, Heart, Home, User, X } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNFTs, useFavorites, useToggleFavorite } from '@/features/nfts/hooks/useNFTs'
import { useCart } from '@/features/cart/hooks/useCart'
import { Button } from '@/components/ui/button'

const CustomScanIcon = ({ size = 27 }: { size?: number }) => (
  <svg width={size} height={size * (24 / 27)} viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3819 12.8913C9.28498 12.8913 5.18803 12.8913 1.09108 12.8906C0.961448 12.8906 0.827342 12.8943 0.702176 12.8667C0.25441 12.7684 -0.0480741 12.337 0.00631347 11.893C0.060701 11.4482 0.439924 11.1114 0.913021 11.1092C1.98364 11.1032 3.055 11.1062 4.12561 11.1062C11.3234 11.1062 18.5212 11.107 25.719 11.1084C25.8575 11.1084 26.0013 11.1047 26.1347 11.136C26.5743 11.2396 26.8641 11.6553 26.8179 12.0919C26.7702 12.5389 26.3947 12.8868 25.9246 12.8891C24.7139 12.8965 23.504 12.8928 22.2933 12.8928C19.3228 12.8928 16.3524 12.8928 13.3827 12.8928C13.3819 12.8928 13.3819 12.8921 13.3819 12.8913Z" fill="currentColor" />
    <path d="M10.5553 24.0002C9.20453 23.7976 7.81951 23.7216 6.51123 23.3654C3.76503 22.6167 2.19524 20.7243 1.7445 17.9274C1.57761 16.8926 1.47479 15.8473 1.35559 14.8057C1.28332 14.1762 1.58357 13.7634 2.13191 13.6956C2.67653 13.6286 3.07587 13.9817 3.13622 14.5278C3.26586 15.708 3.35601 16.8978 3.57877 18.0615C3.98109 20.1633 5.70212 21.6288 7.83664 21.8165C8.84617 21.9052 9.8542 22.0177 10.8607 22.1339C11.5953 22.2188 11.9343 23.0347 11.4948 23.6314C11.3048 23.89 11.0805 23.9637 10.5553 24.0002Z" fill="currentColor" />
    <path d="M25.4463 9.39819C25.4307 9.53528 25.4321 9.67758 25.3949 9.8087C25.3077 10.1186 25.0015 10.3779 24.7422 10.3831C24.3004 10.3921 23.7998 10.0643 23.6977 9.65001C23.6247 9.35572 23.6225 9.0443 23.5822 8.74107C23.4571 7.78444 23.3967 6.81366 23.1881 5.87566C22.7604 3.95571 21.5326 2.73758 19.6142 2.32259C18.4743 2.07599 17.2971 1.99999 16.1363 1.84726C16.0075 1.83013 15.8756 1.82417 15.7504 1.79213C15.331 1.68559 15.0583 1.287 15.1112 0.870521C15.17 0.407854 15.5269 0.0539627 15.9732 0.0859992C17.5042 0.195519 19.0427 0.30653 20.5119 0.776646C22.8633 1.52988 24.3451 3.15778 24.9054 5.53965C25.2012 6.79876 25.3018 8.10332 25.4903 9.38701C25.4761 9.39148 25.4612 9.39446 25.4463 9.39819Z" fill="currentColor" />
    <path d="M25.4224 14.8807C25.2988 16.1673 25.2086 17.5807 24.8167 18.9441C24.0777 21.5145 21.8962 23.2891 19.2372 23.5491C18.1554 23.6549 17.0781 23.8106 15.9992 23.944C15.617 23.9917 15.2013 23.6229 15.1208 23.1647C15.0404 22.7058 15.3287 22.255 15.7832 22.1939C16.3263 22.1202 16.8776 22.106 17.4208 22.033C18.3223 21.913 19.2565 21.8803 20.1133 21.6083C21.97 21.0197 23.007 19.6638 23.279 17.7453C23.4235 16.7254 23.5308 15.7002 23.6336 14.675C23.6932 14.082 24.0799 13.6685 24.6007 13.6983C25.1043 13.7273 25.4515 14.1744 25.4224 14.8807Z" fill="currentColor" />
    <path d="M1.3295 9.27513C1.52768 7.95493 1.62081 6.60791 1.9449 5.319C2.60053 2.71063 4.34912 1.11849 6.95898 0.532893C8.1339 0.269151 9.34756 0.177512 10.5448 0.0173291C10.7266 -0.00725703 10.9226 -0.0087471 11.0984 0.0329749C11.5119 0.130574 11.7548 0.509797 11.7153 0.940427C11.6736 1.39117 11.3681 1.69068 10.9285 1.73985C9.84748 1.86055 8.7642 1.97081 7.68688 2.1228C5.4108 2.44316 3.83356 4.02338 3.52363 6.28456C3.37536 7.36933 3.2569 8.45857 3.1295 9.54632C3.07809 9.98441 2.70185 10.3122 2.24217 10.3063C1.79589 10.3003 1.41518 9.94492 1.39059 9.50833C1.38612 9.43457 1.38985 9.36007 1.38985 9.28556C1.36973 9.28184 1.34961 9.27886 1.3295 9.27513Z" fill="currentColor" />
  </svg>
)
import './HomePage.css'

type SearchParams = {
  page?: number
  search?: string
  category?: string
  sort?: string
  minPrice?: number
  maxPrice?: number
  network?: 'Ethereum' | 'Polygon' | 'Solana'
}

const FIGMA_ASSETS = 'https://www.figma.com/api/mcp/asset/9b7776f8-cb05-4953-91c7-941669d081c3'
const art = {
  hero: `${FIGMA_ASSETS}/8f387.png`,
  sage: `${FIGMA_ASSETS}/83794.png`,
  ape: `${FIGMA_ASSETS}/9add2.png`,
  gold: `${FIGMA_ASSETS}/b7cfc.png`,
}


const categoryValues: Record<string, string> = {
  'Arte digital': 'art',
  Fotografia: 'photography',
  Música: 'music',
  'Arte 3D': '3d-art',
  Colecionáveis: 'collectibles',
  Generativa: 'generative',
  Jogos: 'gaming',
  Assinaturas: 'subscriptions',
  Utilidade: 'utility',
}

const stories = [
  { date: '12 de setembro  |  Leitura de 6 min', title: 'Como funciona a propriedade de NFTs', body: 'Aprenda a colecionar, negociar e verificar ativos digitais.', image: art.ape },
  { date: '13 de setembro  |  Leitura de 2 min', title: '10 artistas digitais para acompanhar', body: 'Conheça criadores que moldam a cultura digital.', image: art.hero },
  { date: '15 de setembro  |  Leitura de 3 min', title: 'Raridade, atributos e procedência', body: 'Entenda raridade, procedência, direitos autorais e utilidade.', image: art.sage },
  { date: '15 de setembro  |  Leitura de 2 min', title: 'Como proteger sua carteira', body: 'Proteja sua carteira, seus ativos e sua identidade.', image: art.gold },
]

export function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const navigate = useNavigate({ from: '/' })
  const { data, isLoading, isError } = useNFTs(searchParams)
  const visibleProducts = data?.data ?? []
  
  const categoryCounts: Record<string, number> = data?.meta?.categoryCounts ?? {}
  const networkCounts: Record<string, number> = data?.meta?.networkCounts ?? {}

  const dynamicCategories = Object.entries(categoryValues)
    .map(([displayName, internalValue]) => [displayName, categoryCounts[internalValue] || 0] as const)
    .filter(([_, count]) => count > 0)

  const dynamicNetworks = Object.entries(networkCounts).map(([network, count]) => [network, count] as const)
  // Use Favorites
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await apiClient.get('/session')).data,
    retry: false,
  })
  const isAuthenticated = !!(session as any)?.user
  const { data: favoritesData } = useFavorites()
  const { mutate: toggleFav } = useToggleFavorite()
  
  const [minPrice, setMinPrice] = useState(searchParams.minPrice ?? 0.02)
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice ?? 12.3)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && filtersOpen) setFiltersOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [filtersOpen]);

  useEffect(() => {
    const openFilters = () => setFiltersOpen(true)
    window.addEventListener('catalog:open-filters', openFilters)
    return () => window.removeEventListener('catalog:open-filters', openFilters)
  }, [])

  useEffect(() => {
    setMinPrice(searchParams.minPrice ?? 0.02)
    setMaxPrice(searchParams.maxPrice ?? 12.3)
  }, [searchParams.minPrice, searchParams.maxPrice])

  const updateSearch = (next: Partial<SearchParams>) => {
    navigate({ search: { ...searchParams, ...next } })
  }

  const selectCategory = (category: string) => {
    const value = categoryValues[category]
    if (!value) return
    updateSearch({ category: value === searchParams.category ? undefined : value, page: 1 })
  }

  const selectNetwork = (network: NonNullable<SearchParams['network']>) => {
    updateSearch({ network: searchParams.network === network ? undefined : network, page: 1 })
  }

  const setSort = (sort: string) => updateSearch({ sort, page: 1 })
  const applyFilters = () => {
    updateSearch({ minPrice, maxPrice, page: 1 })
    setFiltersOpen(false)
  }

  if (isError) {
    return (
      <div className="marketplace-screen">
        <div className="empty-catalog">Não foi possível carregar os NFTs</div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Bem-vindo à Kurio</p>
          <h1>SEJA DONO DA<br />CULTURA DIGITAL</h1>
          <p className="hero-description">Descubra NFTs selecionados<br className="mobile-only" /> de criadores do mundo<br className="mobile-only" /> todo.</p>
          <a className="button-primary hero-cta" href="#catalogo">EXPLORAR <ArrowRight size={14} className="mobile-only" style={{ marginLeft: 6 }} /></a>
          <div className="hero-dots mobile-only" role="group" aria-label="Slide 1 de 3"><span className="active" /><span /><span /></div>
        </div>
        <div className="hero-images">
          <img className="hero-art" src={art.hero} alt="Macaco colecionável" fetchPriority="high" />
          <img className="hero-art-small mobile-only" src={art.sage} alt="Macaco secundário" fetchPriority="high" />
        </div>
      </section>

      <section className="marketplace" id="catalogo" aria-label="Catálogo de NFTs">
        <aside className={`market-sidebar ${filtersOpen ? 'mobile-filter-open' : ''}`} onClick={(event) => {
          if (event.target === event.currentTarget) setFiltersOpen(false)
        }}>
          <button className="mobile-filter-close" onClick={() => setFiltersOpen(false)} aria-label="Fechar filtros"><X size={20} /></button>
          <div className="filter-panel">
            <h2>Coleções</h2>
            <div className="filter-list">
              {dynamicCategories.map(([category, count]) => (
                <button key={category} className={`filter-option ${searchParams.category === categoryValues[category] ? 'selected' : ''}`} onClick={() => selectCategory(category)} aria-pressed={searchParams.category === categoryValues[category]}>
                  <span>{category}</span><span>({count})</span>
                </button>
              ))}
            </div>
            <div className="filter-group">
              <h2>Faixa de preço</h2>
              <div className="price-range-control">
                <div className="price-range-track" />
                <input type="range" min="0.02" max="12.3" step="0.01" value={minPrice} onChange={(event) => setMinPrice(Math.min(Number(event.target.value), maxPrice))} aria-label="Preço mínimo" />
                <input type="range" min="0.02" max="12.3" step="0.01" value={maxPrice} onChange={(event) => setMaxPrice(Math.max(Number(event.target.value), minPrice))} aria-label="Preço máximo" />
              </div>
              <p>Preço: {minPrice.toFixed(2).replace('.', ',')} - {maxPrice.toFixed(2).replace('.', ',')} ETH</p>
              <Button className="filter-apply" onClick={applyFilters}>Aplicar</Button>
            </div>
            <div className="filter-group network-filter">
              <h2>Rede</h2>
              {dynamicNetworks.map(([network, count]) => (
                <button key={network} type="button" className={`filter-option ${searchParams.network === network ? 'selected' : ''}`} onClick={() => selectNetwork(network as NonNullable<SearchParams['network']>)} aria-pressed={searchParams.network === network}><span>{network}</span><span>({count})</span></button>
              ))}
            </div>
          </div>
          <div className="featured-nft">
            <p className="featured-title">NFT EM DESTAQUE</p>
            <p className="featured-subtitle">OFERTA LIMITADA</p>
            <img src={art.sage} alt="NFT em destaque, macaco usando gorro" />
          </div>
        </aside>

        <div className="product-area">
          <div className="catalog-toolbar">
            <div className="catalog-tabs" role="tablist" aria-label="Ordenar coleções">
              <button role="tab" aria-selected={(!searchParams.sort || searchParams.sort === 'newest')} className={(!searchParams.sort || searchParams.sort === 'newest') ? 'active' : ''} onClick={() => setSort('newest')}>Todos os NFTs</button>
              <button role="tab" aria-selected={searchParams.sort === 'recent'} className={searchParams.sort === 'recent' ? 'active' : ''} onClick={() => setSort('recent')}>Novos lançamentos</button>
              <button role="tab" aria-selected={searchParams.sort === 'popular'} className={searchParams.sort === 'popular' ? 'active' : ''} onClick={() => setSort('popular')}>Em alta</button>
            </div>
            <label className="sort-control"><span>Ordenar por:</span><select value={searchParams.sort || 'newest'} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar NFTs">
              <option value="newest">Listados recentemente</option><option value="price_asc">Menor preço</option><option value="price_desc">Maior preço</option>
            </select><ChevronDown size={16} /></label>
          </div>
          <div className="nft-grid" aria-live="polite">
            {isLoading ? Array.from({ length: 9 }, (_, i) => <div className="nft-skeleton" key={i} />) : visibleProducts.length ? visibleProducts.map((item: { id: string; image: string; title: string; price: string }) => {
              const isFav = isAuthenticated && Array.isArray(favoritesData) && favoritesData.includes(item.id);
              return (
                <Link className="nft-card" key={item.id} to="/nft/$id" params={{ id: item.id }}>
                  <div className="nft-image">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <button 
                      className={`nft-grid-favorite ${isFav ? 'is-favorite' : ''}`} 
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isAuthenticated) return navigate({ to: '/login' });
                        toggleFav({ nftId: item.id, isFavorite: isFav });
                      }} 
                      aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      aria-pressed={isFav}
                    >
                      <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                    {item.title.includes('Raro') && <span className="nft-rarity-badge">RARO</span>}
                  </div>
                  <span className="nft-name">{item.title}</span>
                  <div className="nft-price"><strong>{item.price} ETH</strong></div>
                </Link>
              );
            }) : <div className="empty-catalog">Nenhum NFT encontrado com esses filtros.</div>}
          </div>
          <nav className="pagination" aria-label="Paginação do catálogo">
            {[1, 2, 3, 4].map((page) => <button key={page} className={(searchParams.page ?? 1) === page ? 'current' : ''} aria-current={(searchParams.page ?? 1) === page ? 'page' : undefined} onClick={() => updateSearch({ page })}>{page}</button>)}
            <button aria-label="Próxima página" onClick={() => updateSearch({ page: (searchParams.page ?? 1) + 1 })}><ChevronRight size={17} /></button>
          </nav>
        </div>
      </section>

      <section className="promo-grid" aria-label="Coleções em destaque">
        <article className="promo-card promo-genesis">
          <img src={art.hero} alt="Arte da coleção Genesis" loading="lazy" />
          <div><h2>Lançamentos gênesis<br />de edição limitada</h2><p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p><a className="button-primary" href="#catalogo">Explorar <ArrowRight size={16} /></a></div>
        </article>
        <article className="promo-card promo-curated">
          <img src={art.ape} alt="Arte digital selecionada" loading="lazy" />
          <div><h2>Arte digital selecionada<br />e muito mais</h2><p>Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p><a className="button-primary" href="#catalogo">Explorar <ArrowRight size={16} /></a></div>
        </article>
      </section>

      <section className="journal" id="diario">
        <header className="section-heading"><h2>Diário da Cunhagem</h2><p>Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p></header>
        <div className="story-grid">{stories.map((story) => <article className="story-card" key={story.title}>
          <img src={story.image} alt="" loading="lazy" />
          <div className="story-content"><p className="story-date">{story.date}</p><h3>{story.title}</h3><p className="story-summary">{story.body}</p><a href="#catalogo">Ler mais <ArrowRight size={13} /></a></div>
        </article>)}</div>
      </section>
    </div>
  )
}

export function MarketplaceHeader() {
  const navigate = useNavigate({ from: '/' })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { cart } = useCart()
  const { logout } = useAuth()
  const { data: session, isPending: isSessionPending } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await apiClient.get('/session')).data,
    retry: false,
  })
  const cartCount = cart?.items?.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0) ?? 0
  const marketIsActive = /^\/(nft|checkout|payment|order)/.test(pathname)
  const isAuthPage = pathname === '/login' || pathname === '/register'

  return (
    <>
      <header className={`market-header desktop-only ${isAuthPage ? 'hide-on-auth' : ''}`}>
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Kurio Início">KURIO</Link>
          <nav className="main-nav" aria-label="Navegação principal"><Link className={!marketIsActive ? 'active' : ''} to="/" aria-label="Início">Início</Link><a className={marketIsActive ? 'active' : ''} href="/#catalogo">Mercado</a><a href="/#destaques">Criadores</a><a href="/#diario">Aprenda</a></nav>
          <div className="header-actions"><button className="icon-button" aria-label="Buscar NFTs" onClick={() => document.getElementById('catalog-search')?.focus()}><Search size={20} /></button><Link className="cart-link" to="/checkout" aria-label={cartCount > 0 ? `Carrinho, ${cartCount} itens` : 'Carrinho vazio'}><ShoppingCart size={22} />{cartCount > 0 && <span className="cart-count" aria-live="polite">{cartCount > 99 ? '99+' : cartCount}</span>}</Link>{session?.user ? <><Link to="/profile" aria-label="Meu perfil"><User size={20} /></Link><button type="button" className="login-button" onClick={() => logout(undefined, { onSuccess: () => navigate({ to: '/', search: { page: 1 } }) })}><LogOut size={17} aria-hidden="true" /> Sair</button></> : <Link className="login-button" to="/login" aria-disabled={isSessionPending}><LogIn size={17} aria-hidden="true" /> Entrar</Link>}</div>
          <input id="catalog-search" className="header-search" aria-label="Buscar NFTs" placeholder="Buscar no marketplace" onKeyDown={(event) => {
            if (event.key === 'Enter') {
              navigate({ search: { search: event.currentTarget.value, page: 1 } })
              event.currentTarget.blur()
            }
          }} />
        </div>
        <div className="header-rule" />
      </header>

      {!isAuthPage && (
        <>
          <header className="market-header mobile-only">
            {pathname === '/' && (
              <div className="mobile-home-header">
                <div className="mobile-search-bar">
                  <Search size={16} />
                  <input placeholder="Explorar coleções" onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate({ search: { search: e.currentTarget.value, page: 1 } })
                  }} />
                </div>
                <button className="mobile-filter-btn" aria-label="Abrir filtros" onClick={() => window.dispatchEvent(new Event('catalog:open-filters'))}><Settings2 size={16} /></button>
              </div>
            )}
            {pathname.startsWith('/nft/') && (
              <div className="mobile-back-header mobile-back-header-transparent">
                <button onClick={() => history.back()} className="mobile-icon-btn" aria-label="Voltar"><ChevronLeft size={20} /></button>
                <button className="mobile-icon-btn" aria-label="Acessar Favoritos"><Heart size={18} /></button>
              </div>
            )}
            {pathname === '/checkout' && (
              <div className="mobile-back-header">
                <button onClick={() => history.back()} className="mobile-icon-btn" aria-label="Voltar"><ChevronLeft size={20} /></button>
                <h2>Carrinho de NFTs</h2>
              </div>
            )}
            {pathname === '/payment' && (
              <div className="mobile-back-header">
                <button onClick={() => history.back()} className="mobile-icon-btn" aria-label="Voltar"><ChevronLeft size={20} /></button>
                <h2>Pagamento com carteira</h2>
              </div>
            )}
          </header>

          <nav className="mobile-tab-bar mobile-only">
            <svg className="tab-bar-bg" viewBox="0 0 1000 64" preserveAspectRatio="xMidYMin slice" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
              <path d="M0,0 L450,0 A16,16 0 0 1 466,16 A34,34 0 0 0 534,16 A16,16 0 0 1 550,0 L1000,0 L1000,64 L0,64 Z" fill="#241612" />
            </svg>
            <Link to="/" activeProps={{ className: 'active' }}><Home size={22} fill="currentColor" /></Link>
            <button type="button" aria-label="Favoritos"><Heart size={22} /></button>
            <button type="button" className="tab-scan-btn" aria-label="Escanear"><CustomScanIcon size={30} /></button>
            <Link to="/checkout" className="tab-cart-link" activeProps={{ className: 'active' }} aria-label="Carrinho">
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className="tab-cart-badge">{cartCount}</span>}
            </Link>
            <Link to="/profile" activeProps={{ className: 'active' }}><User size={22} /></Link>
          </nav>
        </>
      )}
    </>
  )
}

export function MarketplaceFooter() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (pathname === '/login' || pathname === '/register') return null

  const features = [
    ['W', 'Segurança da carteira', 'Proteja sua carteira e colecione arte digital verificada com confiança.'],
    ['C', 'Criadores em destaque', 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.'],
    ['D', 'Alertas de lançamentos', 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.'],
  ]
  const linkGroups = [
    ['Meu perfil', 'Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
    ['Central de ajuda', 'Central de ajuda', 'Guia de compra', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'],
    ['Coleções', 'Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  ]
  return <footer className="market-footer" id="destaques">
    <div className="footer-benefits">{features.map(([initial, title, text]) => <article className="benefit" key={title}><span>{initial}</span><h3>{title}</h3><p>{text}</p></article>)}<form className="newsletter" onSubmit={(event) => event.preventDefault()}><h3>Antecipe-se ao próximo lançamento</h3><div><input type="email" placeholder="digite seu e-mail..." aria-label="Seu e-mail" /><button>Enviar</button></div><p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p></form></div>
    <div className="footer-brand-band"><strong>KURIO</strong><span>Feito para colecionadores,<br />criadores e cultura</span><a href="mailto:contato@email.com">contato@email.com</a><span>+55 11 4002 8922</span></div>
    <div className="footer-links">{linkGroups.map(([title, ...links]) => <section key={title}><h3>{title}</h3>{links.map((label) => <a key={label} href={label === 'Meu perfil' ? '/profile' : '#catalogo'}>{label}</a>)}</section>)}<section className="social-links"><h3>Redes sociais</h3><div><a href="#catalogo" aria-label="Rede Social Instagram">◎</a><a href="#catalogo" aria-label="Rede Social X">𝕏</a><a href="#catalogo" aria-label="Rede Social Discord">◉</a><a href="#catalogo" aria-label="Rede Social YouTube">▶</a></div><h3>Carteiras compatíveis</h3><small>METAMASK · WALLETCONNECT · COINBASE</small></section></div>
    <div className="copyright">© 2024 Kurio. Fique atualizado para toda arte.</div>
  </footer>
}
