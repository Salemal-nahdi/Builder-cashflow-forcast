import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const organizationId = session.user.organizationId

    // Verify project belongs to the organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        organizationId: true,
        xeroTrackingMaps: {
          include: {
            trackingOption: {
              include: {
                category: true
              }
            }
          }
        },
        xeroContactMap: {
          include: {
            contact: true
          }
        }
      }
    })

    if (!project || project.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      trackingMaps: project.xeroTrackingMaps,
      contactMap: project.xeroContactMap
    })
  } catch (error) {
    console.error('Error fetching Xero mappings:', error)
    return NextResponse.json({ error: 'Failed to fetch Xero mappings' }, { status: 500 })
  }
}

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
    const organizationId = session.user.organizationId
    const body = await request.json()
    const { trackingOptionIds, contactId } = body

    // Verify project belongs to the organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    })

    if (!project || project.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    // Delete existing tracking mappings and create new ones
    await prisma.projectXeroTrackingMap.deleteMany({
      where: { projectId }
    })

    if (trackingOptionIds && trackingOptionIds.length > 0) {
      await prisma.projectXeroTrackingMap.createMany({
        data: trackingOptionIds.map((optionId: string) => ({
          projectId,
          trackingOptionId: optionId
        }))
      })
    }

    // Update contact mapping if provided
    if (contactId) {
      await prisma.projectXeroContactMap.upsert({
        where: { projectId },
        update: { contactId },
        create: {
          projectId,
          contactId,
          isPrimary: true
        }
      })
    }

    // Return updated mappings
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        xeroTrackingMaps: {
          include: {
            trackingOption: {
              include: {
                category: true
              }
            }
          }
        },
        xeroContactMap: {
          include: {
            contact: true
          }
        }
      }
    })

    return NextResponse.json({
      trackingMaps: updatedProject?.xeroTrackingMaps || [],
      contactMap: updatedProject?.xeroContactMap || null
    })
  } catch (error) {
    console.error('Error updating Xero mappings:', error)
    return NextResponse.json({ error: 'Failed to update Xero mappings' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const organizationId = session.user.organizationId

    // Verify project belongs to the organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    })

    if (!project || project.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }

    // Delete all mappings
    await prisma.$transaction([
      prisma.projectXeroTrackingMap.deleteMany({
        where: { projectId }
      }),
      prisma.projectXeroContactMap.deleteMany({
        where: { projectId }
      })
    ])

    return NextResponse.json({ message: 'Xero mappings removed successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting Xero mappings:', error)
    return NextResponse.json({ error: 'Failed to delete Xero mappings' }, { status: 500 })
  }
}

