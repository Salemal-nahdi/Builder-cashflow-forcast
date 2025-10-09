import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/get-org'

export const dynamic = 'force-dynamic'

// GET /api/projects - List all projects
export async function GET() {
  try {
    const organizationId = await getOrganizationId()

    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: {
          orderBy: { expectedDate: 'asc' }
        },
        costs: {
          orderBy: { expectedDate: 'asc' }
        },
        xeroMaps: {
          include: {
            trackingOption: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(projects)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: Request) {
  try {
    const organizationId = await getOrganizationId()
    const body = await request.json()

    const project = await prisma.project.create({
      data: {
        organizationId,
        name: body.name,
        contractValue: body.contractValue,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate)
      },
      include: {
        milestones: true,
        costs: true
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

