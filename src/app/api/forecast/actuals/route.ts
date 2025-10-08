import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForecastEngine } from '@/lib/forecast-engine'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const basis = searchParams.get('basis') as 'cash' | 'accrual' || 'accrual'
    const scenarioId = searchParams.get('scenarioId')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const forecastEngine = new ForecastEngine(
      session.user.organizationId,
      new Date(startDate),
      new Date(endDate),
      scenarioId || undefined,
      basis
    )

    const forecast = await forecastEngine.generateForecast('monthly')

    // Calculate summary statistics
    const totalForecastIncome = forecast.reduce((sum, period) => sum + period.income, 0)
    const totalForecastOutgo = forecast.reduce((sum, period) => sum + period.outgo, 0)
    const totalForecastNet = totalForecastIncome - totalForecastOutgo

    const totalActualIncome = forecast.reduce((sum, period) => sum + (period.actualIncome || 0), 0)
    const totalActualOutgo = forecast.reduce((sum, period) => sum + (period.actualOutgo || 0), 0)
    const totalActualNet = totalActualIncome - totalActualOutgo

    const historicalPeriods = forecast.filter(p => p.isHistorical)
    const futurePeriods = forecast.filter(p => !p.isHistorical)

    return NextResponse.json({
      success: true,
      data: {
        periods: forecast,
        summary: {
          totalForecastIncome,
          totalForecastOutgo,
          totalForecastNet,
          totalActualIncome,
          totalActualOutgo,
          totalActualNet,
          historicalPeriodsCount: historicalPeriods.length,
          futurePeriodsCount: futurePeriods.length,
        },
        basis,
        dateRange: {
          startDate,
          endDate,
        },
      },
    })
  } catch (error) {
    console.error('Error generating forecast with actuals:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
