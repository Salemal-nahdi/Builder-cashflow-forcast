import { prisma } from './prisma'
import { addDays, addWeeks, addMonths, addQuarters, startOfMonth, endOfMonth, format } from 'date-fns'

export interface CashEvent {
  id: string
  type: 'income' | 'outgo'
  amount: number
  scheduledDate: Date
  sourceType: 'milestone' | 'supplier_claim' | 'material_order' | 'forecast_line'
  sourceId: string
  projectId?: string
  scenarioId?: string
  description?: string
}

export interface ForecastPeriod {
  startDate: Date
  endDate: Date
  income: number
  outgo: number
  net: number
  balance: number
  events: CashEvent[]
  retentionHold?: number
  retentionRelease?: number
  // Actuals data
  actualIncome?: number
  actualOutgo?: number
  actualNet?: number
  actualEvents?: CashEvent[]
  isHistorical?: boolean // true if this period is in the past
}

export class ForecastEngine {
  private organizationId: string
  private scenarioId?: string
  private startDate: Date
  private endDate: Date
  private basis: 'cash' | 'accrual'

  constructor(organizationId: string, startDate: Date, endDate: Date, scenarioId?: string, basis: 'cash' | 'accrual' = 'accrual') {
    this.organizationId = organizationId
    this.scenarioId = scenarioId
    this.startDate = startDate
    this.endDate = endDate
    this.basis = basis
  }

  async generateForecast(periodType: 'monthly' | 'weekly' = 'monthly'): Promise<ForecastPeriod[]> {
    // Get all forecast lines
    const forecastLines = await prisma.forecastLine.findMany({
      where: { organizationId: this.organizationId },
      include: { project: true },
    })

    // Get all milestones
    const milestones = await prisma.milestone.findMany({
      where: {
        project: { organizationId: this.organizationId },
        ...(this.scenarioId ? { cashEvents: { some: { scenarioId: this.scenarioId } } } : {}),
      },
      include: { project: true },
    })

    // Get all supplier claims
    const supplierClaims = await prisma.supplierClaim.findMany({
      where: {
        project: { organizationId: this.organizationId },
        ...(this.scenarioId ? { cashEvents: { some: { scenarioId: this.scenarioId } } } : {}),
      },
      include: { project: true },
    })

    // Get all material orders
    const materialOrders = await prisma.materialOrder.findMany({
      where: {
        project: { organizationId: this.organizationId },
        ...(this.scenarioId ? { cashEvents: { some: { scenarioId: this.scenarioId } } } : {}),
      },
      include: { project: true },
    })

    // Generate cash events
    const cashEvents: CashEvent[] = []

    // Generate events from forecast lines
    for (const line of forecastLines) {
      const events = this.generateForecastLineEvents(line)
      cashEvents.push(...events)
    }

    // Generate events from milestones (including retention)
    for (const milestone of milestones) {
      const events = this.generateMilestoneEvents(milestone)
      cashEvents.push(...events)
    }

    // Generate events from supplier claims
    for (const claim of supplierClaims) {
      const events = this.generateSupplierClaimEvents(claim)
      cashEvents.push(...events)
    }

    // Generate events from material orders
    for (const order of materialOrders) {
      const events = this.generateMaterialOrderEvents(order)
      cashEvents.push(...events)
    }

    // Apply scenario shifts if applicable
    if (this.scenarioId) {
      const shiftedEvents = await this.applyScenarioShifts(cashEvents)
      cashEvents.splice(0, cashEvents.length, ...shiftedEvents)
    }

    // Get actuals data
    const actualEvents = await this.getActualEvents()

    // Group events by period type
    const forecastPeriods = periodType === 'weekly' 
      ? this.groupEventsByWeek(cashEvents)
      : this.groupEventsByMonth(cashEvents)

    // Integrate actuals into forecast periods
    return this.integrateActuals(forecastPeriods, actualEvents)
  }

  private generateForecastLineEvents(forecastLine: any): CashEvent[] {
    const events: CashEvent[] = []
    let currentDate = new Date(forecastLine.startDate)
    let currentAmount = Number(forecastLine.baseAmount)

    while (currentDate <= this.endDate && (!forecastLine.endDate || currentDate <= forecastLine.endDate)) {
      // Apply inflation/escalation
      const monthsSinceStart = this.getMonthsDifference(forecastLine.startDate, currentDate)
      const adjustedAmount = this.applyInflation(currentAmount, monthsSinceStart, forecastLine.inflationRate, forecastLine.escalationRate)

      events.push({
        id: `${forecastLine.id}-${currentDate.getTime()}`,
        type: forecastLine.type as 'income' | 'outgo',
        amount: adjustedAmount,
        scheduledDate: new Date(currentDate),
        sourceType: 'forecast_line',
        sourceId: forecastLine.id,
        projectId: forecastLine.projectId,
        scenarioId: this.scenarioId,
        description: `${forecastLine.name} - ${format(currentDate, 'MMM yyyy')}`,
      })

      // Move to next occurrence
      currentDate = this.getNextOccurrence(currentDate, forecastLine.frequency)
    }

    return events
  }

  private generateMilestoneEvents(milestone: any): CashEvent[] {
    const events: CashEvent[] = []
    const amount = milestone.amount || (milestone.contractValue * (milestone.percentage || 0) / 100)
    const retentionPercentage = milestone.project?.retentionPercentage || 0
    const retentionAmount = amount * (retentionPercentage / 100)
    const netAmount = amount - retentionAmount

    // Main milestone payment (net of retention)
    events.push({
      id: `milestone-${milestone.id}`,
      type: 'income',
      amount: netAmount,
      scheduledDate: new Date(milestone.expectedDate),
      sourceType: 'milestone',
      sourceId: milestone.id,
      projectId: milestone.projectId,
      scenarioId: this.scenarioId,
      description: `${milestone.name} - ${milestone.project.name}`,
    })

    // Retention hold event (for tracking purposes)
    if (retentionAmount > 0) {
      events.push({
        id: `milestone-retention-hold-${milestone.id}`,
        type: 'income',
        amount: retentionAmount,
        scheduledDate: new Date(milestone.expectedDate),
        sourceType: 'milestone',
        sourceId: milestone.id,
        projectId: milestone.projectId,
        scenarioId: this.scenarioId,
        description: `${milestone.name} - Retention Hold`,
      })

      // Retention release (if applicable)
      const releaseDate = milestone.retentionReleaseDate || 
        addDays(new Date(milestone.expectedDate), milestone.project?.retentionReleaseDays || 84)
      
      events.push({
        id: `milestone-retention-release-${milestone.id}`,
        type: 'income',
        amount: retentionAmount,
        scheduledDate: releaseDate,
        sourceType: 'milestone',
        sourceId: milestone.id,
        projectId: milestone.projectId,
        scenarioId: this.scenarioId,
        description: `${milestone.name} - Retention Release`,
      })
    }

    return events
  }

  private generateSupplierClaimEvents(claim: any): CashEvent[] {
    return [{
      id: `supplier-claim-${claim.id}`,
      type: 'outgo',
      amount: claim.amount,
      scheduledDate: new Date(claim.expectedDate),
      sourceType: 'supplier_claim',
      sourceId: claim.id,
      projectId: claim.projectId,
      scenarioId: this.scenarioId,
      description: `${claim.supplierName} - ${claim.project.name}`,
    }]
  }

  private generateMaterialOrderEvents(order: any): CashEvent[] {
    return [{
      id: `material-order-${order.id}`,
      type: 'outgo',
      amount: order.amount,
      scheduledDate: new Date(order.expectedDate),
      sourceType: 'material_order',
      sourceId: order.id,
      projectId: order.projectId,
      scenarioId: this.scenarioId,
      description: `${order.supplierName} - ${order.project.name}`,
    }]
  }

  private async applyScenarioShifts(events: CashEvent[]): Promise<CashEvent[]> {
    if (!this.scenarioId) return events

    const shifts = await prisma.scenarioShift.findMany({
      where: { scenarioId: this.scenarioId },
    })

    return events.map(event => {
      const shift = shifts.find(s => s.entityId === event.sourceId && s.entityType === event.sourceType)
      if (shift) {
        return {
          ...event,
          scheduledDate: addDays(event.scheduledDate, shift.daysShift),
          amount: shift.amountShift ? event.amount + Number(shift.amountShift) : event.amount,
        }
      }
      return event
    })
  }

  private async getActualEvents(): Promise<CashEvent[]> {
    const actualEvents = await prisma.actualEvent.findMany({
      where: {
        organizationId: this.organizationId,
        basis: this.basis,
        occurredAt: {
          gte: this.startDate,
          lte: this.endDate,
        },
      },
      orderBy: { occurredAt: 'asc' },
    })

    return actualEvents.map(event => ({
      id: event.id,
      type: event.type as 'income' | 'outgo',
      amount: Number(event.amount),
      scheduledDate: event.occurredAt,
      sourceType: event.sourceType as any,
      sourceId: event.sourceId,
      projectId: event.projectId || undefined,
      description: event.description || undefined,
    }))
  }

  private integrateActuals(forecastPeriods: ForecastPeriod[], actualEvents: CashEvent[]): ForecastPeriod[] {
    const today = new Date()
    
    return forecastPeriods.map(period => {
      const isHistorical = period.endDate < today
      
      if (!isHistorical) {
        // Future period - no actuals
        return {
          ...period,
          isHistorical: false,
        }
      }

      // Historical period - include actuals
      const periodActuals = actualEvents.filter(event => 
        event.scheduledDate >= period.startDate && 
        event.scheduledDate <= period.endDate
      )

      const actualIncome = periodActuals
        .filter(event => event.type === 'income')
        .reduce((sum, event) => sum + event.amount, 0)

      const actualOutgo = periodActuals
        .filter(event => event.type === 'outgo')
        .reduce((sum, event) => sum + event.amount, 0)

      const actualNet = actualIncome - actualOutgo

      return {
        ...period,
        actualIncome,
        actualOutgo,
        actualNet,
        actualEvents: periodActuals,
        isHistorical: true,
      }
    })
  }

  private groupEventsByMonth(events: CashEvent[]): ForecastPeriod[] {
    const periods: ForecastPeriod[] = []
    let currentDate = startOfMonth(this.startDate)
    let runningBalance = 0 // This would come from current bank balance

    while (currentDate <= this.endDate) {
      const periodEnd = endOfMonth(currentDate)
      const periodEvents = events.filter(event => 
        event.scheduledDate >= currentDate && event.scheduledDate <= periodEnd
      )

      const income = periodEvents
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0)

      const outgo = periodEvents
        .filter(e => e.type === 'outgo')
        .reduce((sum, e) => sum + e.amount, 0)

      const net = income - outgo
      runningBalance += net

      // Calculate retention amounts for this period
      const retentionEvents = periodEvents.filter(e => e.description?.includes('Retention'))
      const retentionHold = retentionEvents
        .filter(e => e.type === 'income' && e.description?.includes('Hold'))
        .reduce((sum, e) => sum + e.amount, 0)
      const retentionRelease = retentionEvents
        .filter(e => e.type === 'income' && e.description?.includes('Release'))
        .reduce((sum, e) => sum + e.amount, 0)

      periods.push({
        startDate: new Date(currentDate),
        endDate: new Date(periodEnd),
        income,
        outgo,
        net,
        balance: runningBalance,
        events: periodEvents,
        retentionHold,
        retentionRelease,
      })

      currentDate = addMonths(currentDate, 1)
    }

    return periods
  }

  private groupEventsByWeek(events: CashEvent[]): ForecastPeriod[] {
    const periods: ForecastPeriod[] = []
    let currentDate = new Date(this.startDate)
    // Start from the beginning of the week
    currentDate.setDate(currentDate.getDate() - currentDate.getDay())
    let runningBalance = 0 // This would come from current bank balance

    while (currentDate <= this.endDate) {
      const periodEnd = addDays(currentDate, 6)
      const periodEvents = events.filter(event => 
        event.scheduledDate >= currentDate && event.scheduledDate <= periodEnd
      )

      const income = periodEvents
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0)

      const outgo = periodEvents
        .filter(e => e.type === 'outgo')
        .reduce((sum, e) => sum + e.amount, 0)

      const net = income - outgo
      runningBalance += net

      // Calculate retention amounts for this period
      const retentionEvents = periodEvents.filter(e => e.description?.includes('Retention'))
      const retentionHold = retentionEvents
        .filter(e => e.type === 'income' && e.description?.includes('Hold'))
        .reduce((sum, e) => sum + e.amount, 0)
      const retentionRelease = retentionEvents
        .filter(e => e.type === 'income' && e.description?.includes('Release'))
        .reduce((sum, e) => sum + e.amount, 0)

      periods.push({
        startDate: new Date(currentDate),
        endDate: new Date(periodEnd),
        income,
        outgo,
        net,
        balance: runningBalance,
        events: periodEvents,
        retentionHold,
        retentionRelease,
      })

      currentDate = addDays(currentDate, 7)
    }

    return periods
  }

  private getNextOccurrence(date: Date, frequency: string): Date {
    switch (frequency) {
      case 'weekly':
        return addWeeks(date, 1)
      case 'monthly':
        return addMonths(date, 1)
      case 'quarterly':
        return addQuarters(date, 1)
      case 'once':
        return addDays(date, 365 * 10) // Far future to stop iteration
      default:
        return addMonths(date, 1)
    }
  }

  private getMonthsDifference(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
           (endDate.getMonth() - startDate.getMonth())
  }

  private applyInflation(baseAmount: number, monthsSinceStart: number, inflationRate?: number, escalationRate?: number): number {
    if (!inflationRate && !escalationRate) return baseAmount

    const annualRate = (inflationRate || 0) + (escalationRate || 0)
    const monthlyRate = annualRate / 12
    const multiplier = Math.pow(1 + monthlyRate, monthsSinceStart)

    return baseAmount * multiplier
  }

  async saveCashEvents(events: CashEvent[]): Promise<void> {
    // Delete existing events for this scenario
    await prisma.cashEvent.deleteMany({
      where: {
        organizationId: this.organizationId,
        scenarioId: this.scenarioId || null,
      },
    })

    // Insert new events
    await prisma.cashEvent.createMany({
      data: events.map(event => ({
        organizationId: this.organizationId,
        type: event.type,
        amount: event.amount,
        scheduledDate: event.scheduledDate,
        sourceType: event.sourceType,
        sourceId: event.sourceId,
        projectId: event.projectId,
        scenarioId: event.scenarioId,
        status: 'scheduled',
      })),
    })
  }

  async getCashflowSummary(): Promise<{
    totalIncome: number
    totalOutgo: number
    netCashflow: number
    lowestBalance: number
    lowestBalanceDate: Date | null
    negativeBalanceDays: number
  }> {
    const periods = await this.generateForecast()
    
    const totalIncome = periods.reduce((sum, p) => sum + p.income, 0)
    const totalOutgo = periods.reduce((sum, p) => sum + p.outgo, 0)
    const netCashflow = totalIncome - totalOutgo

    let lowestBalance = Infinity
    let lowestBalanceDate: Date | null = null
    let negativeBalanceDays = 0

    for (const period of periods) {
      if (period.balance < lowestBalance) {
        lowestBalance = period.balance
        lowestBalanceDate = period.startDate
      }
      if (period.balance < 0) {
        negativeBalanceDays++
      }
    }

    return {
      totalIncome,
      totalOutgo,
      netCashflow,
      lowestBalance: lowestBalance === Infinity ? 0 : lowestBalance,
      lowestBalanceDate,
      negativeBalanceDays,
    }
  }
}
