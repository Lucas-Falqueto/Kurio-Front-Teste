export async function enableMocking() {
  const { worker } = await import('./browser')
  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}

export const mswReadyPromise = enableMocking()
