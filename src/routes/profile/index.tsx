import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EyeOff, Image as ImageIcon, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updateProfile, updatePassword } from '@/api/profileApi'
import { apiClient } from '@/api/client'
import { useState } from 'react'

export const Route = createFileRoute('/profile/')({
  component: ProfileIndexRoute,
})

const profileSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword']
})

function ProfileIndexRoute() {
  const queryClient = useQueryClient()
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await apiClient.get('/session')).data,
    retry: false,
  })
  const sessionUser = (session as any)?.user;
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      name: sessionUser?.name || '',
      email: sessionUser?.email || ''
    }
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], (old: any) => ({ ...old, user: { ...old.user, ...data } }))
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    }
  })

  const updatePasswordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      passwordForm.reset()
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    },
    onError: (error: any) => {
      passwordForm.setError('currentPassword', { type: 'manual', message: error.response?.data?.message || 'Erro ao atualizar senha' })
    }
  })

  if (!sessionUser) return <div className="profile-panel-loading" />

  return (
    <div className="profile-panel">
      <div className="profile-panel-heading">
        <h1>Perfil do colecionador</h1>
      </div>
      
      <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="profile-form-grid">
        <div className="profile-field">
          <label>Nome de exibição<span className="required">*</span></label>
          <div className="profile-input-wrap">
            <input {...profileForm.register('name')} />
          </div>
          {profileForm.formState.errors.name && <span className="profile-error">{profileForm.formState.errors.name.message}</span>}
        </div>
        <div className="profile-field">
          <label>E-mail<span className="required">*</span></label>
          <div className="profile-input-wrap">
            <input {...profileForm.register('email')} />
          </div>
          {profileForm.formState.errors.email && <span className="profile-error">{profileForm.formState.errors.email.message}</span>}
        </div>
        <div className="profile-field">
          <label>Avatar</label>
          <div className="avatar-edit-group">
            <div className="avatar-placeholder" style={sessionUser.avatar ? { backgroundImage: `url(${sessionUser.avatar})`, backgroundSize: 'cover' } : {}}>
              {!sessionUser.avatar && <ImageIcon size={18} />}
            </div>
            <button type="button" className="btn-alterar">Alterar</button>
            <button type="button" className="btn-remover">Remover</button>
          </div>
        </div>
        <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn-salvar" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar perfil'}
          </button>
          {profileSuccess && <span style={{ marginLeft: '1rem', color: 'green', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={16} /> Perfil atualizado!</span>}
        </div>
      </form>

      <div className="profile-panel-heading mt-6">
        <h1>Alterar senha</h1>
      </div>
      
      <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))} className="profile-password-form">
        <div className="profile-field">
          <label>Senha atual</label>
          <div className="profile-input-wrap profile-input-wrap-password">
            <input type="password" {...passwordForm.register('currentPassword')} />
            <button className="auth-password-toggle" type="button" aria-label="Alternar visibilidade da senha"><EyeOff size={16} /></button>
          </div>
          {passwordForm.formState.errors.currentPassword && <span className="profile-error">{passwordForm.formState.errors.currentPassword.message}</span>}
        </div>
        <div className="profile-field">
          <label>Nova senha</label>
          <div className="profile-input-wrap profile-input-wrap-password">
            <input type="password" {...passwordForm.register('newPassword')} />
            <button className="auth-password-toggle" type="button" aria-label="Alternar visibilidade da senha"><EyeOff size={16} /></button>
          </div>
          {passwordForm.formState.errors.newPassword && <span className="profile-error">{passwordForm.formState.errors.newPassword.message}</span>}
        </div>
        <div className="profile-field">
          <label>Confirmar nova senha</label>
          <div className="profile-input-wrap profile-input-wrap-password">
            <input type="password" {...passwordForm.register('confirmPassword')} />
            <button className="auth-password-toggle" type="button" aria-label="Alternar visibilidade da senha"><EyeOff size={16} /></button>
          </div>
          {passwordForm.formState.errors.confirmPassword && <span className="profile-error">{passwordForm.formState.errors.confirmPassword.message}</span>}
        </div>
        <div className="profile-field">
          <button type="submit" className="btn-salvar" disabled={updatePasswordMutation.isPending}>
            {updatePasswordMutation.isPending ? 'Atualizando...' : 'Alterar senha'}
          </button>
          {passwordSuccess && <span style={{ marginLeft: '1rem', color: 'green', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={16} /> Senha alterada!</span>}
        </div>
      </form>
    </div>
  )
}
