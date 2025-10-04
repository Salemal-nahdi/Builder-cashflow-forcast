import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationEngine } from '@/lib/notification-engine'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationEngine = new NotificationEngine(session.user.organizationId)
    
    // Check and send notifications
    await notificationEngine.checkAndSendNotifications()
    
    // Get notification history
    const history = await notificationEngine.getNotificationHistory(10)
    
    return NextResponse.json({
      success: true,
      message: 'Notifications checked successfully',
      recentNotifications: history,
    })
  } catch (error) {
    console.error('Error checking notifications:', error)
    return NextResponse.json(
      { error: 'Failed to check notifications' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationEngine = new NotificationEngine(session.user.organizationId)
    const history = await notificationEngine.getNotificationHistory(50)
    
    return NextResponse.json({
      notifications: history,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}