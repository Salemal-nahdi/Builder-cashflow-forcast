import { NextResponse } from 'next/server'
import { ForecastEngine } from '@/lib/forecast-engine'
import { getOrganizationId } from '@/lib/get-org'
import { prisma } from '@/lib/prisma'
import { addMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

// GET /api/forecast - Get cashflow forecast
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const monthsParam = url.searchParams.get('months')
    const months = monthsParam ? parseInt(monthsParam) : 6

    const organizationId = await getOrganizationId()

    // Get organization with starting balance
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Calculate forecast for next X months
    const startDate = new Date()
    startDate.setDate(1) // Start of current month
    const endDate = addMonths(startDate, months)

    const engine = new ForecastEngine(
      organizationId,
      startDate,
      endDate,
      Number(organization.startingBalance)
    )

    const forecast = await engine.calculateForecast()

    return NextResponse.json(forecast)
  } catch (error: any) {
    console.error('Forecast API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

