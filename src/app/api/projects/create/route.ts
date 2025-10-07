import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, contractValue, startDate, milestones } = body

    if (!name || !contractValue || !startDate || !milestones) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate milestones percentages add up to 100
    const totalPercentage = milestones.reduce((sum: number, m: any) => sum + (m.percentage || 0), 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json({ 
        error: `Milestone percentages must add up to 100% (current: ${totalPercentage}%)` 
      }, { status: 400 })
    }

    const organizationId = session.user.organizationId

    // Create project with milestones and cash events
    const project = await prisma.project.create({
      data: {
        organizationId,
        name,
        description: `Created: ${new Date().toLocaleDateString()}`,
        status: 'active',
        contractValue,
        startDate: new Date(startDate),
        retentionPercentage: 0, // No retention by default (keep it simple)
        
        // Create milestones
        milestones: {
          create: milestones.map((milestone: any) => {
            const milestoneAmount = (contractValue * milestone.percentage) / 100
            
            return {
              name: milestone.name,
              description: `${milestone.percentage}% of contract`,
              status: 'pending',
              percentage: milestone.percentage,
              amount: milestoneAmount,
              retentionAmount: 0,
              expectedDate: new Date(milestone.date),
              contractValue,
            }
          })
        },

        // Create cash events (income + costs)
        cashEvents: {
          create: milestones.flatMap((milestone: any) => {
            const milestoneAmount = (contractValue * milestone.percentage) / 100
            const milestoneDate = new Date(milestone.date)
            
            // Income event
            const events: any[] = [{
              organizationId,
              type: 'income',
              amount: milestoneAmount,
              scheduledDate: milestoneDate,
              sourceType: 'milestone',
              sourceId: 'temp',
            }]
            
            // Add cost events if any
            if (milestone.costs && milestone.costs.length > 0) {
              milestone.costs.forEach((cost: any) => {
                const costDate = addDays(milestoneDate, cost.daysAfter || 0)
                events.push({
                  organizationId,
                  type: 'outgo',
                  amount: cost.amount,
                  scheduledDate: costDate,
                  sourceType: 'supplier_claim',
                  sourceId: 'temp',
                })
              })
            }
            
            return events
          })
        },

        // Create supplier claims for costs
        supplierClaims: {
          create: milestones.flatMap((milestone: any) => {
            if (!milestone.costs || milestone.costs.length === 0) return []
            
            return milestone.costs.map((cost: any) => {
              const costDate = addDays(new Date(milestone.date), cost.daysAfter || 0)
              return {
                supplierName: cost.description || 'Supplier',
                description: `Cost for ${milestone.name}`,
                amount: cost.amount,
                status: 'pending' as const,
                expectedDate: costDate,
              }
            })
          })
        },
      },
      include: {
        milestones: true,
        cashEvents: true,
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
