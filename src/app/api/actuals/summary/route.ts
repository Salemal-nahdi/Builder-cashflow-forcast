import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const basis = searchParams.get('basis') as 'cash' | 'accrual' || 'accrual'
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') as 'month' | 'week' | 'project' || 'month'

    // Default to last 6 months if no dates provided
    const defaultStartDate = startOfMonth(addMonths(new Date(), -6))
    const defaultEndDate = endOfMonth(new Date())

    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate
    const queryEndDate = endDate ? new Date(endDate) : defaultEndDate

    // Build where clause
    const whereClause: any = {
      organizationId: session.user.organizationId,
      basis,
      occurredAt: {
        gte: queryStartDate,
        lte: queryEndDate,
      },
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    // Get actual events
    const actualEvents = await prisma.actualEvent.findMany({
      where: whereClause,
      include: {
        project: true,
      },
      orderBy: {
        occurredAt: 'asc',
      },
    })

    // Group data based on groupBy parameter
    let summary: any = {}

    if (groupBy === 'month') {
      summary = groupByMonth(actualEvents)
    } else if (groupBy === 'week') {
      summary = groupByWeek(actualEvents)
    } else if (groupBy === 'project') {
      summary = groupByProject(actualEvents)
    }

    // Calculate totals
    const totals = {
      totalIncome: actualEvents
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      totalOutgo: actualEvents
        .filter(e => e.type === 'outgo')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      netCashflow: 0,
      eventCount: actualEvents.length,
    }

    totals.netCashflow = totals.totalIncome - totals.totalOutgo

    return NextResponse.json({
      summary,
      totals,
      basis,
      period: {
        startDate: queryStartDate,
        endDate: queryEndDate,
      },
      groupBy,
    })
  } catch (error) {
    console.error('Error fetching actuals summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch actuals summary' },
      { status: 500 }
    )
  }
}

function groupByMonth(events: any[]): any {
  const grouped: { [key: string]: any } = {}

  for (const event of events) {
    const monthKey = format(event.occurredAt, 'yyyy-MM')
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        period: monthKey,
        income: 0,
        outgo: 0,
        net: 0,
        events: [],
      }
    }

    grouped[monthKey].events.push(event)
    
    if (event.type === 'income') {
      grouped[monthKey].income += Number(event.amount)
    } else {
      grouped[monthKey].outgo += Number(event.amount)
    }
    
    grouped[monthKey].net = grouped[monthKey].income - grouped[monthKey].outgo
  }

  return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period))
}

function groupByWeek(events: any[]): any {
  const grouped: { [key: string]: any } = {}

  for (const event of events) {
    const weekKey = format(event.occurredAt, 'yyyy-\'W\'ww')
    
    if (!grouped[weekKey]) {
      grouped[weekKey] = {
        period: weekKey,
        income: 0,
        outgo: 0,
        net: 0,
        events: [],
      }
    }

    grouped[weekKey].events.push(event)
    
    if (event.type === 'income') {
      grouped[weekKey].income += Number(event.amount)
    } else {
      grouped[weekKey].outgo += Number(event.amount)
    }
    
    grouped[weekKey].net = grouped[weekKey].income - grouped[weekKey].outgo
  }

  return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period))
}

function groupByProject(events: any[]): any {
  const grouped: { [key: string]: any } = {}

  for (const event of events) {
    const projectKey = event.projectId || 'unmapped'
    const projectName = event.project?.name || 'Unmapped'
    
    if (!grouped[projectKey]) {
      grouped[projectKey] = {
        projectId: projectKey,
        projectName,
        income: 0,
        outgo: 0,
        net: 0,
        events: [],
      }
    }

    grouped[projectKey].events.push(event)
    
    if (event.type === 'income') {
      grouped[projectKey].income += Number(event.amount)
    } else {
      grouped[projectKey].outgo += Number(event.amount)
    }
    
    grouped[projectKey].net = grouped[projectKey].income - grouped[projectKey].outgo
  }

  return Object.values(grouped).sort((a: any, b: any) => a.projectName.localeCompare(b.projectName))
}
