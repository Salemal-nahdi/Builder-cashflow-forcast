import { prisma } from '../prisma'
import { addDays } from 'date-fns'

export interface ETLOptions {
  connectionId: string
  organizationId: string
  basis: 'cash' | 'accrual'
  startDate?: Date
  endDate?: Date
}

export class XeroETLService {
  private connectionId: string
  private organizationId: string

  constructor(connectionId: string, organizationId: string) {
    this.connectionId = connectionId
    this.organizationId = organizationId
  }

  async transformToActualEvents(options: ETLOptions): Promise<void> {
    const { basis, startDate, endDate } = options

    console.log(`Transforming Xero data to ${basis} basis actual events...`)

    // Clear existing actual events for this connection and basis
    await prisma.actualEvent.deleteMany({
      where: {
        organizationId: this.organizationId,
        basis,
        sourceType: {
          in: ['invoice', 'bill', 'payment', 'bank_transaction'],
        },
        ...(startDate && endDate ? {
          occurredAt: {
            gte: startDate,
            lte: endDate,
          },
        } : {}),
      },
    })

    if (basis === 'accrual') {
      await this.transformInvoicesToActualEvents(startDate, endDate)
      await this.transformBillsToActualEvents(startDate, endDate)
    } else {
      await this.transformPaymentsToActualEvents(startDate, endDate)
      await this.transformBankTransactionsToActualEvents(startDate, endDate)
    }

    console.log('ETL transformation completed')
  }

  private async transformInvoicesToActualEvents(startDate?: Date, endDate?: Date): Promise<void> {
    const invoices = await prisma.xeroInvoice.findMany({
      where: {
        connectionId: this.connectionId,
        type: 'ACCREC', // Accounts Receivable (income)
        ...(startDate && endDate ? {
          date: {
            gte: startDate,
            lte: endDate,
          },
        } : {}),
      },
    })

    for (const invoice of invoices) {
      const lineItems = invoice.lineItems as any[]
      
      for (const lineItem of lineItems || []) {
        const projectId = await this.getProjectIdFromTracking(lineItem.tracking)
        
        await prisma.actualEvent.create({
          data: {
            organizationId: this.organizationId,
            projectId,
            basis: 'accrual',
            type: 'income',
            amount: lineItem.lineAmount || 0,
            occurredAt: invoice.date,
            sourceType: 'invoice',
            sourceId: invoice.xeroId,
            accountCode: lineItem.accountCode,
            accountType: 'REVENUE',
            contactId: invoice.contactId,
            contactName: invoice.contactName,
            trackingOptionIds: this.extractTrackingOptionIds(lineItem.tracking),
            description: lineItem.description,
            reference: invoice.invoiceNumber,
          },
        })
      }
    }

    console.log(`Transformed ${invoices.length} invoices to accrual actual events`)
  }

  private async transformBillsToActualEvents(startDate?: Date, endDate?: Date): Promise<void> {
    const bills = await prisma.xeroBill.findMany({
      where: {
        connectionId: this.connectionId,
        ...(startDate && endDate ? {
          date: {
            gte: startDate,
            lte: endDate,
          },
        } : {}),
      },
    })

    for (const bill of bills) {
      const lineItems = bill.lineItems as any[]
      
      for (const lineItem of lineItems || []) {
        const projectId = await this.getProjectIdFromTracking(lineItem.tracking)
        
        await prisma.actualEvent.create({
          data: {
            organizationId: this.organizationId,
            projectId,
            basis: 'accrual',
            type: 'outgo',
            amount: lineItem.lineAmount || 0,
            occurredAt: bill.date,
            sourceType: 'bill',
            sourceId: bill.xeroId,
            accountCode: lineItem.accountCode,
            accountType: this.getAccountTypeFromCode(lineItem.accountCode),
            contactId: bill.contactId,
            contactName: bill.contactName,
            trackingOptionIds: this.extractTrackingOptionIds(lineItem.tracking),
            description: lineItem.description,
            reference: bill.billNumber,
          },
        })
      }
    }

    console.log(`Transformed ${bills.length} bills to accrual actual events`)
  }

  private async transformPaymentsToActualEvents(startDate?: Date, endDate?: Date): Promise<void> {
    const payments = await prisma.xeroPayment.findMany({
      where: {
        connectionId: this.connectionId,
        ...(startDate && endDate ? {
          date: {
            gte: startDate,
            lte: endDate,
          },
        } : {}),
      },
    })

    for (const payment of payments) {
      const allocations = payment.allocations as any[]
      
      for (const allocation of allocations || []) {
        // Determine if this is income or outgo based on the invoice/bill type
        const isIncome = allocation.invoice?.type === 'ACCREC'
        
        // Get the original invoice/bill to extract line items and tracking
        const sourceDocument = allocation.invoice || allocation.creditNote
        if (!sourceDocument) continue

        const projectId = await this.getProjectIdFromAllocation(allocation)
        
        await prisma.actualEvent.create({
          data: {
            organizationId: this.organizationId,
            projectId,
            basis: 'cash',
            type: isIncome ? 'income' : 'outgo',
            amount: allocation.amount,
            occurredAt: payment.date,
            sourceType: 'payment',
            sourceId: payment.xeroId,
            accountCode: sourceDocument.lineItems?.[0]?.accountCode,
            accountType: isIncome ? 'REVENUE' : 'EXPENSE',
            contactId: sourceDocument.contact?.contactID,
            contactName: sourceDocument.contact?.name,
            trackingOptionIds: this.extractTrackingOptionIdsFromAllocation(allocation),
            description: `Payment for ${sourceDocument.invoiceNumber || sourceDocument.creditNoteNumber}`,
            reference: payment.reference,
          },
        })
      }
    }

    console.log(`Transformed ${payments.length} payments to cash actual events`)
  }

  private async transformBankTransactionsToActualEvents(startDate?: Date, endDate?: Date): Promise<void> {
    const transactions = await prisma.xeroBankTransaction.findMany({
      where: {
        connectionId: this.connectionId,
        ...(startDate && endDate ? {
          date: {
            gte: startDate,
            lte: endDate,
          },
        } : {}),
      },
    })

    for (const transaction of transactions) {
      const lineItems = transaction.lineItems as any[]
      
      for (const lineItem of lineItems || []) {
        const projectId = await this.getProjectIdFromTracking(lineItem.tracking)
        
        await prisma.actualEvent.create({
          data: {
            organizationId: this.organizationId,
            projectId,
            basis: 'cash',
            type: transaction.type === 'RECEIVE' ? 'income' : 'outgo',
            amount: lineItem.amount || 0,
            occurredAt: transaction.date,
            sourceType: 'bank_transaction',
            sourceId: transaction.xeroId,
            accountCode: lineItem.accountCode,
            accountType: this.getAccountTypeFromCode(lineItem.accountCode),
            contactId: lineItem.contact?.contactID,
            contactName: lineItem.contact?.name,
            trackingOptionIds: this.extractTrackingOptionIds(lineItem.tracking),
            description: lineItem.description || transaction.description,
            reference: transaction.reference,
          },
        })
      }
    }

    console.log(`Transformed ${transactions.length} bank transactions to cash actual events`)
  }

  private async getProjectIdFromTracking(tracking: any): Promise<string | null> {
    if (!tracking) return null

    // Extract tracking option IDs from the tracking object
    const trackingOptionIds = this.extractTrackingOptionIds(tracking)
    
    if (trackingOptionIds.length === 0) return null

    // Find project mapping for any of these tracking options
    const mapping = await prisma.projectXeroTrackingMap.findFirst({
      where: {
        trackingOptionId: {
          in: trackingOptionIds,
        },
      },
      include: {
        project: true,
      },
    })

    return mapping?.projectId || null
  }

  private async getProjectIdFromAllocation(allocation: any): Promise<string | null> {
    // For payments, we need to look at the original invoice/bill line items
    const sourceDocument = allocation.invoice || allocation.creditNote
    if (!sourceDocument?.lineItems) return null

    // Find the line item that matches this allocation amount
    const lineItem = sourceDocument.lineItems.find((item: any) => 
      Math.abs(item.lineAmount - allocation.amount) < 0.01
    )

    if (!lineItem) return null

    return this.getProjectIdFromTracking(lineItem.tracking)
  }

  private extractTrackingOptionIds(tracking: any): string[] {
    if (!tracking) return []

    const optionIds: string[] = []
    
    // Handle different tracking structures
    if (Array.isArray(tracking)) {
      for (const track of tracking) {
        if (track.trackingOptionID) {
          optionIds.push(track.trackingOptionID)
        }
      }
    } else if (tracking.trackingOptionID) {
      optionIds.push(tracking.trackingOptionID)
    }

    return optionIds
  }

  private extractTrackingOptionIdsFromAllocation(allocation: any): string[] {
    const sourceDocument = allocation.invoice || allocation.creditNote
    if (!sourceDocument?.lineItems) return []

    // Find the matching line item and extract its tracking
    const lineItem = sourceDocument.lineItems.find((item: any) => 
      Math.abs(item.lineAmount - allocation.amount) < 0.01
    )

    return this.extractTrackingOptionIds(lineItem?.tracking)
  }

  private async getAccountTypeFromCode(accountCode: string): Promise<string> {
    if (!accountCode) return 'EXPENSE'

    const account = await prisma.xeroAccount.findFirst({
      where: {
        connectionId: this.connectionId,
        code: accountCode,
      },
    })

    return account?.type || 'EXPENSE'
  }

  // Helper method to get unmapped actual events
  async getUnmappedActualEvents(): Promise<any[]> {
    return prisma.actualEvent.findMany({
      where: {
        organizationId: this.organizationId,
        projectId: null,
        sourceType: {
          in: ['invoice', 'bill', 'payment', 'bank_transaction'],
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        occurredAt: 'desc',
      },
    })
  }

  // Helper method to get actual events by project and period
  async getActualEventsByProject(
    projectId: string,
    startDate: Date,
    endDate: Date,
    basis: 'cash' | 'accrual'
  ): Promise<any[]> {
    return prisma.actualEvent.findMany({
      where: {
        organizationId: this.organizationId,
        projectId,
        basis,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        occurredAt: 'asc',
      },
    })
  }
}
