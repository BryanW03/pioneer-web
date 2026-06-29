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
    const cfg = window.PIONEER_CONFIG

    // Init Supabase
    this.supabase = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey)

    // Init MSAL v3
    const msalConfig = {
      auth: {
        clientId:    cfg.azure.clientId,
        authority:   'https://login.microsoftonline.com/' + cfg.azure.tenantId,
        redirectUri: cfg.azure.redirectUri,
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
      },
    }

    this.msalInstance = new msal.PublicClientApplication(msalConfig)
    await this.msalInstance.initialize()

    // Handle redirect response after Microsoft login
    try {
      const response = await this.msalInstance.handleRedirectPromise()
      if (response && response.account) {
        return await this._handleLoginSuccess(response)
      }
    } catch (e) {
      console.error('Redirect error:', e)
      return false
    }

    // Check if already logged in (existing session)
    const accounts = this.msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      this.account = accounts[0]
      const email = this.account.username.toLowerCase()
      const userData = await this._loadUserFromDB(email)
      if (userData && userData.is_active) {
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
      })
    } catch (e) {
      console.error('Login error:', e)
      throw e
    }
  }

  async _handleLoginSuccess(response) {
    const cfg = window.PIONEER_CONFIG
    const email = response.account.username.toLowerCase()
    const name  = response.account.name || email.split('@')[0]

    // Validate domain
    if (!email.endsWith('@' + cfg.domain)) {
      await this.msalInstance.logoutRedirect({ postLogoutRedirectUri: cfg.azure.redirectUri })
      window.location.href = cfg.azure.redirectUri + '?error=domain_not_allowed'
      return false
    }

    this.account = response.account

    // Check user in DB
    let user = await this._loadUserFromDB(email)

    if (!user) {
      // Only super admin can self-register
      if (email === cfg.adminEmail) {
        user = await this._createUser({ email, name, role: 'admin', is_active: true, department: 'IT' })
      } else {
        await this.msalInstance.logoutRedirect({ postLogoutRedirectUri: cfg.azure.redirectUri })
        window.location.href = cfg.azure.redirectUri + '?error=not_authorized'
        return false
      }
    }

    if (!user.is_active) {
      await this.msalInstance.logoutRedirect({ postLogoutRedirectUri: cfg.azure.redirectUri })
      window.location.href = cfg.azure.redirectUri + '?error=account_disabled'
      return false
    }

    this.currentUser = user

    // Log login
    await this.supabase.from('audit_logs').insert([{
      user_id: user.id, action: 'LOGIN', entity: 'User', entity_id: user.id,
    }]).catch(() => {})

    return true
  }

  async _loadUserFromDB(email) {
    const { data, error } = await this.supabase
      .from('users').select('*').eq('email', email).single()
    if (error || !data) return null
    return data
  }

  async _createUser({ email, name, role, is_active, department }) {
    const { data, error } = await this.supabase
      .from('users')
      .insert([{ email, name, role, is_active, department, created_by: email }])
      .select().single()
    if (error) { console.error('Create user error:', error); return null }
    return data
  }

  async logout() {
    sessionStorage.clear()
    this.currentUser = null
    this.account = null
    const cfg = window.PIONEER_CONFIG
    try {
      await this.msalInstance.logoutRedirect({
        postLogoutRedirectUri: cfg.azure.redirectUri
      })
    } catch {
      window.location.href = '../index.html'
    }
  }

  // Call on every protected page
  async requireAuth() {
    const isLoggedIn = await this.init()
    if (!isLoggedIn) {
      // Determine correct path back to index
      const depth = window.location.pathname.split('/').length - 2
      const prefix = depth > 0 ? '../'.repeat(depth) : ''
      window.location.href = prefix + 'index.html'
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

window.Auth = new PioneerAuth()
