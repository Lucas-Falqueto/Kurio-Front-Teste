import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, logout } from '../api/authApi'

export function useAuth() {
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      window.localStorage.setItem('kurio_session', data.user.id)
      queryClient.setQueryData(['session'], { user: data.user })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      window.localStorage.removeItem('kurio_session')
      queryClient.setQueryData(['session'], null)
      queryClient.removeQueries({ queryKey: ['cart'] })
    },
  })

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  }
}
