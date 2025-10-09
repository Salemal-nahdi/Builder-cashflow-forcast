import { NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/xero/client'
import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/get-org'
import { XeroClient } from 'xero-node'

export const dynamic = 'force-dynamic'

// GET /api/xero/callback - Handle Xero OAuth callback
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    // Check for OAuth error
    if (error) {
      return NextResponse.redirect(
        `${url.origin}/settings/xero?error=oauth_error&message=${error}`
      )
    }

    // Validate required params
    if (!code || !state) {
      return NextResponse.redirect(
        `${url.origin}/settings/xero?error=missing_params`
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, state)

    // Get tenant ID
    const xero = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      redirectUris: [process.env.XERO_REDIRECT_URI!]
    })

    await xero.setTokenSet({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    })

    await xero.updateTenants()
    const tenants = xero.tenants
    
    if (!tenants || tenants.length === 0) {
      return NextResponse.redirect(
        `${url.origin}/settings/xero?error=no_tenant`
      )
    }

    const tenantId = tenants[0].tenantId

    // Get organization
    const organizationId = await getOrganizationId()

    // Deactivate existing connections
    await prisma.xeroConnection.updateMany({
      where: { organizationId },
      data: { isActive: false }
    })

    // Create new connection
    await prisma.xeroConnection.create({
      data: {
        organizationId,
        tenantId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        isActive: true
      }
    })

    // Redirect to settings with success
    return NextResponse.redirect(
      `${url.origin}/settings/xero?success=true`
    )
  } catch (error: any) {
    console.error('Xero callback error:', error)
    const url = new URL(request.url)
    return NextResponse.redirect(
      `${url.origin}/settings/xero?error=connection_failed&message=${encodeURIComponent(error.message)}`
    )
  }
}

