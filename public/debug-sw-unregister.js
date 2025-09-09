// Dev helper to unregister any existing service workers to avoid stale caches
// and 404s for workbox files while iterating in development.
(() => {
  if (typeof window === 'undefined') return;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return;
  if (!('serviceWorker' in navigator)) return;
  
  // Unregister all existing service workers
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      reg.unregister().catch(() => {});
    });
    if (regs.length > 0) {
      console.log(`[DEV] Unregistered ${regs.length} service worker(s)`);
    }
  }).catch(() => {});
  
  // Clear all caches that might contain stale workbox files
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach(name => {
        caches.delete(name).catch(() => {});
      });
      if (names.length > 0) {
        console.log(`[DEV] Cleared ${names.length} cache(s)`);
      }
    }).catch(() => {});
  }
  
  // Intercept fetch requests to workbox files to prevent 404 noise in dev
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && (url.includes('workbox-') || url.includes('dynamic-css-manifest'))) {
      // Return empty successful response for development workbox files
      return Promise.resolve(new Response('/* dev stub */', { 
        status: 200,
        headers: { 'Content-Type': 'application/javascript' }
      }));
    }
    return originalFetch.apply(this, args);
  };
})();
