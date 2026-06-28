# 🏢 Pioneer Investment Funds — Portal Web

Página web estática con HTML + CSS + JavaScript puro.
Sin Node.js, sin build, sin frameworks. Funciona en cualquier hosting estático.

---

## ⚡ SETUP EN 4 PASOS

### PASO 1 — Configurar Supabase (base de datos)

1. Ve a **https://supabase.com** → tu proyecto `yhicemjhtehdcuerkqjm`
2. Click en **SQL Editor** → **New Query**
3. Pega y ejecuta el contenido de `supabase-setup.sql`
4. Ve a **Settings** → **API** → copia el **anon public key**

---

### PASO 2 — Registrar app en Azure AD (Microsoft login)

1. Ve a **https://portal.azure.com**
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Configura:
   - Name: `Pioneer Portal`
   - Supported account types: `Single tenant`
   - Redirect URI: **Single-page application (SPA)** → `https://pioneer-portal.onrender.com/index.html`
4. Click **Register**
5. Copia:
   - **Application (client) ID** → `AZURE_AD_CLIENT_ID`
   - **Directory (tenant) ID**   → `AZURE_AD_TENANT_ID`
6. Ve a **Authentication** → asegúrate que el Redirect URI sea tipo **SPA** (no Web)
7. En **API permissions** → Add → Microsoft Graph → Delegated:
   `openid`, `profile`, `email`, `User.Read` → **Grant admin consent**

---

### PASO 3 — Editar config.js

Abre `js/config.js` y completa:

```javascript
azure: {
  clientId:    'TU_CLIENT_ID_DE_AZURE',
  tenantId:    'TU_TENANT_ID_DE_AZURE',
  redirectUri: 'https://pioneer-portal.onrender.com/index.html',
},
supabase: {
  url:     'https://yhicemjhtehdcuerkqjm.supabase.co',
  anonKey: 'TU_ANON_KEY_DE_SUPABASE',
},
```

---

### PASO 4 — Deploy en Render (Static Site)

1. Sube la carpeta `pioneer-web` a GitHub
2. Render → **New** → **Static Site**
3. Conecta el repositorio
4. Configura:
   - **Build Command:** *(dejar vacío)*
   - **Publish Directory:** `.`  *(punto, raíz del repo)*
5. Click **Create Static Site**
6. Tu portal estará en: `https://pioneer-portal.onrender.com`

---

## 📁 ESTRUCTURA

```
pioneer-web/
├── index.html                  ← Login con slideshow Microsoft
├── css/
│   └── main.css               ← Estilos Pioneer (morado, negro, gris)
├── js/
│   ├── config.js              ← ⚙️ TUS CREDENCIALES VAN AQUÍ
│   ├── auth.js                ← Autenticación Microsoft (MSAL)
│   └── ui.js                  ← Sidebar, toasts, modales, íconos
├── pages/
│   ├── dashboard.html         ← Panel principal con estadísticas
│   ├── terceros-nuevo.html    ← Formulario Crear Tercero (del PDF)
│   ├── terceros-historial.html ← Tabla con búsqueda y paginación
│   ├── admin.html             ← Panel admin + audit log
│   └── usuarios.html          ← CRUD de usuarios con roles
└── supabase-setup.sql         ← Script SQL para crear las tablas
```

---

## 🔒 SEGURIDAD

- Solo `@pioneerfunds.do` puede iniciar sesión con Microsoft
- `b.deleon@pioneerfunds.do` es el super admin (no se puede modificar)
- Usuarios no pre-registrados son rechazados al login
- Todo cambio queda en el audit log
- Sesiones manejadas por MSAL (Microsoft)

---

## 🖼️ AGREGAR FOTOS AL SLIDESHOW

Para usar fotos reales de Pioneer en la pantalla de login:

1. Coloca tus fotos en la carpeta `img/`:
   `slide1.jpg`, `slide2.jpg`, `slide3.jpg`, `slide4.jpg`

2. En `index.html`, busca los 4 divs con clase `slide-bg` y cambia:
```html
<!-- De esto: -->
<div class="slide-bg" style="background: linear-gradient(...)"></div>

<!-- A esto: -->
<div class="slide-bg" style="background-image: url('../img/slide1.jpg');
  background-size: cover; background-position: center"></div>
```

---

## 👤 GESTIÓN DE USUARIOS

Solo el admin puede crear usuarios. El flujo es:
1. Admin va a **Gestión de Usuarios** → **Crear Usuario**
2. Ingresa el correo `@pioneerfunds.do` del empleado
3. La próxima vez que esa persona intente entrar con Microsoft, se le permite acceso

---

**Pioneer Investment Funds © 2025 — IT Department**
