import { prisma } from './prisma'

export interface XeroTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string[]
}

export interface XeroOrg {
  OrganisationID: string
  Name: string
  ShortCode?: string
}

export interface XeroContact {
  ContactID: string
  Name: string
  EmailAddress?: string
  IsSupplier?: boolean
  IsCustomer?: boolean
}

export interface XeroTrackingCategory {
  TrackingCategoryID: string
  Name: string
  Status: string
  Options: XeroTrackingOption[]
}

export interface XeroTrackingOption {
  TrackingOptionID: string
  Name: string
  Status: string
}

export interface XeroProject {
  ProjectID: string
  Name: string
  Status: string
  ContactID?: string
}

export interface XeroInvoice {
  InvoiceID: string
  Type: string
  Contact: XeroContact
  Date: string
  DueDate?: string
  Status: string
  Total: number
  AmountPaid: number
  AmountDue: number
  LineItems: XeroLineItem[]
}

export interface XeroLineItem {
  LineItemID: string
  Description: string
  Quantity: number
  UnitAmount: number
  LineAmount: number
  Tracking?: XeroTrackingCategory[]
}

export interface XeroBill {
  BillID: string
  Type: string
  Contact: XeroContact
  Date: string
  DueDate?: string
  Status: string
  Total: number
  AmountPaid: number
  AmountDue: number
  LineItems: XeroLineItem[]
}

export interface XeroPayment {
  PaymentID: string
  Date: string
  Amount: number
  Reference?: string
  Invoice?: { InvoiceID: string }
  Bill?: { BillID: string }
}

export class XeroAPI {
  private accessToken: string
  private refreshToken: string
  private tenantId: string

  constructor(accessToken: string, refreshToken: string, tenantId: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.tenantId = tenantId
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `https://api.xero.com/api.xro/2.0${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Xero-tenant-id': this.tenantId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, need to refresh
        throw new Error('TOKEN_EXPIRED')
      }
      throw new Error(`Xero API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getOrganizations(): Promise<XeroOrg[]> {
    const response = await this.makeRequest('/Organisation')
    return response.Organisations
  }

  async getContacts(): Promise<XeroContact[]> {
    const response = await this.makeRequest('/Contacts')
    return response.Contacts
  }

  async getTrackingCategories(): Promise<XeroTrackingCategory[]> {
    const response = await this.makeRequest('/TrackingCategories')
    return response.TrackingCategories
  }

  async getProjects(): Promise<XeroProject[]> {
    try {
      const response = await this.makeRequest('/Projects')
      return response.Projects || []
    } catch (error) {
      // Projects might not be enabled
      return []
    }
  }

  async getInvoices(modifiedSince?: string): Promise<XeroInvoice[]> {
    const params = new URLSearchParams()
    if (modifiedSince) {
      params.append('If-Modified-Since', modifiedSince)
    }
    
    const response = await this.makeRequest(`/Invoices?${params.toString()}`)
    return response.Invoices || []
  }

  async getBills(modifiedSince?: string): Promise<XeroBill[]> {
    const params = new URLSearchParams()
    if (modifiedSince) {
      params.append('If-Modified-Since', modifiedSince)
    }
    
    const response = await this.makeRequest(`/Bills?${params.toString()}`)
    return response.Bills || []
  }

  async getPayments(modifiedSince?: string): Promise<XeroPayment[]> {
    const params = new URLSearchParams()
    if (modifiedSince) {
      params.append('If-Modified-Since', modifiedSince)
    }
    
    const response = await this.makeRequest(`/Payments?${params.toString()}`)
    return response.Payments || []
  }

  static async refreshToken(refreshToken: string): Promise<XeroTokenResponse> {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  static async exchangeCode(code: string, redirectUri: string): Promise<XeroTokenResponse> {
    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

export async function getXeroConnection(organizationId: string) {
  const connection = await prisma.xeroConnection.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  })

  if (!connection) {
    throw new Error('No Xero connection found')
  }

  // Check if token is expired
  if (connection.tokenExpiresAt < new Date()) {
    try {
      const tokenResponse = await XeroAPI.refreshToken(connection.refreshToken)
      
      // Update the connection with new tokens
      await prisma.xeroConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        },
      })

      return {
        ...connection,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      }
    } catch (error) {
      throw new Error('Failed to refresh Xero token')
    }
  }

  return connection
}
