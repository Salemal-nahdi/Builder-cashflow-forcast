import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  try {
    const scenarios = await prisma.scenario.findMany({
      where: { organizationId },
      include: {
        scenarioShifts: true,
        _count: {
          select: {
            scenarioShifts: true,
          },
        },
      },
      orderBy: [
        { isBase: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(scenarios)
  } catch (error) {
    console.error('Error fetching scenarios:', error)
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if scenario name already exists
    const existingScenario = await prisma.scenario.findFirst({
      where: {
        organizationId,
        name,
      },
    })

    if (existingScenario) {
      return NextResponse.json({ error: 'Scenario name already exists' }, { status: 400 })
    }

    const scenario = await prisma.scenario.create({
      data: {
        organizationId,
        name,
        description: description || null,
        isBase: false,
      },
    })

    return NextResponse.json(scenario)
  } catch (error) {
    console.error('Error creating scenario:', error)
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 })
  }
}
