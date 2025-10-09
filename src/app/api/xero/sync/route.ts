import { NextResponse } from 'next/server'
import { syncXeroData } from '@/lib/xero/sync'
import { getOrganizationId } from '@/lib/get-org'

export const dynamic = 'force-dynamic'

// POST /api/xero/sync - Sync data from Xero
export async function POST() {
  try {
    const organizationId = await getOrganizationId()

    const result = await syncXeroData(organizationId)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Xero sync error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

