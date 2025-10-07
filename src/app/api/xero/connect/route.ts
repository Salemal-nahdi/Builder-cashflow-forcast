import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { XeroOAuth } from '@/lib/xero/client'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate Xero environment variables
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET || !process.env.XERO_REDIRECT_URI) {
      console.error('Xero environment variables not configured:', {
        hasClientId: !!process.env.XERO_CLIENT_ID,
        hasClientSecret: !!process.env.XERO_CLIENT_SECRET,
        hasRedirectUri: !!process.env.XERO_REDIRECT_URI,
      })
      return NextResponse.json(
        { error: 'Xero integration not configured. Please check environment variables.' },
        { status: 500 }
      )
    }

    // Generate state parameter for security
    const state = randomBytes(32).toString('hex')
    
    // Store state in session or database for validation
    // For now, we'll include organizationId in the state
    const stateData = {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      nonce: state,
    }
    
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64')
    
    // Get authorization URL
    const authUrl = await XeroOAuth.getAuthUrl(encodedState)
    
    return NextResponse.json({
      authUrl,
      state: encodedState,
    })
  } catch (error) {
    console.error('Error initiating Xero OAuth:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate Xero connection'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}