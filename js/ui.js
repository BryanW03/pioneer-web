// ============================================================
// PIONEER PORTAL — UI UTILITIES
// ============================================================

// ── Toast notifications ──────────────────────────────────
function toast(msg, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div')
    el.id = 'toast-container'
    document.body.appendChild(el)
    return el
  })()

  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.innerHTML = `<span>${icons[type] || '•'}</span><span>${msg}</span>`
  container.appendChild(el)

  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.3s'
    setTimeout(() => el.remove(), 300)
  }, duration)
}

// ── Modal ────────────────────────────────────────────────
function openModal(html) {
  closeModal()
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'active-modal'
  overlay.innerHTML = html
  document.body.appendChild(overlay)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal()
  })
}

function closeModal() {
  const m = document.getElementById('active-modal')
  if (m) m.remove()
}

// ── Page loader ──────────────────────────────────────────
function showLoader(msg = 'Cargando...') {
  let loader = document.getElementById('page-loader')
  if (!loader) {
    loader = document.createElement('div')
    loader.id = 'page-loader'
    loader.className = 'page-loader'
    loader.innerHTML = `
      <div style="text-align:center">
        ${pioneerMark('white', 64)}
        <p>${msg}</p>
      </div>`
    document.body.appendChild(loader)
  }
}

function hideLoader() {
  const l = document.getElementById('page-loader')
  if (l) l.remove()
}

// ── Pioneer isotipo SVG (inline) ─────────────────────────
function pioneerMark(color = 'white', size = 32) {
  const lines = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24
    const rad = angle * Math.PI / 180
    const innerR = 12, outerR = 42 + (i % 3) * 8
    const x1 = 60 + innerR * Math.cos(rad), y1 = 60 + innerR * Math.sin(rad)
    const x2 = 60 + outerR * Math.cos(rad), y2 = 60 + outerR * Math.sin(rad)
    const w = Math.max(0.8, 2.5 - i * 0.05)
    const op = 0.7 + (i % 4) * 0.075
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`
  }).join('')
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">${lines}<circle cx="60" cy="60" r="8" fill="${color}" opacity="0.9"/></svg>`
}

// ── Sidebar render ───────────────────────────────────────
function renderSidebar(activePage, user) {
  if (!user) return

  const isAdmin = user.role === 'admin'
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const navItems = [
    { href: 'dashboard.html',           icon: iconDashboard(), label: 'Dashboard',        admin: false },
    { href: 'terceros-nuevo.html',       icon: iconFile(),      label: 'Crear Tercero',    admin: false },
    { href: 'terceros-historial.html',   icon: iconHistory(),   label: 'Historial Terceros', admin: false },
    { href: 'admin.html',                icon: iconShield(),    label: 'Administración',   admin: true  },
    { href: 'usuarios.html',             icon: iconUsers(),     label: 'Gestión Usuarios', admin: true  },
  ]

  const navHTML = navItems
    .filter(item => !item.admin || isAdmin)
    .map(item => `
      <a href="${item.href}" class="nav-item ${activePage === item.href ? 'active' : ''}">
        ${item.icon}
        <span class="nav-label">${item.label}</span>
        ${item.admin ? '<span class="nav-badge">ADMIN</span>' : ''}
      </a>`).join('')

  const sidebar = document.getElementById('sidebar')
  if (!sidebar) return

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-mark">${pioneerMark('white', 22)}</div>
      <div class="logo-text">
        <p>Pioneer</p>
        <span>Investment Funds</span>
      </div>
    </div>
    <nav class="sidebar-nav">${navHTML}</nav>
    <div class="sidebar-user">
      <div class="user-card">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <p class="truncate" style="max-width:120px">${user.name}</p>
          <span class="truncate" style="max-width:120px">${user.email}</span>
        </div>
        ${isAdmin ? '<span class="user-role-badge">ADMIN</span>' : ''}
      </div>
      <button class="logout-btn" onclick="window.Auth.logout()">
        ${iconLogout()} <span class="nav-label">Cerrar sesión</span>
      </button>
    </div>`
}

// ── SVG Icons ────────────────────────────────────────────
const iconDashboard = () => `<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`
const iconFile     = () => `<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
const iconHistory  = () => `<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
const iconShield   = () => `<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
const iconUsers    = () => `<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
const iconLogout   = () => `<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
const iconPlus     = () => `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
const iconSearch   = () => `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
const iconEdit     = () => `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
const iconPower    = () => `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`

// ── Format date ──────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-DO', { day:'2-digit', month:'2-digit', year:'numeric' })
}

function fmtDateFull(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-DO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `hace ${days}d`
  return fmtDate(iso)
}

// ── Mobile sidebar toggle ────────────────────────────────
function initMobileSidebar() {
  const sidebar = document.getElementById('sidebar')
  const toggle  = document.getElementById('mobile-menu-btn')
  if (!toggle || !sidebar) return
  toggle.addEventListener('click', () => sidebar.classList.toggle('open'))
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open')
    }
  })
}
