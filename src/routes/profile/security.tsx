import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/profile/security')({
  component: ProfileSecurityRoute,
})

function ProfileSecurityRoute() {
  return (
    <div className="profile-panel">
      <div className="profile-panel-heading">
        <h1>Segurança</h1>
        <p>Atualize sua senha para manter sua conta protegida.</p>
      </div>
      
      <div className="profile-form-card">
        <div className="profile-field">
          <Label htmlFor="current">Senha atual</Label>
          <Input id="current" type="password" />
        </div>
        <div className="profile-field">
          <Label htmlFor="new">Nova senha</Label>
          <Input id="new" type="password" />
        </div>
        <div className="profile-field">
          <Label htmlFor="confirm">Confirme a nova senha</Label>
          <Input id="confirm" type="password" />
        </div>
        
        <Button>Atualizar senha</Button>
      </div>
    </div>
  )
}
