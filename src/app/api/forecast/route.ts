import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ForecastEngine } from '@/lib/forecast-engine'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = session.user.organizationId
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : new Date()
    
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months default

    // Generate forecast
    const forecastEngine = new ForecastEngine(organizationId, startDate, endDate)
    const periods = await forecastEngine.generateForecast('monthly')

    // Get projects
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: {
          where: { status: { in: ['pending', 'invoiced'] } },
          orderBy: { expectedDate: 'asc' },
        },
        supplierClaims: {
          where: { status: { in: ['pending', 'invoiced'] } },
          orderBy: { expectedDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ periods, projects })
  } catch (error) {
    console.error('Error generating forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    )
  }
}

