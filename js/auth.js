// ============================================================
// PIONEER PORTAL — AUTENTICACIÓN MICROSOFT (MSAL v3)
// ============================================================

class PioneerAuth {
  constructor() {
    this.msalInstance = null
    this.account = null
    this.supabase = null
    this.currentUser = null
  }

  async init() {
    // Wait for external libraries (msal + supabase) to finish loading
    if (window.PIONEER_LIBS_READY) {
      const ready = await window.PIONEER_LIBS_READY
      if (!ready) {
        throw new Error('No se pudieron cargar las librerías necesarias (MSAL/Supabase). Revisa tu conexión.')
      }
    }

    const cfg = window.PIONEER_CONFIG

    // Init Supabase first
    this.supabase = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey)

    // Init MSAL v3
    this.msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId:    cfg.azure.clientId,
        authority:   'https://login.microsoftonline.com/' + cfg.azure.tenantId,
        redirectUri: cfg.azure.redirectUri,
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: true, // helps with redirect issues
      },
    })

    await this.msalInstance.initialize()

    // CRITICAL: Always call handleRedirectPromise first
    // This processes the auth code that Microsoft sends back
    let redirectResponse = null
    try {
      redirectResponse = await this.msalInstance.handleRedirectPromise()
      console.log('[Auth] handleRedirectPromise result:', redirectResponse ? 'got response' : 'no response')
    } catch (e) {
      console.error('[Auth] handleRedirectPromise error:', e.message)
      // Show the actual error to the user
      window.location.href = cfg.azure.redirectUri + '?error=' + encodeURIComponent(e.message)
      return false
    }

    // If we got a redirect response, process the login
    if (redirectResponse && redirectResponse.account) {
      console.log('[Auth] Processing redirect login for:', redirectResponse.account.username)
      const success = await this._handleLoginSuccess(redirectResponse)
      if (success) {
        window.location.href = 'pages/dashboard.html'
      }
      return success
    }

    // No redirect response — check for existing session
    const accounts = this.msalInstance.getAllAccounts()
    console.log('[Auth] Existing accounts:', accounts.length)

    if (accounts.length > 0) {
      const account = accounts[0]
      const email = account.username.toLowerCase()
      console.log('[Auth] Found existing session for:', email)

      const userData = await this._loadUserFromDB(email)
      if (userData && userData.is_active) {
        this.account = account
        this.currentUser = userData
        console.log('[Auth] Session restored for:', email)
        return true
      }
    }

    console.log('[Auth] No valid session found')
    return false
  }

  async loginWithMicrosoft() {
    try {
      await this.msalInstance.loginRedirect({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
      })
    } catch (e) {
      console.error('[Auth] loginRedirect error:', e)
      throw e
    }
  }

  async _handleLoginSuccess(response) {
    const cfg = window.PIONEER_CONFIG
    const email = response.account.username.toLowerCase()
    const name  = response.account.name || email.split('@')[0]

    console.log('[Auth] Login success for:', email)

    // Validate domain
    if (!email.endsWith('@' + cfg.domain)) {
      console.warn('[Auth] Domain not allowed:', email)
      await this.msalInstance.logoutRedirect({ postLogoutRedirectUri: cfg.azure.redirectUri })
      return false
    }

    this.account = response.account

    // Load user from Supabase
    let user = await this._loadUserFromDB(email)
    console.log('[Auth] User in DB:', user ? 'found' : 'not found')

    if (!user) {
      if (email === cfg.adminEmail) {
        console.log('[Auth] Creating super admin...')
        user = await this._createUser({
          email, name, role: 'admin', is_active: true, department: 'IT'
        })
      } else {
        console.warn('[Auth] User not pre-registered:', email)
        window.location.href = cfg.azure.redirectUri + '?error=not_authorized'
        return false
      }
    }

    if (!user) {
      console.error('[Auth] Failed to create/load user')
      return false
    }

    if (!user.is_active) {
      console.warn('[Auth] Account disabled:', email)
      window.location.href = cfg.azure.redirectUri + '?error=account_disabled'
      return false
    }

    this.currentUser = user

    // Log login event (non-blocking)
    // Non-blocking audit log
    this.supabase.from('audit_logs').insert([{
      user_id: user.id, action: 'LOGIN', entity: 'User', entity_id: user.id,
    }])

    console.log('[Auth] Login complete for:', email, '| role:', user.role)
    return true
  }

  async _loadUserFromDB(email) {
    try {
      const { data, error } = await this.supabase
        .from('users').select('*').eq('email', email).single()
      if (error) {
        if (error.code === 'PGRST116') return null // not found
        console.error('[Auth] DB load error:', error.message)
        return null
      }
      return data
    } catch (e) {
      console.error('[Auth] _loadUserFromDB exception:', e)
      return null
    }
  }

  async _createUser({ email, name, role, is_active, department }) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert([{ email, name, role, is_active, department, created_by: email }])
        .select().single()
      if (error) { console.error('[Auth] Create user error:', error.message); return null }
      return data
    } catch (e) {
      console.error('[Auth] _createUser exception:', e)
      return null
    }
  }

  async logout() {
    sessionStorage.clear()
    this.currentUser = null
    this.account = null
    const cfg = window.PIONEER_CONFIG
    try {
      if (this.msalInstance) {
        await this.msalInstance.logoutRedirect({
          postLogoutRedirectUri: window.location.origin + '/index.html'
        })
      } else {
        window.location.href = '/index.html'
      }
    } catch (e) {
      console.error('[Auth] Logout error:', e)
      window.location.href = '/index.html'
    }
  }

  async requireAuth() {
    const isLoggedIn = await this.init()
    if (!isLoggedIn) {
      // Figure out path back to index
      const isInPages = window.location.pathname.includes('/pages/')
      window.location.href = isInPages ? '../index.html' : 'index.html'
      return null
    }
    return this.currentUser
  }

  isAdmin() { return this.currentUser?.role === 'admin' }
  isSuperAdmin() { return this.currentUser?.email === window.PIONEER_CONFIG.adminEmail }
}

window.Auth = new PioneerAuth()
