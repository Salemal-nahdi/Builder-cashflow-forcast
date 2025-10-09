import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/get-org'

export const dynamic = 'force-dynamic'

// GET /api/xero/tracking - Get tracking categories
export async function GET() {
  try {
    const organizationId = await getOrganizationId()

    const categories = await prisma.xeroTrackingCategory.findMany({
      where: { organizationId },
      include: {
        options: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

