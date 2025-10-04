import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId
  const scenarioId = params.id

  try {
    // Verify scenario belongs to organization
    const scenario = await prisma.scenario.findFirst({
      where: {
        id: scenarioId,
        organizationId,
      },
    })

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    if (scenario.isBase) {
      return NextResponse.json({ error: 'Cannot modify base scenario' }, { status: 400 })
    }

    const body = await request.json()
    const { entityType, entityId, daysShift, amountShift } = body

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID are required' }, { status: 400 })
    }

    // Validate entity exists and belongs to organization
    let entityExists = false
    if (entityType === 'milestone') {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: entityId,
          project: { organizationId },
        },
      })
      entityExists = !!milestone
    } else if (entityType === 'supplier_claim') {
      const claim = await prisma.supplierClaim.findFirst({
        where: {
          id: entityId,
          project: { organizationId },
        },
      })
      entityExists = !!claim
    } else if (entityType === 'material_order') {
      const order = await prisma.materialOrder.findFirst({
        where: {
          id: entityId,
          project: { organizationId },
        },
      })
      entityExists = !!order
    }

    if (!entityExists) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Check if shift already exists for this entity
    const existingShift = await prisma.scenarioShift.findFirst({
      where: {
        scenarioId,
        entityType,
        entityId,
      },
    })

    if (existingShift) {
      // Update existing shift
      const shift = await prisma.scenarioShift.update({
        where: { id: existingShift.id },
        data: {
          daysShift: daysShift || 0,
          amountShift: amountShift || null,
        },
      })
      return NextResponse.json(shift)
    } else {
      // Create new shift
      const shift = await prisma.scenarioShift.create({
        data: {
          scenarioId,
          entityType,
          entityId,
          daysShift: daysShift || 0,
          amountShift: amountShift || null,
        },
      })
      return NextResponse.json(shift)
    }
  } catch (error) {
    console.error('Error creating/updating scenario shift:', error)
    return NextResponse.json({ error: 'Failed to create/update scenario shift' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId
  const scenarioId = params.id

  try {
    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')

    if (!shiftId) {
      return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 })
    }

    // Verify scenario belongs to organization
    const scenario = await prisma.scenario.findFirst({
      where: {
        id: scenarioId,
        organizationId,
      },
    })

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    if (scenario.isBase) {
      return NextResponse.json({ error: 'Cannot modify base scenario' }, { status: 400 })
    }

    // Delete the shift
    await prisma.scenarioShift.delete({
      where: { id: shiftId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scenario shift:', error)
    return NextResponse.json({ error: 'Failed to delete scenario shift' }, { status: 500 })
  }
}
