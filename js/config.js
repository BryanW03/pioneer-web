// ============================================================
// PIONEER PORTAL — CONFIGURACIÓN CENTRAL
// ============================================================
// Edita este archivo con tus credenciales reales

const CONFIG = {
  // ── MICROSOFT AZURE AD ──────────────────────────────────
  // Regístrate en portal.azure.com → Azure AD → App Registrations
  azure: {
    clientId:   'PASTE_YOUR_AZURE_CLIENT_ID',       // Application (client) ID
    tenantId:   'PASTE_YOUR_AZURE_TENANT_ID',        // Directory (tenant) ID
    redirectUri: window.location.origin + '/index.html', // Ajusta si es diferente
  },

  // ── SUPABASE ────────────────────────────────────────────
  supabase: {
    url:    'https://yhicemjhtehdcuerkqjm.supabase.co',
    anonKey: 'PASTE_YOUR_SUPABASE_ANON_KEY',  // Settings → API → anon public
  },

  // ── ADMIN ───────────────────────────────────────────────
  adminEmail: 'b.deleon@pioneerfunds.do',
  domain:     'pioneerfunds.do',   // Solo este dominio puede entrar

  // ── APP ─────────────────────────────────────────────────
  appName: 'Pioneer Investment Funds',
  version: '1.0.0',
}

// No editar debajo de esta línea
window.PIONEER_CONFIG = CONFIG
