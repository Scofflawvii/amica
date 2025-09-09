// Dev helper to unregister any existing service workers to avoid stale caches
// and 404s for workbox files while iterating in development.
(() => {
  if (typeof window === 'undefined') return;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!('serviceWorker' in navigator) || !isDev) return;
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister().catch(() => {}));
  }).catch(() => {});
})();
