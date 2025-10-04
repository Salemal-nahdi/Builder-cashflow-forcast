import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationEngine } from '@/lib/notification-engine'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  try {
    const notificationEngine = new NotificationEngine(organizationId)
    await notificationEngine.sendWeeklyDigest()

    return NextResponse.json({
      success: true,
      message: 'Weekly digest sent successfully',
    })
  } catch (error) {
    console.error('Weekly digest error:', error)
    return NextResponse.json({ 
      error: 'Failed to send weekly digest',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
