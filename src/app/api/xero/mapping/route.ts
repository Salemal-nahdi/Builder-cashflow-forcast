import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, trackingOptionIds, contactId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Handle tracking option mappings
    if (trackingOptionIds && Array.isArray(trackingOptionIds)) {
      // Remove existing mappings for this project
      await prisma.projectXeroTrackingMap.deleteMany({
        where: { projectId },
      })

      // Create new mappings
      for (const trackingOptionId of trackingOptionIds) {
        await prisma.projectXeroTrackingMap.create({
          data: {
            projectId,
            trackingOptionId,
          },
        })
      }
    }

    // Handle contact mapping
    if (contactId) {
      // Remove existing contact mapping for this project
      await prisma.projectXeroContactMap.deleteMany({
        where: { projectId },
      })

      // Create new contact mapping
      await prisma.projectXeroContactMap.create({
        data: {
          projectId,
          contactId,
          isPrimary: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Mapping saved successfully',
    })
  } catch (error) {
    console.error('Error saving mapping:', error)
    return NextResponse.json(
      { error: 'Failed to save mapping' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const mappingType = searchParams.get('type') // 'tracking' or 'contact'

    if (!projectId || !mappingType) {
      return NextResponse.json({ error: 'Project ID and mapping type are required' }, { status: 400 })
    }

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (mappingType === 'tracking') {
      await prisma.projectXeroTrackingMap.deleteMany({
        where: { projectId },
      })
    } else if (mappingType === 'contact') {
      await prisma.projectXeroContactMap.deleteMany({
        where: { projectId },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Mapping removed successfully',
    })
  } catch (error) {
    console.error('Error removing mapping:', error)
    return NextResponse.json(
      { error: 'Failed to remove mapping' },
      { status: 500 }
    )
  }
}
