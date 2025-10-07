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

    // Create supplier claim and associated cash event
    const supplierClaim = await prisma.supplierClaim.create({
      data: {
        projectId,
        supplierName: body.supplierName,
        expectedDate: new Date(body.expectedDate),
        amount: body.amount,
        status: 'pending'
      }
    })

    // Create corresponding outgo cash event
    await prisma.cashEvent.create({
      data: {
        organizationId: session.user.organizationId,
        projectId,
        type: 'outgo',
        amount: body.amount,
        scheduledDate: new Date(body.expectedDate),
        sourceType: 'supplier_claim',
        sourceId: supplierClaim.id
      }
    })

    return NextResponse.json(supplierClaim)
  } catch (error) {
    console.error('Error creating cost:', error)
    return NextResponse.json(
      { error: 'Failed to create cost' },
      { status: 500 }
    )
  }
}

