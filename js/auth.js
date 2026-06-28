// ============================================================
// PIONEER PORTAL — AUTENTICACIÓN MICROSOFT
// ============================================================

class PioneerAuth {
  constructor() {
    this.msalInstance = null
    this.account = null
    this.supabase = null
    this.currentUser = null
  }

  async init() {
    const cfg = window.PIONEER_CONFIG

    // Init MSAL (Microsoft Authentication Library)
    this.msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId:   cfg.azure.clientId,
        authority:  `https://login.microsoftonline.com/${cfg.azure.tenantId}`,
        redirectUri: cfg.azure.redirectUri,
      },
      cache: { cacheLocation: 'sessionStorage' },
    })

    await this.msalInstance.initialize()

    // Init Supabase
    this.supabase = supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey)

    // Handle redirect after Microsoft login
    try {
      const response = await this.msalInstance.handleRedirectPromise()
      if (response) {
        await this._handleLoginSuccess(response)
        return true
      }
    } catch (e) {
      console.error('Redirect error:', e)
      return false
    }

    // Check existing session
    const accounts = this.msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      this.account = accounts[0]
      const userData = await this._loadUserFromDB(this.account.username)
      if (userData) {
        this.currentUser = userData
        return true
      }
    }

    return false
  }

  async loginWithMicrosoft() {
    const cfg = window.PIONEER_CONFIG
    try {
      await this.msalInstance.loginRedirect({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
        loginHint: `@${cfg.domain}`,
      })
    } catch (e) {
      console.error('Login error:', e)
      throw e
    }
  }

  async _handleLoginSuccess(response) {
    const cfg = window.PIONEER_CONFIG
    const email = response.account.username.toLowerCase()
    const name  = response.account.name || email

    // Validate domain
    if (!email.endsWith(`@${cfg.domain}`)) {
      await this.msalInstance.logoutRedirect()
      throw new Error('domain_not_allowed')
    }

    this.account = response.account

    // Load or create user in Supabase
    let user = await this._loadUserFromDB(email)

    if (!user) {
      // Only allow if it's the super admin (first user)
      if (email === cfg.adminEmail) {
        user = await this._createUser({
          email, name, role: 'admin', is_active: true, department: 'IT'
        })
      } else {
        // Not pre-registered
        await this.msalInstance.logoutRedirect()
        window.location.href = 'index.html?error=not_authorized'
        return
      }
    }

    if (!user.is_active) {
      await this.msalInstance.logoutRedirect()
      window.location.href = 'index.html?error=account_disabled'
      return
    }

    this.currentUser = user

    // Log the login
    await this._logAudit(user.id, 'LOGIN', 'User', user.id)

    // Redirect to dashboard
    window.location.href = 'pages/dashboard.html'
  }

  async _loadUserFromDB(email) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return data
  }

  async _createUser({ email, name, role, is_active, department }) {
    const { data, error } = await this.supabase
      .from('users')
      .insert([{ email, name, role, is_active, department, created_by: email }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async _logAudit(userId, action, entity, entityId, details = null) {
    await this.supabase.from('audit_logs').insert([{
      user_id:   userId,
      action,
      entity,
      entity_id: entityId,
      details:   details ? JSON.stringify(details) : null,
    }])
  }

  async logout() {
    // Clear Supabase session storage
    sessionStorage.clear()
    localStorage.removeItem('pioneer_user')
    this.currentUser = null
    this.account = null

    try {
      await this.msalInstance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin + '/index.html'
      })
    } catch {
      window.location.href = '../index.html'
    }
  }

  // Call this from every protected page
  async requireAuth() {
    const isLoggedIn = await this.init()
    if (!isLoggedIn) {
      window.location.href = '../index.html'
      return null
    }
    return this.currentUser
  }

  isAdmin() {
    return this.currentUser?.role === 'admin'
  }

  isSuperAdmin() {
    return this.currentUser?.email === window.PIONEER_CONFIG.adminEmail
  }
}

// Singleton
window.Auth = new PioneerAuth()
