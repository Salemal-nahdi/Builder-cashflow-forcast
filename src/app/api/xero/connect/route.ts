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
    return NextResponse.json(
      { error: 'Failed to initiate Xero connection' },
      { status: 500 }
    )
  }
}