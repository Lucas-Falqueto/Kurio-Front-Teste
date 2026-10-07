import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { UserRound, MapPin, Activity, Heart, ShoppingCart, Download, AlertTriangle, LogOut } from 'lucide-react'

export const Route = createFileRoute('/profile')({
  component: ProfileLayout,
})

function ProfileLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await apiClient.get('/session')
      return res.data
    },
    retry: false
  })

  // Basic auth guard
  if (!isLoading && !session?.user) {
    navigate({ to: '/login', replace: true })
    return null
  }

  if (isLoading) return <div className="marketplace-screen"><div className="screen-skeleton" /></div>

  return (
    <div className="marketplace-screen profile-page">
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <h3 className="profile-sidebar-title">Meu perfil</h3>
          
          <nav className="profile-nav" aria-label="Navegação do perfil">
            <Link to="/profile" activeProps={{ className: 'active' }} activeOptions={{ exact: true }}>
              <UserRound size={16} /> Dados do perfil
            </Link>
            <Link to="/profile/wallets" activeProps={{ className: 'active' }}>
              <MapPin size={16} /> Carteiras
            </Link>
            <button type="button" className="profile-nav-item disabled" disabled aria-disabled="true">
              <ShoppingCart size={16} /> Segurança
            </button>
            <button type="button" className="profile-nav-item disabled" disabled aria-disabled="true">
              <Heart size={16} /> Lista de interesse
            </button>
            <button type="button" className="profile-nav-item disabled" disabled aria-disabled="true">
              <Activity size={16} /> Ofertas
            </button>
            <button type="button" className="profile-nav-item disabled" disabled aria-disabled="true">
              <Download size={16} /> Arquivos baixados
            </button>
            <button type="button" className="profile-nav-item disabled" disabled aria-disabled="true">
              <AlertTriangle size={16} /> Suporte
            </button>
          </nav>
          
          <div className="profile-sidebar-footer">
            <button className="profile-logout" onClick={() => {
              logout(undefined, { onSuccess: () => navigate({ to: '/', search: { page: 1 } }) })
            }}>
              <LogOut size={16} /> Sair
            </button>
          </div>
        </aside>
        
        <main className="profile-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
