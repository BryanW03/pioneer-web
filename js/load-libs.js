// ============================================================
// PIONEER PORTAL — CARGADOR DE LIBRERÍAS CON FALLBACK
// Intenta cargar local primero, si falla usa CDN automáticamente
// ============================================================

function loadScript(src, fallbackSrc) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve(src)
    script.onerror = () => {
      console.warn('[Loader] Falló cargar:', src, '— intentando fallback...')
      if (fallbackSrc) {
        const fallback = document.createElement('script')
        fallback.src = fallbackSrc
        fallback.onload = () => resolve(fallbackSrc)
        fallback.onerror = () => reject(new Error('No se pudo cargar ni local ni CDN: ' + src))
        document.head.appendChild(fallback)
      } else {
        reject(new Error('No se pudo cargar: ' + src))
      }
    }
    document.head.appendChild(script)
  })
}

// Detect base path (root vs pages/)
const isInPages = window.location.pathname.includes('/pages/')
const basePath = isInPages ? '../' : ''

window.PIONEER_LIBS_READY = Promise.all([
  loadScript(
    basePath + 'js/vendor/msal-browser.min.js',
    'https://cdn.jsdelivr.net/npm/@azure/msal-browser@3.11.1/lib/msal-browser.min.js'
  ),
  loadScript(
    basePath + 'js/vendor/supabase.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
  ),
]).then(() => {
  console.log('[Loader] Librerías cargadas correctamente')
  return true
}).catch((err) => {
  console.error('[Loader] Error crítico cargando librerías:', err)
  return false
})
