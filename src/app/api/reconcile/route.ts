import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReconciliationEngine } from '@/lib/reconciliation-engine'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  try {
    const reconciliationEngine = new ReconciliationEngine(organizationId)
    const result = await reconciliationEngine.reconcileForecastWithActuals()

    return NextResponse.json({
      success: true,
      result,
      message: 'Reconciliation completed successfully',
    })
  } catch (error) {
    console.error('Reconciliation error:', error)
    return NextResponse.json({ 
      error: 'Reconciliation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
