import { prisma } from './prisma'
import { addDays, format } from 'date-fns'

export interface PaymentSuggestion {
  id: string
  type: 'delay_payment' | 'advance_payment' | 'split_payment'
  entityType: 'milestone' | 'supplier_claim' | 'material_order' | 'forecast_line'
  entityId: string
  entityName: string
  currentDate: Date
  suggestedDate: Date
  amount: number
  reason: string
  impact: {
    cashFlowImprovement: number
    riskLevel: 'low' | 'medium' | 'high'
    vendorImpact: string
  }
}

export interface CashGap {
  startDate: Date
  endDate: Date
  lowestBalance: number
  gapAmount: number
  events: Array<{
    id: string
    type: 'income' | 'outgo'
    amount: number
    date: Date
    description: string
  }>
}

export class PaymentOptimizer {
  private organizationId: string
  private currentBalance: number
  private minimumBalance: number

  constructor(organizationId: string, currentBalance: number, minimumBalance: number = 50000) {
    this.organizationId = organizationId
    this.currentBalance = currentBalance
    this.minimumBalance = minimumBalance
  }

  async generateSuggestions(startDate: Date, endDate: Date): Promise<PaymentSuggestion[]> {
    const suggestions: PaymentSuggestion[] = []

    // Get upcoming cash events
    const cashEvents = await prisma.cashEvent.findMany({
      where: {
        organizationId: this.organizationId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'scheduled',
      },
      include: {
        project: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    })

    // Find cash flow gaps
    const gaps = this.findCashGaps(cashEvents, startDate, endDate)

    // Generate suggestions for each gap
    for (const gap of gaps) {
      const gapSuggestions = await this.generateGapSuggestions(gap, cashEvents)
      suggestions.push(...gapSuggestions)
    }

    return suggestions.sort((a, b) => b.impact.cashFlowImprovement - a.impact.cashFlowImprovement)
  }

  private findCashGaps(events: any[], startDate: Date, endDate: Date): CashGap[] {
    const gaps: CashGap[] = []
    let runningBalance = this.currentBalance
    let gapStart: Date | null = null
    let lowestBalance = runningBalance

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    )

    for (const event of sortedEvents) {
      const eventDate = new Date(event.scheduledDate)
      const amount = Number(event.amount)
      
      if (event.type === 'income') {
        runningBalance += amount
      } else {
        runningBalance -= amount
      }

      // Check if we're in a gap
      if (runningBalance < this.minimumBalance) {
        if (!gapStart) {
          gapStart = eventDate
          lowestBalance = runningBalance
        } else {
          lowestBalance = Math.min(lowestBalance, runningBalance)
        }
      } else if (gapStart) {
        // End of gap
        gaps.push({
          startDate: gapStart,
          endDate: eventDate,
          lowestBalance,
          gapAmount: this.minimumBalance - lowestBalance,
          events: sortedEvents.filter(e => {
            const eDate = new Date(e.scheduledDate)
            return eDate >= gapStart! && eDate <= eventDate
          }).map(e => ({
            id: e.id,
            type: e.type,
            amount: Number(e.amount),
            date: new Date(e.scheduledDate),
            description: e.description || `${e.sourceType} - ${e.project?.name || 'Unknown'}`,
          })),
        })
        gapStart = null
        lowestBalance = runningBalance
      }
    }

    // Handle gap that extends to end of period
    if (gapStart) {
      gaps.push({
        startDate: gapStart,
        endDate,
        lowestBalance,
        gapAmount: this.minimumBalance - lowestBalance,
        events: sortedEvents.filter(e => {
          const eDate = new Date(e.scheduledDate)
          return eDate >= gapStart!
        }).map(e => ({
          id: e.id,
          type: e.type,
          amount: Number(e.amount),
          date: new Date(e.scheduledDate),
          description: e.description || `${e.sourceType} - ${e.project?.name || 'Unknown'}`,
        })),
      })
    }

    return gaps
  }

  private async generateGapSuggestions(gap: CashGap, allEvents: any[]): Promise<PaymentSuggestion[]> {
    const suggestions: PaymentSuggestion[] = []

    // Find outgo events in the gap that could be delayed
    const outgoEvents = gap.events.filter(e => e.type === 'outgo')
    
    for (const event of outgoEvents) {
      const dbEvent = allEvents.find(e => e.id === event.id)
      if (!dbEvent) continue

      // Check if this is a supplier claim or material order that could be delayed
      if (dbEvent.sourceType === 'supplier_claim' || dbEvent.sourceType === 'material_order') {
        const suggestedDate = addDays(event.date, 30) // Suggest 30-day delay
        
        suggestions.push({
          id: `delay-${event.id}`,
          type: 'delay_payment',
          entityType: dbEvent.sourceType,
          entityId: dbEvent.sourceId,
          entityName: dbEvent.description || 'Unknown',
          currentDate: event.date,
          suggestedDate,
          amount: event.amount,
          reason: `Delay payment to avoid cash flow gap of $${gap.gapAmount.toLocaleString()}`,
          impact: {
            cashFlowImprovement: event.amount,
            riskLevel: this.assessRiskLevel(dbEvent.sourceType, 30),
            vendorImpact: 'May require vendor communication and approval',
          },
        })
      }
    }

    // Find income events that could be advanced
    const incomeEvents = gap.events.filter(e => e.type === 'income')
    
    for (const event of incomeEvents) {
      const dbEvent = allEvents.find(e => e.id === event.id)
      if (!dbEvent) continue

      // Check if this is a milestone that could be invoiced earlier
      if (dbEvent.sourceType === 'milestone') {
        const suggestedDate = addDays(event.date, -14) // Suggest 14-day advance
        
        suggestions.push({
          id: `advance-${event.id}`,
          type: 'advance_payment',
          entityType: dbEvent.sourceType,
          entityId: dbEvent.sourceId,
          entityName: dbEvent.description || 'Unknown',
          currentDate: event.date,
          suggestedDate,
          amount: event.amount,
          reason: `Advance payment to improve cash flow during gap period`,
          impact: {
            cashFlowImprovement: event.amount,
            riskLevel: 'low',
            vendorImpact: 'Requires client approval and milestone completion',
          },
        })
      }
    }

    return suggestions
  }

  private assessRiskLevel(entityType: string, delayDays: number): 'low' | 'medium' | 'high' {
    if (entityType === 'milestone') return 'low'
    if (entityType === 'supplier_claim' && delayDays <= 14) return 'low'
    if (entityType === 'supplier_claim' && delayDays <= 30) return 'medium'
    if (entityType === 'material_order' && delayDays <= 7) return 'low'
    if (entityType === 'material_order' && delayDays <= 14) return 'medium'
    return 'high'
  }

  async applySuggestion(suggestion: PaymentSuggestion): Promise<boolean> {
    try {
      // Update the cash event with the new date
      await prisma.cashEvent.update({
        where: { id: suggestion.entityId },
        data: {
          scheduledDate: suggestion.suggestedDate,
        },
      })

      // Log the change
      console.log(`Applied payment optimization: ${suggestion.entityName} moved from ${format(suggestion.currentDate, 'MMM dd, yyyy')} to ${format(suggestion.suggestedDate, 'MMM dd, yyyy')}`)
      
      return true
    } catch (error) {
      console.error('Failed to apply payment suggestion:', error)
      return false
    }
  }

  async getCashFlowProjection(startDate: Date, endDate: Date): Promise<{
    periods: Array<{
      date: Date
      balance: number
      income: number
      outgo: number
      net: number
    }>
    lowestBalance: number
    lowestBalanceDate: Date | null
    negativeBalanceDays: number
  }> {
    const events = await prisma.cashEvent.findMany({
      where: {
        organizationId: this.organizationId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'scheduled',
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    })

    const periods: Array<{
      date: Date
      balance: number
      income: number
      outgo: number
      net: number
    }> = []

    let runningBalance = this.currentBalance
    let lowestBalance = runningBalance
    let lowestBalanceDate: Date | null = null
    let negativeBalanceDays = 0

    // Group events by day
    const eventsByDay = new Map<string, any[]>()
    for (const event of events) {
      const dateKey = format(new Date(event.scheduledDate), 'yyyy-MM-dd')
      if (!eventsByDay.has(dateKey)) {
        eventsByDay.set(dateKey, [])
      }
      eventsByDay.get(dateKey)!.push(event)
    }

    // Process each day
    for (const [dateKey, dayEvents] of Array.from(eventsByDay)) {
      const date = new Date(dateKey)
      const income = dayEvents
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + Number(e.amount), 0)
      const outgo = dayEvents
        .filter(e => e.type === 'outgo')
        .reduce((sum, e) => sum + Number(e.amount), 0)
      const net = income - outgo

      runningBalance += net

      if (runningBalance < lowestBalance) {
        lowestBalance = runningBalance
        lowestBalanceDate = date
      }

      if (runningBalance < 0) {
        negativeBalanceDays++
      }

      periods.push({
        date,
        balance: runningBalance,
        income,
        outgo,
        net,
      })
    }

    return {
      periods,
      lowestBalance,
      lowestBalanceDate,
      negativeBalanceDays,
    }
  }
}
