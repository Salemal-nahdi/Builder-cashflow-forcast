import { XeroApiClient } from './client'
import { prisma } from '../prisma'
import { addMonths, subMonths } from 'date-fns'

export interface SyncOptions {
  connectionId: string
  organizationId: string
  entityTypes?: string[]
  initialSync?: boolean
  modifiedSince?: Date
}

export class XeroSyncService {
  private connectionId: string
  private organizationId: string
  private client: XeroApiClient

  constructor(connectionId: string, organizationId: string) {
    this.connectionId = connectionId
    this.organizationId = organizationId
    this.client = new XeroApiClient(connectionId, organizationId)
  }

  async syncAll(options: SyncOptions): Promise<void> {
    const { entityTypes = ['accounts', 'tracking', 'contacts', 'invoices', 'bills', 'payments', 'bankTransactions'], initialSync = false } = options

    // Determine sync date - limit initial sync to 3 months to avoid timeouts
    const modifiedSince = options.modifiedSince || (initialSync ? subMonths(new Date(), 3) : undefined)

    // Create sync log
    const syncLog = await prisma.xeroSyncLog.create({
      data: {
        connectionId: this.connectionId,
        entityType: 'all',
        syncType: initialSync ? 'initial' : 'incremental',
        status: 'success',
        startedAt: new Date(),
      },
    })

    try {
      // Sync in order of dependencies
      if (entityTypes.includes('accounts')) {
        await this.syncAccounts(modifiedSince)
      }

      if (entityTypes.includes('tracking')) {
        await this.syncTrackingCategories(modifiedSince)
      }

      if (entityTypes.includes('contacts')) {
        await this.syncContacts(modifiedSince)
      }

      if (entityTypes.includes('invoices')) {
        await this.syncInvoices(modifiedSince)
      }

      if (entityTypes.includes('bills')) {
        await this.syncBills(modifiedSince)
      }

      if (entityTypes.includes('payments')) {
        await this.syncPayments(modifiedSince)
      }

      if (entityTypes.includes('bankTransactions')) {
        await this.syncBankTransactions(modifiedSince)
      }

      // Update connection last sync time
      await prisma.xeroConnection.update({
        where: { id: this.connectionId },
        data: { lastSyncAt: new Date() },
      })

      // Complete sync log
      await prisma.xeroSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'success',
          completedAt: new Date(),
          durationMs: Date.now() - syncLog.startedAt.getTime(),
        },
      })
    } catch (error) {
      console.error('Sync failed:', error)
      
      // Update sync log with error
      await prisma.xeroSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          durationMs: Date.now() - syncLog.startedAt.getTime(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      
      throw error
    }
  }

  private async syncAccounts(modifiedSince?: Date): Promise<void> {
    console.log('Syncing accounts...')
    
    const accounts = await this.client.getAccounts()
    
    for (const account of accounts) {
      await prisma.xeroAccount.upsert({
        where: { xeroId: account.accountID },
        update: {
          code: account.code,
          name: account.name,
          type: account.type,
          class: account.class,
          status: account.status,
        },
        create: {
          connectionId: this.connectionId,
          xeroId: account.accountID,
          code: account.code,
          name: account.name,
          type: account.type,
          class: account.class,
          status: account.status,
        },
      })
    }
    
    console.log(`Synced ${accounts.length} accounts`)
  }

  private async syncTrackingCategories(modifiedSince?: Date): Promise<void> {
    console.log('Syncing tracking categories...')
    
    const categories = await this.client.getTrackingCategories()
    
    for (const category of categories) {
      // Upsert category
      const dbCategory = await prisma.xeroTrackingCategory.upsert({
        where: { xeroId: category.trackingCategoryID },
        update: {
          name: category.name,
          status: category.status,
        },
        create: {
          connectionId: this.connectionId,
          xeroId: category.trackingCategoryID,
          name: category.name,
          status: category.status,
        },
      })

      // Sync options
      if (category.options) {
        for (const option of category.options) {
          await prisma.xeroTrackingOption.upsert({
            where: { xeroId: option.trackingOptionID },
            update: {
              name: option.name,
              status: option.status,
            },
            create: {
              categoryId: dbCategory.id,
              xeroId: option.trackingOptionID,
              name: option.name,
              status: option.status,
            },
          })
        }
      }
    }
    
    console.log(`Synced ${categories.length} tracking categories`)
  }

  private async syncContacts(modifiedSince?: Date): Promise<void> {
    console.log('Syncing contacts...')
    
    const contacts = await this.client.getContacts()
    
    for (const contact of contacts) {
      await prisma.xeroContact.upsert({
        where: { xeroId: contact.contactID },
        update: {
          name: contact.name,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.emailAddress,
          phone: contact.phones?.[0]?.phoneNumber,
          type: contact.isCustomer ? (contact.isSupplier ? 'BOTH' : 'CUSTOMER') : 'SUPPLIER',
          status: contact.contactStatus,
        },
        create: {
          connectionId: this.connectionId,
          xeroId: contact.contactID,
          name: contact.name,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.emailAddress,
          phone: contact.phones?.[0]?.phoneNumber,
          type: contact.isCustomer ? (contact.isSupplier ? 'BOTH' : 'CUSTOMER') : 'SUPPLIER',
          status: contact.contactStatus,
        },
      })
    }
    
    console.log(`Synced ${contacts.length} contacts`)
  }

  private async syncInvoices(modifiedSince?: Date): Promise<void> {
    console.log('Syncing invoices...')
    
    const invoices = await this.client.getInvoices(modifiedSince)
    
    for (const invoice of invoices) {
      await prisma.xeroInvoice.upsert({
        where: { xeroId: invoice.invoiceID },
        update: {
          invoiceNumber: invoice.invoiceNumber,
          type: invoice.type,
          status: invoice.status,
          date: new Date(invoice.date),
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          amountDue: invoice.amountDue,
          contactId: invoice.contact?.contactID,
          contactName: invoice.contact?.name,
          lineItems: invoice.lineItems || [],
        },
        create: {
          connectionId: this.connectionId,
          xeroId: invoice.invoiceID,
          invoiceNumber: invoice.invoiceNumber,
          type: invoice.type,
          status: invoice.status,
          date: new Date(invoice.date),
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          amountDue: invoice.amountDue,
          contactId: invoice.contact?.contactID,
          contactName: invoice.contact?.name,
          lineItems: invoice.lineItems || [],
        },
      })
    }
    
    console.log(`Synced ${invoices.length} invoices`)
  }

  private async syncBills(modifiedSince?: Date): Promise<void> {
    console.log('Syncing bills...')
    
    const bills = await this.client.getBills(modifiedSince)
    
    for (const bill of bills) {
      await prisma.xeroBill.upsert({
        where: { xeroId: bill.billID },
        update: {
          billNumber: bill.billNumber,
          status: bill.status,
          date: new Date(bill.date),
          dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
          total: bill.total,
          amountPaid: bill.amountPaid,
          amountDue: bill.amountDue,
          contactId: bill.contact?.contactID,
          contactName: bill.contact?.name,
          lineItems: bill.lineItems || [],
        },
        create: {
          connectionId: this.connectionId,
          xeroId: bill.billID,
          billNumber: bill.billNumber,
          status: bill.status,
          date: new Date(bill.date),
          dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
          total: bill.total,
          amountPaid: bill.amountPaid,
          amountDue: bill.amountDue,
          contactId: bill.contact?.contactID,
          contactName: bill.contact?.name,
          lineItems: bill.lineItems || [],
        },
      })
    }
    
    console.log(`Synced ${bills.length} bills`)
  }

  private async syncPayments(modifiedSince?: Date): Promise<void> {
    console.log('Syncing payments...')
    
    const payments = await this.client.getPayments(modifiedSince)
    
    for (const payment of payments) {
      await prisma.xeroPayment.upsert({
        where: { xeroId: payment.paymentID },
        update: {
          amount: payment.amount,
          date: new Date(payment.date),
          reference: payment.reference,
          allocations: payment.allocations || [],
        },
        create: {
          connectionId: this.connectionId,
          xeroId: payment.paymentID,
          amount: payment.amount,
          date: new Date(payment.date),
          reference: payment.reference,
          allocations: payment.allocations || [],
        },
      })
    }
    
    console.log(`Synced ${payments.length} payments`)
  }

  private async syncBankTransactions(modifiedSince?: Date): Promise<void> {
    console.log('Syncing bank transactions...')
    
    const transactions = await this.client.getBankTransactions(modifiedSince)
    
    for (const transaction of transactions) {
      await prisma.xeroBankTransaction.upsert({
        where: { xeroId: transaction.bankTransactionID },
        update: {
          bankAccountId: transaction.bankAccount?.accountID,
          bankAccountName: transaction.bankAccount?.name,
          type: transaction.type,
          status: transaction.status,
          date: new Date(transaction.date),
          amount: transaction.total,
          reference: transaction.reference,
          description: transaction.reference,
          lineItems: transaction.lineItems || [],
        },
        create: {
          connectionId: this.connectionId,
          xeroId: transaction.bankTransactionID,
          bankAccountId: transaction.bankAccount?.accountID,
          bankAccountName: transaction.bankAccount?.name,
          type: transaction.type,
          status: transaction.status,
          date: new Date(transaction.date),
          amount: transaction.total,
          reference: transaction.reference,
          description: transaction.reference,
          lineItems: transaction.lineItems || [],
        },
      })
    }
    
    console.log(`Synced ${transactions.length} bank transactions`)
  }
}
