import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const sessionId = typeof window === 'undefined' ? null : window.localStorage.getItem('kurio_session')
  if (sessionId) config.headers.set('X-Session-Id', sessionId)
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !error.config.url?.includes('/session') && !error.config.url?.includes('/auth/login') && !error.config.url?.includes('/favorites')) {
        const currentPath = window.location.pathname + window.location.search
        if (!currentPath.includes('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
        }
      }
    }
    return Promise.reject(error);
  }
);
