import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const body = await request.json()

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create milestone and associated cash event
    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        name: body.name,
        expectedDate: new Date(body.expectedDate),
        contractValue: body.amount, // This is the full contract value for this milestone
        amount: body.amount, // This is also the amount to receive
        status: 'pending'
      }
    })

    // Create corresponding income cash event
    await prisma.cashEvent.create({
      data: {
        organizationId: session.user.organizationId,
        projectId,
        type: 'income',
        amount: body.amount,
        scheduledDate: new Date(body.expectedDate),
        sourceType: 'milestone',
        sourceId: milestone.id
      }
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}

