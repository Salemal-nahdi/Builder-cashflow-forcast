import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/projects/[id]/milestones - Add milestone
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const milestone = await prisma.milestone.create({
      data: {
        projectId: params.id,
        name: body.name,
        amount: body.amount,
        expectedDate: new Date(body.expectedDate),
        status: body.status || 'pending'
      }
    })

    return NextResponse.json(milestone, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/milestones/[milestoneId] - Update milestone
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { milestoneId, ...data } = body

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        name: data.name,
        amount: data.amount,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        status: data.status
      }
    })

    return NextResponse.json(milestone)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/milestones/[milestoneId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url)
    const milestoneId = url.searchParams.get('milestoneId')

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID required' },
        { status: 400 }
      )
    }

    await prisma.milestone.delete({
      where: { id: milestoneId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

