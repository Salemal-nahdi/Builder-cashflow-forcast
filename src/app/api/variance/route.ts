import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReconciliationEngine } from '@/lib/reconciliation-engine'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { basis = 'accrual' } = body

    const reconciliationEngine = new ReconciliationEngine(session.user.organizationId)
    const result = await reconciliationEngine.reconcileForecastWithActuals(basis)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Error running variance analysis:', error)
    return NextResponse.json(
      { error: 'Failed to run variance analysis' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const basis = searchParams.get('basis') as 'cash' | 'accrual' || 'accrual'

    const reconciliationEngine = new ReconciliationEngine(session.user.organizationId)
    const matches = await reconciliationEngine.getVarianceMatches(projectId, basis)

    return NextResponse.json({
      matches,
    })
  } catch (error) {
    console.error('Error fetching variance matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variance matches' },
      { status: 500 }
    )
  }
}
