import { XeroClient } from 'xero-node'

const CLIENT_ID = process.env.XERO_CLIENT_ID!
const CLIENT_SECRET = process.env.XERO_CLIENT_SECRET!
const REDIRECT_URI = process.env.XERO_REDIRECT_URI!

/**
 * Generate Xero OAuth authorization URL
 */
export async function getXeroAuthUrl(state: string): Promise<string> {
  const scopes = 'openid profile email accounting.transactions.read accounting.contacts.read accounting.settings.read'
  
  const xero = new XeroClient({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUris: [REDIRECT_URI],
    scopes: scopes.split(' '),
    state: state
  })

  return await xero.buildConsentUrl()
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string, state: string) {
  const scopes = 'openid profile email accounting.transactions.read accounting.contacts.read accounting.settings.read'
  
  const xero = new XeroClient({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUris: [REDIRECT_URI],
    scopes: scopes.split(' '),
    state: state
  })

  const callbackUrl = `${REDIRECT_URI}?code=${code}&state=${state}`
  const tokenSet = await xero.apiCallback(callbackUrl)

  return {
    accessToken: tokenSet.access_token!,
    refreshToken: tokenSet.refresh_token!,
    expiresAt: new Date(Date.now() + tokenSet.expires_in! * 1000)
  }
}

/**
 * Get authenticated Xero client
 */
export async function getXeroClient(accessToken: string, refreshToken: string, tenantId: string) {
  const xero = new XeroClient({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUris: [REDIRECT_URI]
  })

  await xero.setTokenSet({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer'
  })

  await xero.updateTenants()

  return { xero, tenantId }
}

/**
 * Refresh Xero access token
 */
export async function refreshXeroToken(refreshToken: string) {
  const xero = new XeroClient({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUris: [REDIRECT_URI]
  })

  await xero.setTokenSet({
    refresh_token: refreshToken
  })

  const newTokenSet = await xero.refreshToken()

  return {
    accessToken: newTokenSet.access_token!,
    refreshToken: newTokenSet.refresh_token!,
    expiresAt: new Date(Date.now() + newTokenSet.expires_in! * 1000)
  }
}

