import { XeroApi, XeroClient } from 'xero-node'
import { prisma } from '../prisma'

export interface XeroConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export class XeroApiClient {
  private client: XeroClient
  private connectionId: string
  private organizationId: string

  constructor(connectionId: string, organizationId: string) {
    this.connectionId = connectionId
    this.organizationId = organizationId
    
    this.client = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      redirectUris: [process.env.XERO_REDIRECT_URI!],
      scopes: [
        'accounting.settings',
        'accounting.contacts.read',
        'accounting.transactions.read',
        'projects.read',
        'offline_access'
      ].join(' '),
    })
  }

  async initialize(): Promise<void> {
    const connection = await prisma.xeroConnection.findUnique({
      where: { id: this.connectionId },
    })

    if (!connection) {
      throw new Error('Xero connection not found')
    }

    if (!connection.isActive) {
      throw new Error('Xero connection is not active')
    }

    // Check if token needs refresh
    if (connection.tokenExpiresAt <= new Date()) {
      await this.refreshToken(connection)
    }

    // Set the tenant ID for API calls
    this.client.setTenantId(connection.xeroTenantId)
  }

  private async refreshToken(connection: any): Promise<void> {
    try {
      const tokenSet = await this.client.refreshAccessToken()
      
      await prisma.xeroConnection.update({
        where: { id: this.connectionId },
        data: {
          accessToken: tokenSet.access_token!,
          refreshToken: tokenSet.refresh_token!,
          tokenExpiresAt: new Date(Date.now() + (tokenSet.expires_in! * 1000)),
        },
      })
    } catch (error) {
      console.error('Failed to refresh Xero token:', error)
      
      // Mark connection as inactive
      await prisma.xeroConnection.update({
        where: { id: this.connectionId },
        data: { isActive: false },
      })
      
      throw new Error('Failed to refresh Xero token')
    }
  }

  async getAccounts(): Promise<any[]> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.getAccounts()
      return response.body.accounts || []
    } catch (error) {
      console.error('Error fetching accounts:', error)
      throw error
    }
  }

  async getTrackingCategories(): Promise<any[]> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.getTrackingCategories()
      return response.body.trackingCategories || []
    } catch (error) {
      console.error('Error fetching tracking categories:', error)
      throw error
    }
  }

  async getContacts(): Promise<any[]> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.getContacts()
      return response.body.contacts || []
    } catch (error) {
      console.error('Error fetching contacts:', error)
      throw error
    }
  }

  async getInvoices(modifiedSince?: Date): Promise<any[]> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.getInvoices(
        undefined, // tenantId (already set)
        undefined, // ifModifiedSince
        undefined, // where
        undefined, // order
        undefined, // IDs
        undefined, // invoiceNumbers
        undefined, // contactIDs
        undefined, // statuses
        undefined, // page
        undefined, // includeArchived
        undefined, // createdByMyApp
        undefined, // unitdp
        undefined, // summaryOnly
        undefined, // searchTerm
        modifiedSince
      )
      return response.body.invoices || []
    } catch (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }
  }

  async getBills(modifiedSince?: Date): Promise<any[]> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.getBills(
        undefined, // tenantId
        undefined, // ifModifiedSince
        undefined, // where
        undefined, // order
        undefined, // IDs
        undefined, // billNumbers
        undefined, // contactIDs
        undefined, // statuses
        undefined, // page
        undefined, // includeArchived
        undefined, // createdByMyApp
        undefined, // unitdp
        undefined, // summaryOnly
        undefined, // searchTerm
        modifiedSince
      )
      return response.body.bills || []
    } catch (error) {
      console.error('Error fetching bills:', error)
      throw error
    }
  }

  async getPayments(modifiedSince?: Date): Promise<any[]> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.getPayments(
        undefined, // tenantId
        undefined, // ifModifiedSince
        undefined, // where
        undefined, // order
        undefined, // IDs
        undefined, // invoiceIDs
        undefined, // creditNoteIDs
        undefined, // page
        undefined, // includeArchived
        undefined, // createdByMyApp
        undefined, // unitdp
        modifiedSince
      )
      return response.body.payments || []
    } catch (error) {
      console.error('Error fetching payments:', error)
      throw error
    }
  }

  async getBankTransactions(modifiedSince?: Date): Promise<any[]> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.getBankTransactions(
        undefined, // tenantId
        undefined, // ifModifiedSince
        undefined, // where
        undefined, // order
        undefined, // IDs
        undefined, // bankAccountIDs
        undefined, // page
        undefined, // includeArchived
        undefined, // createdByMyApp
        undefined, // unitdp
        undefined, // summaryOnly
        undefined, // searchTerm
        modifiedSince
      )
      return response.body.bankTransactions || []
    } catch (error) {
      console.error('Error fetching bank transactions:', error)
      throw error
    }
  }

  async getItems(): Promise<any[]> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.getItems()
      return response.body.items || []
    } catch (error) {
      console.error('Error fetching items:', error)
      throw error
    }
  }

  async createDraftInvoice(invoiceData: any): Promise<any> {
    await this.initialize()
    
    try {
      const response = await this.client.accountingApi.createInvoice(
        undefined, // tenantId
        { invoices: [invoiceData] }
      )
      return response.body.invoices?.[0]
    } catch (error) {
      console.error('Error creating draft invoice:', error)
      throw error
    }
  }

  // Rate limiting and retry logic
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error
        
        // Check if it's a rate limit error
        if (error.status === 429 || error.statusCode === 429) {
          const retryAfter = error.headers?.['retry-after'] || attempt + 1
          const delay = parseInt(retryAfter) * 1000
          
          if (attempt < maxRetries) {
            console.log(`Rate limited, retrying after ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        // For other errors, don't retry
        throw error
      }
    }
    
    throw lastError!
  }

  // Helper method to handle pagination
  async getAllPages<T>(
    fetchPage: (page: number) => Promise<{ items: T[], hasMore: boolean }>
  ): Promise<T[]> {
    const allItems: T[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const result = await this.withRetry(() => fetchPage(page))
      allItems.push(...result.items)
      hasMore = result.hasMore
      page++
    }

    return allItems
  }
}

// Static methods for OAuth flow
export class XeroOAuth {
  static async getAuthUrl(state: string): Promise<string> {
    const client = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      redirectUris: [process.env.XERO_REDIRECT_URI!],
      scopes: [
        'accounting.settings',
        'accounting.contacts.read',
        'accounting.transactions.read',
        'projects.read',
        'offline_access'
      ].join(' '),
    })

    return client.buildConsentUrl()
  }

  static async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    tenantId: string
    tenantName: string
  }> {
    const client = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      redirectUris: [process.env.XERO_REDIRECT_URI!],
      scopes: [
        'accounting.settings',
        'accounting.contacts.read',
        'accounting.transactions.read',
        'projects.read',
        'offline_access'
      ].join(' '),
    })

    const tokenSet = await client.apiCallback(process.env.XERO_REDIRECT_URI!)
    
    // Get tenant information
    const connections = await client.connections
    const tenant = connections[0] // Assuming single tenant for now

    return {
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token!,
      expiresIn: tokenSet.expires_in!,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
    }
  }
}
