import { NextResponse } from 'next/server'
import { getXeroAuthUrl } from '@/lib/xero/client'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

// GET /api/xero/connect - Initiate Xero OAuth
export async function GET() {
  try {
    // Validate environment variables
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET || !process.env.XERO_REDIRECT_URI) {
      return NextResponse.json(
        { error: 'Xero credentials not configured' },
        { status: 500 }
      )
    }

    // Generate state for OAuth
    const state = randomBytes(16).toString('hex')

    // Get authorization URL
    const authUrl = await getXeroAuthUrl(state)

    // Store state in cookie for validation
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('xero_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })

    return response
  } catch (error: any) {
    console.error('Xero connect error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

