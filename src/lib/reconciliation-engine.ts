import { prisma } from './prisma'
import { differenceInDays, differenceInCalendarDays } from 'date-fns'

export interface VarianceMatch {
  id: string
  cashEventId: string
  actualEventId?: string
  xeroTransactionId?: string // Keep for backward compatibility
  xeroTransactionType?: string
  amountVariance: number
  timingVariance: number
  confidenceScore: number
  status: 'matched' | 'disputed' | 'resolved'
  projectId?: string
  cashEvent?: {
    id: string
    amount: number
    scheduledDate: Date
    sourceType: string
    sourceId: string
    project?: {
      id: string
      name: string
    }
  }
}

export interface ReconciliationResult {
  totalMatches: number
  highConfidenceMatches: number
  mediumConfidenceMatches: number
  lowConfidenceMatches: number
  unmatchedForecasts: number
  unmatchedActuals: number
  averageAmountVariance: number
  averageTimingVariance: number
}

export class ReconciliationEngine {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  async reconcileForecastWithActuals(basis: 'cash' | 'accrual' = 'accrual'): Promise<ReconciliationResult> {
    // Get all cash events that haven't been matched yet
    const unmatchedCashEvents = await prisma.cashEvent.findMany({
      where: {
        organizationId: this.organizationId,
        status: 'scheduled',
        varianceMatches: {
          none: {},
        },
      },
      include: {
        project: true,
      },
    })

    // Get all actual events that haven't been matched yet
    const unmatchedActualEvents = await prisma.actualEvent.findMany({
      where: {
        organizationId: this.organizationId,
        basis,
        varianceMatches: {
          none: {},
        },
      },
      include: {
        project: true,
      },
    })

    const matches: VarianceMatch[] = []
    const matchedCashEventIds = new Set<string>()
    const matchedActualEventIds = new Set<string>()

    // Match milestones with actual income events
    const milestoneMatches = await this.matchMilestonesWithActuals(
      unmatchedCashEvents.filter(e => e.sourceType === 'milestone'),
      unmatchedActualEvents.filter(a => a.type === 'income')
    )
    matches.push(...milestoneMatches)
    milestoneMatches.forEach(m => {
      matchedCashEventIds.add(m.cashEventId)
      matchedActualEventIds.add(m.actualEventId!)
    })

    // Match supplier claims with actual outgo events
    const claimMatches = await this.matchClaimsWithActuals(
      unmatchedCashEvents.filter(e => e.sourceType === 'supplier_claim'),
      unmatchedActualEvents.filter(a => a.type === 'outgo')
    )
    matches.push(...claimMatches)
    claimMatches.forEach(m => {
      matchedCashEventIds.add(m.cashEventId)
      matchedActualEventIds.add(m.actualEventId!)
    })

    // Match material orders with actual outgo events
    const orderMatches = await this.matchOrdersWithActuals(
      unmatchedCashEvents.filter(e => e.sourceType === 'material_order'),
      unmatchedActualEvents.filter(a => a.type === 'outgo')
    )
    matches.push(...orderMatches)
    orderMatches.forEach(m => {
      matchedCashEventIds.add(m.cashEventId)
      matchedActualEventIds.add(m.actualEventId!)
    })

    // Save matches to database
    await this.saveVarianceMatches(matches)

    // Calculate reconciliation results
    const result = await this.calculateReconciliationResults(matches)

    return result
  }

  private async getUnmatchedXeroTransactions() {
    // This would typically query Xero API for recent transactions
    // For now, we'll return mock data
    return [
      {
        id: 'xero-invoice-1',
        type: 'invoice',
        amount: 67500,
        date: new Date('2024-02-15'),
        contact: 'Smith Family',
        projectId: 'project-1',
      },
      {
        id: 'xero-bill-1',
        type: 'bill',
        amount: 15000,
        date: new Date('2024-02-10'),
        contact: 'Concrete Supplies',
        projectId: 'project-1',
      },
    ]
  }

  private async matchMilestonesWithInvoices(
    cashEvents: any[],
    xeroTransactions: any[]
  ): Promise<VarianceMatch[]> {
    const matches: VarianceMatch[] = []

    for (const cashEvent of cashEvents) {
      let bestMatch: any = null
      let bestScore = 0

      for (const transaction of xeroTransactions) {
        const score = this.calculateMatchScore(cashEvent, transaction)
        if (score > bestScore && score > 0.5) { // Minimum confidence threshold
          bestMatch = transaction
          bestScore = score
        }
      }

      if (bestMatch) {
        const match = this.createVarianceMatch(cashEvent, bestMatch, bestScore)
        matches.push(match)
      }
    }

    return matches
  }

  private async matchClaimsWithBills(
    cashEvents: any[],
    xeroTransactions: any[]
  ): Promise<VarianceMatch[]> {
    const matches: VarianceMatch[] = []

    for (const cashEvent of cashEvents) {
      let bestMatch: any = null
      let bestScore = 0

      for (const transaction of xeroTransactions) {
        const score = this.calculateMatchScore(cashEvent, transaction)
        if (score > bestScore && score > 0.5) {
          bestMatch = transaction
          bestScore = score
        }
      }

      if (bestMatch) {
        const match = this.createVarianceMatch(cashEvent, bestMatch, bestScore)
        matches.push(match)
      }
    }

    return matches
  }

  private async matchOrdersWithBills(
    cashEvents: any[],
    xeroTransactions: any[]
  ): Promise<VarianceMatch[]> {
    const matches: VarianceMatch[] = []

    for (const cashEvent of cashEvents) {
      let bestMatch: any = null
      let bestScore = 0

      for (const transaction of xeroTransactions) {
        const score = this.calculateMatchScore(cashEvent, transaction)
        if (score > bestScore && score > 0.5) {
          bestMatch = transaction
          bestScore = score
        }
      }

      if (bestMatch) {
        const match = this.createVarianceMatch(cashEvent, bestMatch, bestScore)
        matches.push(match)
      }
    }

    return matches
  }

  private calculateMatchScore(cashEvent: any, transaction: any): number {
    let score = 0

    // Amount similarity (40% weight)
    const amountDifference = Math.abs(cashEvent.amount - transaction.amount)
    const amountSimilarity = Math.max(0, 1 - (amountDifference / Math.max(cashEvent.amount, transaction.amount)))
    score += amountSimilarity * 0.4

    // Date proximity (30% weight)
    const daysDifference = Math.abs(differenceInDays(cashEvent.scheduledDate, transaction.date))
    const dateSimilarity = Math.max(0, 1 - (daysDifference / 30)) // 30 days tolerance
    score += dateSimilarity * 0.3

    // Project matching (20% weight)
    if (cashEvent.projectId === transaction.projectId) {
      score += 0.2
    }

    // Type matching (10% weight)
    const typeMatches = (
      (cashEvent.sourceType === 'milestone' && transaction.type === 'invoice') ||
      (cashEvent.sourceType === 'supplier_claim' && transaction.type === 'bill') ||
      (cashEvent.sourceType === 'material_order' && transaction.type === 'bill')
    )
    if (typeMatches) {
      score += 0.1
    }

    return Math.min(1, score)
  }

  private createVarianceMatch(cashEvent: any, transaction: any, confidenceScore: number): VarianceMatch {
    const amountVariance = transaction.amount - cashEvent.amount
    const timingVariance = differenceInCalendarDays(transaction.date, cashEvent.scheduledDate)

    return {
      id: `match-${cashEvent.id}-${transaction.id}`,
      cashEventId: cashEvent.id,
      xeroTransactionId: transaction.id,
      xeroTransactionType: transaction.type,
      amountVariance,
      timingVariance,
      confidenceScore,
      status: 'matched',
      projectId: cashEvent.projectId,
    }
  }

  private async saveVarianceMatches(matches: VarianceMatch[]): Promise<void> {
    for (const match of matches) {
      await prisma.varianceMatch.upsert({
        where: {
          cashEventId_xeroTransactionId: {
            cashEventId: match.cashEventId,
            xeroTransactionId: match.xeroTransactionId,
          },
        },
        update: {
          amountVariance: match.amountVariance,
          timingVariance: match.timingVariance,
          confidenceScore: match.confidenceScore,
          status: match.status,
        },
        create: {
          organizationId: this.organizationId,
          cashEventId: match.cashEventId,
          xeroTransactionId: match.xeroTransactionId,
          xeroTransactionType: match.xeroTransactionType,
          amountVariance: match.amountVariance,
          timingVariance: match.timingVariance,
          confidenceScore: match.confidenceScore,
          status: match.status,
          projectId: match.projectId,
        },
      })

      // Update cash event status to 'actual'
      await prisma.cashEvent.update({
        where: { id: match.cashEventId },
        data: { 
          status: 'actual',
          actualDate: new Date(), // This would come from the Xero transaction
        },
      })
    }
  }

  private async calculateReconciliationResults(matches: VarianceMatch[]): Promise<ReconciliationResult> {
    const totalMatches = matches.length
    const highConfidenceMatches = matches.filter(m => m.confidenceScore >= 0.8).length
    const mediumConfidenceMatches = matches.filter(m => m.confidenceScore >= 0.6 && m.confidenceScore < 0.8).length
    const lowConfidenceMatches = matches.filter(m => m.confidenceScore < 0.6).length

    // Get unmatched counts
    const unmatchedForecasts = await prisma.cashEvent.count({
      where: {
        organizationId: this.organizationId,
        status: 'scheduled',
        varianceMatches: {
          none: {},
        },
      },
    })

    const unmatchedActuals = 0 // This would be calculated from Xero transactions

    const averageAmountVariance = matches.length > 0 
      ? matches.reduce((sum, m) => sum + m.amountVariance, 0) / matches.length 
      : 0

    const averageTimingVariance = matches.length > 0 
      ? matches.reduce((sum, m) => sum + m.timingVariance, 0) / matches.length 
      : 0

    return {
      totalMatches,
      highConfidenceMatches,
      mediumConfidenceMatches,
      lowConfidenceMatches,
      unmatchedForecasts,
      unmatchedActuals,
      averageAmountVariance,
      averageTimingVariance,
    }
  }

  async getVarianceMatches(filters?: {
    projectId?: string
    confidenceThreshold?: number
    status?: string
  }): Promise<VarianceMatch[]> {
    const where: any = {
      organizationId: this.organizationId,
    }

    if (filters?.projectId) {
      where.projectId = filters.projectId
    }

    if (filters?.confidenceThreshold) {
      where.confidenceScore = {
        gte: filters.confidenceThreshold,
      }
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const matches = await prisma.varianceMatch.findMany({
      where,
      include: {
        cashEvent: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return matches.map(match => ({
      id: match.id,
      cashEventId: match.cashEventId,
      xeroTransactionId: match.xeroTransactionId,
      xeroTransactionType: match.xeroTransactionType,
      amountVariance: Number(match.amountVariance),
      timingVariance: match.timingVariance,
      confidenceScore: Number(match.confidenceScore),
      status: match.status as 'matched' | 'disputed' | 'resolved',
      projectId: match.projectId || undefined,
    }))
  }

  async updateVarianceMatchStatus(
    matchId: string, 
    status: 'matched' | 'disputed' | 'resolved'
  ): Promise<void> {
    await prisma.varianceMatch.update({
      where: { id: matchId },
      data: { status },
    })
  }

  // New methods for matching with ActualEvents
  private async matchMilestonesWithActuals(
    cashEvents: any[],
    actualEvents: any[]
  ): Promise<VarianceMatch[]> {
    const matches: VarianceMatch[] = []

    for (const cashEvent of cashEvents) {
      let bestMatch: any = null
      let bestScore = 0

      for (const actualEvent of actualEvents) {
        const score = this.calculateMatchScore(cashEvent, actualEvent)
        
        if (score > bestScore && score > 0.3) { // Minimum confidence threshold
          bestMatch = actualEvent
          bestScore = score
        }
      }

      if (bestMatch) {
        const match = await this.createActualVarianceMatch(cashEvent, bestMatch)
        matches.push(match)
      }
    }

    return matches
  }

  private async matchClaimsWithActuals(
    cashEvents: any[],
    actualEvents: any[]
  ): Promise<VarianceMatch[]> {
    const matches: VarianceMatch[] = []

    for (const cashEvent of cashEvents) {
      let bestMatch: any = null
      let bestScore = 0

      for (const actualEvent of actualEvents) {
        const score = this.calculateMatchScore(cashEvent, actualEvent)
        
        if (score > bestScore && score > 0.3) {
          bestMatch = actualEvent
          bestScore = score
        }
      }

      if (bestMatch) {
        const match = await this.createActualVarianceMatch(cashEvent, bestMatch)
        matches.push(match)
      }
    }

    return matches
  }

  private async matchOrdersWithActuals(
    cashEvents: any[],
    actualEvents: any[]
  ): Promise<VarianceMatch[]> {
    const matches: VarianceMatch[] = []

    for (const cashEvent of cashEvents) {
      let bestMatch: any = null
      let bestScore = 0

      for (const actualEvent of actualEvents) {
        const score = this.calculateMatchScore(cashEvent, actualEvent)
        
        if (score > bestScore && score > 0.3) {
          bestMatch = actualEvent
          bestScore = score
        }
      }

      if (bestMatch) {
        const match = await this.createActualVarianceMatch(cashEvent, bestMatch)
        matches.push(match)
      }
    }

    return matches
  }

  private calculateMatchScore(cashEvent: any, actualEvent: any): number {
    let score = 0

    // Project match (highest weight)
    if (cashEvent.projectId === actualEvent.projectId) {
      score += 0.4
    }

    // Amount similarity (high weight)
    const amountDiff = Math.abs(Number(cashEvent.amount) - Number(actualEvent.amount))
    const amountSimilarity = 1 - (amountDiff / Math.max(Number(cashEvent.amount), Number(actualEvent.amount)))
    score += amountSimilarity * 0.3

    // Date proximity (medium weight)
    const dateDiff = Math.abs(differenceInDays(cashEvent.scheduledDate, actualEvent.occurredAt))
    const dateSimilarity = Math.max(0, 1 - (dateDiff / 30)) // Within 30 days
    score += dateSimilarity * 0.2

    // Type match (low weight)
    if (cashEvent.type === actualEvent.type) {
      score += 0.1
    }

    return Math.min(1, score)
  }

  private async createActualVarianceMatch(cashEvent: any, actualEvent: any): Promise<VarianceMatch> {
    const amountVariance = Number(actualEvent.amount) - Number(cashEvent.amount)
    const timingVariance = differenceInDays(actualEvent.occurredAt, cashEvent.scheduledDate)
    const confidenceScore = this.calculateMatchScore(cashEvent, actualEvent)

    const match = await prisma.varianceMatch.create({
      data: {
        organizationId: this.organizationId,
        cashEventId: cashEvent.id,
        actualEventId: actualEvent.id,
        amountVariance,
        timingVariance,
        confidenceScore,
        status: 'matched',
        projectId: cashEvent.projectId,
      },
    })

    return {
      id: match.id,
      cashEventId: match.cashEventId,
      actualEventId: match.actualEventId,
      amountVariance: Number(match.amountVariance),
      timingVariance: match.timingVariance,
      confidenceScore: Number(match.confidenceScore),
      status: match.status as 'matched' | 'disputed' | 'resolved',
      projectId: match.projectId || undefined,
    }
  }
}
