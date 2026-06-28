
const CONFIG = {
  // ── MICROSOFT AZURE AD ──────────────────────────────────
  // Regístrate en portal.azure.com → Azure AD → App Registrations
  azure: {
    clientId:   '89168332-046a-4427-ab3c-bb8d5dabd08d',       // Application (client) ID
    tenantId:   'd3d1dad0-4d49-42d1-b122-2636911e1846',        // Directory (tenant) ID
    redirectUri: https://pioneer-web-h5t3.onrender.com + '/index.html', // Ajusta si es diferente
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
