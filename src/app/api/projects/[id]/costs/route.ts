import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/projects/[id]/costs - Add cost
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const cost = await prisma.cost.create({
      data: {
        projectId: params.id,
        description: body.description,
        amount: body.amount,
        expectedDate: new Date(body.expectedDate),
        vendor: body.vendor,
        status: body.status || 'pending'
      }
    })

    return NextResponse.json(cost, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/costs/[costId] - Update cost
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { costId, ...data } = body

    const cost = await prisma.cost.update({
      where: { id: costId },
      data: {
        description: data.description,
        amount: data.amount,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        vendor: data.vendor,
        status: data.status
      }
    })

    return NextResponse.json(cost)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/costs/[costId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url)
    const costId = url.searchParams.get('costId')

    if (!costId) {
      return NextResponse.json(
        { error: 'Cost ID required' },
        { status: 400 }
      )
    }

    await prisma.cost.delete({
      where: { id: costId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

