import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForecastEngine } from '@/lib/forecast-engine'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  try {
    // Generate forecast for next 12 months
    const startDate = new Date()
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now

    const forecastEngine = new ForecastEngine(organizationId, startDate, endDate)
    const periods = await forecastEngine.generateForecast()

    // Generate CSV content
    const headers = ['Month', 'Income', 'Outgo', 'Net', 'Balance']
    const rows = periods.map(period => [
      period.startDate.slice(0, 7), // YYYY-MM format
      period.income.toFixed(2),
      period.outgo.toFixed(2),
      period.net.toFixed(2),
      period.balance.toFixed(2),
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="forecast-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Forecast CSV export error:', error)
    return NextResponse.json({ 
      error: 'Failed to export forecast',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
