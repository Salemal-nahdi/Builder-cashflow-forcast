import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReconciliationEngine } from '@/lib/reconciliation-engine'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  try {
    const reconciliationEngine = new ReconciliationEngine(organizationId)
    const varianceMatches = await reconciliationEngine.getVarianceMatches()

    // Generate CSV content
    const headers = [
      'Project',
      'Item Type',
      'Item ID',
      'Forecast Amount',
      'Forecast Date',
      'Amount Variance',
      'Timing Variance (Days)',
      'Confidence Score',
      'Status',
      'Xero Transaction ID',
      'Xero Transaction Type'
    ]

    const rows = varianceMatches.map(match => [
      match.cashEvent?.project?.name || 'No Project',
      match.cashEvent?.sourceType || '',
      match.cashEvent?.sourceId || '',
      match.cashEvent?.amount?.toFixed(2) || '0.00',
      match.cashEvent?.scheduledDate ? new Date(match.cashEvent.scheduledDate).toISOString().slice(0, 10) : '',
      match.amountVariance.toFixed(2),
      match.timingVariance.toString(),
      (match.confidenceScore * 100).toFixed(1),
      match.status,
      match.xeroTransactionId,
      match.xeroTransactionType,
    ])

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="variance-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Variance CSV export error:', error)
    return NextResponse.json({ 
      error: 'Failed to export variance data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
