import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { HomePage } from './HomePage'

export const Route = createFileRoute('/register')({
  component: RegisterRoute,
})

function RegisterRoute() {
  const navigate = useNavigate()

  return (
    <div className="auth-scene">
      <div className="auth-background" aria-hidden="true"><HomePage searchParams={{}} /></div>
      <Dialog open onOpenChange={(open) => { if (!open) navigate({ to: '/' }) }}>
        <DialogContent className="auth-dialog-content auth-register-dialog">
          <DialogTitle className="sr-only">Criar conta na Kurio</DialogTitle>
          <DialogDescription className="sr-only">Cadastre-se para colecionar arte digital.</DialogDescription>
          <RegisterForm />
          <p className="auth-switch-link">
            Já possui uma conta?{' '}
            <Link to="/login">Entrar</Link>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
