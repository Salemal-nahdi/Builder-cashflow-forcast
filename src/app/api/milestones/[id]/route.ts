import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const milestoneId = params.id
    const organizationId = session.user.organizationId
    const body = await request.json()

    // Verify milestone belongs to the organization
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: true }
    })

    if (!milestone || milestone.project.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Milestone not found or unauthorized' }, { status: 404 })
    }

    // Update milestone
    const updateData: any = {}
    
    if (body.expectedDate) {
      updateData.expectedDate = new Date(body.expectedDate)
    }
    
    if (body.amount !== undefined) {
      updateData.amount = body.amount
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData
    })

    // Also update the related cash event if it exists
    if (body.expectedDate || body.amount !== undefined) {
      await prisma.cashEvent.updateMany({
        where: {
          projectId: milestone.projectId,
          sourceType: 'milestone',
          sourceId: milestoneId
        },
        data: {
          ...(body.expectedDate && { scheduledDate: new Date(body.expectedDate) }),
          ...(body.amount !== undefined && { amount: body.amount })
        }
      })
    }

    return NextResponse.json(updatedMilestone)
  } catch (error) {
    console.error('Error updating milestone:', error)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}

