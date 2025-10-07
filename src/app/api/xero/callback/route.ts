import { NextRequest, NextResponse } from 'next/server'
import { XeroOAuth } from '@/lib/xero/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    console.log('Xero callback received with params:', {
      hasCode: !!code,
      hasState: !!state,
      error,
      errorDescription,
      allParams: Array.from(searchParams.entries())
    })

    if (error) {
      console.error('Xero OAuth error:', error, errorDescription)
      const errorMsg = errorDescription || error
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/xero?error=${encodeURIComponent(errorMsg)}`
      )
    }

    if (!code || !state) {
      console.error('Missing OAuth parameters. Code:', !!code, 'State:', !!state)
      console.error('This usually means the Xero redirect URI is misconfigured')
      console.error('Expected redirect URI:', process.env.XERO_REDIRECT_URI)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/xero?error=missing_oauth_params`
      )
    }

    // Decode and validate state
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch (error) {
      console.error('Invalid state parameter:', error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/xero?error=invalid_state`
      )
    }

    const { organizationId, userId } = stateData

    if (!organizationId || !userId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/xero?error=invalid_state`
      )
    }

    // Exchange code for tokens
    const tokenData = await XeroOAuth.exchangeCodeForToken(code, state)

    // Check if connection already exists
    const existingConnection = await prisma.xeroConnection.findFirst({
      where: {
        organizationId,
        xeroTenantId: tokenData.tenantId,
      },
    })

    if (existingConnection) {
      // Update existing connection
      await prisma.xeroConnection.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: new Date(Date.now() + (tokenData.expiresIn * 1000)),
          xeroOrgName: tokenData.tenantName,
          isActive: true,
          lastSyncAt: null, // Reset sync status
        },
      })
    } else {
      // Create new connection
      await prisma.xeroConnection.create({
        data: {
          organizationId,
          xeroTenantId: tokenData.tenantId,
          xeroOrgName: tokenData.tenantName,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: new Date(Date.now() + (tokenData.expiresIn * 1000)),
          scopes: [
            'accounting.settings',
            'accounting.contacts.read',
            'accounting.transactions.read',
            'projects.read',
            'offline_access'
          ].join(','),
          isActive: true,
        },
      })
    }

    // Redirect to settings page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/xero?success=true`
    )
  } catch (error) {
    console.error('Error in Xero OAuth callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/xero?error=connection_failed`
    )
  }
}
