import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/xero/mapping - Map project to tracking category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, trackingOptionId } = body

    // Check if mapping already exists
    const existing = await prisma.xeroProjectMap.findUnique({
      where: {
        projectId_trackingOptionId: {
          projectId,
          trackingOptionId
        }
      }
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    // Create mapping
    const mapping = await prisma.xeroProjectMap.create({
      data: {
        projectId,
        trackingOptionId
      },
      include: {
        trackingOption: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(mapping, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/xero/mapping - Remove mapping
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')
    const trackingOptionId = url.searchParams.get('trackingOptionId')

    if (!projectId || !trackingOptionId) {
      return NextResponse.json(
        { error: 'Project ID and Tracking Option ID required' },
        { status: 400 }
      )
    }

    await prisma.xeroProjectMap.delete({
      where: {
        projectId_trackingOptionId: {
          projectId,
          trackingOptionId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

