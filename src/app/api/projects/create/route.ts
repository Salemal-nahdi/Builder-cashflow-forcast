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

    // Create project with milestones, supplier claims (costs), and cash events
    const project = await prisma.project.create({
      data: {
        organizationId,
        name,
        description: `Created via simple project builder`,
        status: 'active',
        contractValue,
        startDate: new Date(startDate),
        retentionPercentage: 5, // Default 5% retention
        
        // Create milestones
        milestones: {
          create: milestones.map((milestone: any, index: number) => {
            const milestoneAmount = (contractValue * milestone.percentage) / 100
            const retentionAmount = (milestoneAmount * 5) / 100 // 5% retention
            
            return {
              name: milestone.name,
              description: `Progress claim ${index + 1}`,
              status: 'pending',
              percentage: milestone.percentage,
              amount: milestoneAmount,
              retentionAmount,
              expectedDate: new Date(milestone.date),
              contractValue,
            }
          })
        },

        // Create cash events for milestones (income)
        cashEvents: {
          create: milestones.flatMap((milestone: any, milestoneIndex: number) => {
            const milestoneAmount = (contractValue * milestone.percentage) / 100
            const retentionAmount = (milestoneAmount * 5) / 100
            const paymentAmount = milestoneAmount - retentionAmount
            const milestoneDate = new Date(milestone.date)

            const events = [
              // Income event (progress claim payment)
              {
                organizationId,
                type: 'income' as const,
                amount: paymentAmount,
                scheduledDate: milestoneDate,
                sourceType: 'milestone',
                sourceId: `milestone-${milestoneIndex}`, // Will be updated after creation
              }
            ]

            // Add cost events for this milestone
            if (milestone.costs && milestone.costs.length > 0) {
              milestone.costs.forEach((cost: any) => {
                const costDate = addDays(milestoneDate, cost.paymentDaysOffset || 0)
                events.push({
                  organizationId,
                  type: 'outgo' as const,
                  amount: cost.amount,
                  scheduledDate: costDate,
                  sourceType: 'supplier_claim',
                  sourceId: `cost-${milestoneIndex}-${cost.id}`, // Will be updated after creation
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
              const milestoneDate = new Date(milestone.date)
              const costDate = addDays(milestoneDate, cost.paymentDaysOffset || 0)
              
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
        supplierClaims: true,
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

