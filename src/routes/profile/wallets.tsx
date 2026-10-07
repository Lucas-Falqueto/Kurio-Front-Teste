import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { fetchWallets, addWallet } from '@/api/profileApi'
import { useState } from 'react'
import type { Wallet } from '@/api/types'

export const Route = createFileRoute('/profile/wallets')({
  component: ProfileWalletsRoute,
})

function ProfileWalletsRoute() {
  const queryClient = useQueryClient()
  const { data: wallets, isLoading } = useQuery<Wallet[]>({ queryKey: ['wallets'], queryFn: fetchWallets })
  const [successMsg, setSuccessMsg] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      address: '',
      label: '',
      type: 'MetaMask',
      isPrimary: true
    }
  })

  const addWalletMutation = useMutation({
    mutationFn: addWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      reset()
      setSuccessMsg('Carteira adicionada com sucesso!')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  })

  if (isLoading) return <div className="profile-panel-loading" />

  const primaryWallet = wallets?.find(w => w.isPrimary) || wallets?.[0]
  const secondaryWallets = wallets?.filter(w => w !== primaryWallet) || []

  return (
    <div className="profile-panel">
      <div className="wallet-header-row">
        <div className="profile-panel-heading">
          <h1>Minhas Carteiras</h1>
          <p>Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        </div>
      </div>
      
      {primaryWallet && (
        <div className="wallet-card" style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', marginBottom: '2rem' }}>
          <h3>Carteira Principal: {primaryWallet.label}</h3>
          <p style={{ opacity: 0.7, fontFamily: 'monospace', marginTop: '0.5rem' }}>{primaryWallet.address}</p>
        </div>
      )}

      {secondaryWallets.map(w => (
        <div key={w.id} className="wallet-card" style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', marginBottom: '1rem', opacity: 0.8 }}>
          <h3>{w.label}</h3>
          <p style={{ opacity: 0.7, fontFamily: 'monospace', marginTop: '0.5rem' }}>{w.address}</p>
        </div>
      ))}

      <div className="profile-panel-heading mt-6">
        <h2>Adicionar Carteira</h2>
      </div>

      <form onSubmit={handleSubmit(data => addWalletMutation.mutate(data))} className="profile-form-grid">
        <div className="profile-field">
          <label>Endereço da carteira<span className="required">*</span></label>
          <div className="profile-input-wrap">
            <input {...register('address', { required: 'Endereço obrigatório' })} placeholder="0x..." />
          </div>
          {errors.address && <span className="profile-error">{errors.address.message as string}</span>}
        </div>
        
        <div className="profile-field">
          <label>Apelido da carteira<span className="required">*</span></label>
          <div className="profile-input-wrap">
            <input {...register('label', { required: 'Apelido obrigatório' })} placeholder="Ex: MetaMask Principal" />
          </div>
          {errors.label && <span className="profile-error">{errors.label.message as string}</span>}
        </div>
        
        <div className="profile-field">
          <label>Tipo de carteira<span className="required">*</span></label>
          <div className="profile-input-wrap dropdown-wrap">
            <select className="profile-select" {...register('type')}>
              <option value="MetaMask">MetaMask</option>
              <option value="WalletConnect">WalletConnect</option>
              <option value="Coinbase Wallet">Coinbase Wallet</option>
            </select>
            <ChevronDown size={14} className="select-icon" />
          </div>
        </div>

        <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn-salvar" disabled={addWalletMutation.isPending}>
            {addWalletMutation.isPending ? 'Adicionando...' : 'Salvar carteira'}
          </button>
          {successMsg && <span style={{ marginLeft: '1rem', color: 'green', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={16} /> {successMsg}</span>}
        </div>
      </form>
    </div>
  )
}
