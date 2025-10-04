import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { XeroSyncService } from '@/lib/xero/sync'
import { XeroETLService } from '@/lib/xero/etl'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has finance or management role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roleAssignments: true,
      },
    })

    const hasPermission = user?.roleAssignments.some(
      role => ['finance', 'management'].includes(role.role)
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { connectionId, entityTypes, initialSync, basis = 'accrual' } = body

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
    }

    // Verify connection belongs to organization
    const connection = await prisma.xeroConnection.findFirst({
      where: {
        id: connectionId,
        organizationId: session.user.organizationId,
        isActive: true,
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found or inactive' }, { status: 404 })
    }

    // Start sync process
    const syncService = new XeroSyncService(connectionId, session.user.organizationId)
    
    await syncService.syncAll({
      connectionId,
      organizationId: session.user.organizationId,
      entityTypes,
      initialSync,
    })

    // Transform to actual events
    const etlService = new XeroETLService(connectionId, session.user.organizationId)
    
    await etlService.transformToActualEvents({
      connectionId,
      organizationId: session.user.organizationId,
      basis,
    })

    // Get sync statistics
    const syncLogs = await prisma.xeroSyncLog.findMany({
      where: {
        connectionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    const actualEventsCount = await prisma.actualEvent.count({
      where: {
        organizationId: session.user.organizationId,
        basis,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      stats: {
        actualEventsCount,
        recentSyncLogs: syncLogs,
      },
    })
  } catch (error) {
    console.error('Error during Xero sync:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
    }

    // Get sync status and logs
    const connection = await prisma.xeroConnection.findFirst({
      where: {
        id: connectionId,
        organizationId: session.user.organizationId,
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const syncLogs = await prisma.xeroSyncLog.findMany({
      where: {
        connectionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    })

    const actualEventsCount = await prisma.actualEvent.count({
      where: {
        organizationId: session.user.organizationId,
      },
    })

    return NextResponse.json({
      connection: {
        id: connection.id,
        xeroOrgName: connection.xeroOrgName,
        lastSyncAt: connection.lastSyncAt,
        isActive: connection.isActive,
      },
      syncLogs,
      actualEventsCount,
    })
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    )
  }
}