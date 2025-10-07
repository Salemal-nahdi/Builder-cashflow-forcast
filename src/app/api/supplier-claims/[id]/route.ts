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

    const claimId = params.id
    const organizationId = session.user.organizationId
    const body = await request.json()

    // Verify claim belongs to the organization
    const claim = await prisma.supplierClaim.findUnique({
      where: { id: claimId },
      include: { project: true }
    })

    if (!claim || claim.project.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Supplier claim not found or unauthorized' }, { status: 404 })
    }

    // Update supplier claim
    const updateData: any = {}
    
    if (body.expectedDate) {
      updateData.expectedDate = new Date(body.expectedDate)
    }
    
    if (body.amount !== undefined) {
      updateData.amount = body.amount
    }

    if (body.supplierName) {
      updateData.supplierName = body.supplierName
    }

    const updatedClaim = await prisma.supplierClaim.update({
      where: { id: claimId },
      data: updateData
    })

    // Also update the related cash event if it exists
    if (body.expectedDate || body.amount !== undefined) {
      await prisma.cashEvent.updateMany({
        where: {
          projectId: claim.projectId,
          sourceType: 'supplier_claim',
          sourceId: claimId
        },
        data: {
          ...(body.expectedDate && { scheduledDate: new Date(body.expectedDate) }),
          ...(body.amount !== undefined && { amount: body.amount })
        }
      })
    }

    return NextResponse.json(updatedClaim)
  } catch (error) {
    console.error('Error updating supplier claim:', error)
    return NextResponse.json({ error: 'Failed to update supplier claim' }, { status: 500 })
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

    const claimId = params.id
    const organizationId = session.user.organizationId

    // Verify claim belongs to the organization
    const claim = await prisma.supplierClaim.findUnique({
      where: { id: claimId },
      include: { project: true }
    })

    if (!claim || claim.project.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Supplier claim not found or unauthorized' }, { status: 404 })
    }

    // Delete related cash events and the claim
    await prisma.$transaction([
      prisma.cashEvent.deleteMany({
        where: {
          projectId: claim.projectId,
          sourceType: 'supplier_claim',
          sourceId: claimId
        }
      }),
      prisma.supplierClaim.delete({
        where: { id: claimId }
      })
    ])

    return NextResponse.json({ message: 'Supplier claim deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting supplier claim:', error)
    return NextResponse.json({ error: 'Failed to delete supplier claim' }, { status: 500 })
  }
}

