import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { HomePage } from './HomePage'

export const Route = createFileRoute('/login')({
  component: LoginRoute,
})

function LoginRoute() {
  const navigate = useNavigate()

  return (
    <div className="auth-scene">
      <div className="auth-background" aria-hidden="true"><HomePage searchParams={{}} /></div>
      <Dialog open onOpenChange={(open) => { if (!open) navigate({ to: '/' }) }}>
        <DialogContent className="auth-dialog-content">
          <DialogTitle className="sr-only">Entrar na Kurio</DialogTitle>
          <DialogDescription className="sr-only">Acesse sua conta para continuar no marketplace.</DialogDescription>
          <h1 className="auth-dialog-title">Acesse o marketplace</h1>
          <LoginForm />
          <p className="auth-switch-link">
            Não tem uma conta?{' '}
            <Link to="/register">Cadastre-se</Link>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
