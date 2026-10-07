import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.005 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
)

const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export function RegisterForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (credentials: Pick<z.infer<typeof registerSchema>, 'name' | 'email' | 'password'>) => {
      const res = await apiClient.post('/auth/register', credentials);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], { user: data.user });
      navigate({ to: '/' });
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        setError('Email já cadastrado');
      } else {
        setError('Ocorreu um erro ao criar a conta');
      }
    }
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ name: values.name, email: values.email, password: values.password });
  };

  return (
    <div className="auth-form register-mode">
      <div className="auth-form-heading">
        <div className="auth-form-tabs">
          <Link className="auth-tab auth-tab-link" to="/login">Entrar</Link>
          <span className="auth-tab-divider">|</span>
          <span className="auth-tab auth-tab-active">Criar conta</span>
        </div>
        <p>Crie seu perfil de colecionador e conecte uma carteira quando quiser.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form-body">
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: any }) => (
              <FormItem className="auth-field">
                <div className="auth-input-wrap">
                  <FormControl><Input autoComplete="name" placeholder="Nome de usuário" {...field} /></FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: any }) => (
              <FormItem className="auth-field">
                <div className="auth-input-wrap">
                  <FormControl><Input type="email" autoComplete="email" placeholder="Digite seu e-mail" {...field} /></FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }: { field: any }) => (
              <FormItem className="auth-field">
                <div className="auth-input-wrap auth-input-wrap-password">
                  <FormControl><Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Senha" {...field} /></FormControl>
                  <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                    {showPassword ? <EyeOff size={17} /> : <EyeOff size={17} />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }: { field: any }) => (
              <FormItem className="auth-field">
                <div className="auth-input-wrap auth-input-wrap-password">
                  <FormControl><Input type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirmar senha" {...field} /></FormControl>
                  <button className="auth-password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                    {showConfirmPassword ? <EyeOff size={17} /> : <EyeOff size={17} />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <Button type="submit" className="auth-submit-button" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Criando...' : 'Criar perfil'}
          </Button>
        </form>
      </Form>

      <div className="auth-social-divider"><span>Ou continue com</span></div>
      <div className="auth-socials">
        <button type="button" className="auth-social-button auth-social-google" aria-label="Continuar com Google"><span className="social-icon"><GoogleIcon /></span> Continuar com Google</button>
        <button type="button" className="auth-social-button auth-social-facebook" aria-label="Continuar com Facebook"><span className="social-icon"><FacebookIcon /></span> Continuar com Facebook</button>
      </div>
      <div className="auth-mobile-footer mobile-only">
        Já tem uma conta? <Link to="/login">Entre</Link>
      </div>
    </div>
  );
}
