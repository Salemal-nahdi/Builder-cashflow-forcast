import { prisma } from '@/lib/prisma'
import { addDays, parseISO } from 'date-fns'

interface SyncResult {
  success: boolean
  recordsUpdated: number
  lastSyncTime: Date
  errors?: string[]
}

interface SyncJob {
  id: string
  organizationId: string
  tenantId: string
  type: 'invoices' | 'bills' | 'payments' | 'projects'
  lastSync?: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
  retryCount: number
  maxRetries: number
}

export class SyncEngine {
  private maxRetries = 3
  private backoffMultiplier = 2
  private baseDelayMs = 1000

  async scheduleIncrementalSync(organizationId: string): Promise<void> {
    const xeroConnection = await prisma.xeroConnection.findFirst({
      where: { organizationId }
    })

    if (!xeroConnection) {
      throw new Error('No Xero connection found for organization')
    }

    const syncTypes = ['invoices', 'bills', 'payments', 'projects'] as const
    
    for (const type of syncTypes) {
      await this.createSyncJob({
        id: `${organizationId}-${type}-${Date.now()}`,
        organizationId,
        tenantId: xeroConnection.xeroTenantId,
        type,
        status: 'pending',
        retryCount: 0,
        maxRetries: this.maxRetries,
      })
    }
  }

  private async createSyncJob(job: SyncJob): Promise<void> {
    // In production, this would use a job queue like BullMQ or Inngest
    // For now, we'll simulate by storing in a simple table and processing immediately
    await prisma.$executeRaw`
      INSERT INTO sync_jobs (id, organization_id, tenant_id, type, status, retry_count, created_at)
      VALUES (${job.id}, ${job.organizationId}, ${job.tenantId}, ${job.type}, ${job.status}, ${job.retryCount}, NOW())
      ON CONFLICT (id) DO NOTHING
    `
    
    // Process immediately (in production this would be handled by a worker)
    await this.processSyncJob(job)
  }

  private async processSyncJob(job: SyncJob): Promise<SyncResult> {
    try {
      await this.updateJobStatus(job.id, 'running')
      
      const xeroConnection = await prisma.xeroConnection.findFirst({
        where: { organizationId: job.organizationId }
      })

      if (!xeroConnection) {
        throw new Error('Xero connection not found')
      }

      // Token refresh is handled by XeroApiClient
      let accessToken = xeroConnection.accessToken

      // Get last sync time for incremental sync
      const lastSync = await this.getLastSyncTime(job.organizationId, job.type)
      
      let result: SyncResult
      switch (job.type) {
        case 'invoices':
          result = await this.syncInvoices(job.tenantId, accessToken, lastSync)
          break
        case 'bills':
          result = await this.syncBills(job.tenantId, accessToken, lastSync)
          break
        case 'payments':
          result = await this.syncPayments(job.tenantId, accessToken, lastSync)
          break
        case 'projects':
          result = await this.syncProjects(job.tenantId, accessToken, lastSync)
          break
        default:
          throw new Error(`Unknown sync type: ${job.type}`)
      }

      if (result.success) {
        await this.updateJobStatus(job.id, 'completed')
        await this.updateLastSyncTime(job.organizationId, job.type, result.lastSyncTime)
      } else {
        throw new Error(`Sync failed: ${result.errors?.join(', ')}`)
      }

      return result
    } catch (error) {
      console.error(`Sync job ${job.id} failed:`, error)
      
      if (job.retryCount < job.maxRetries) {
        await this.scheduleRetry(job)
      } else {
        await this.updateJobStatus(job.id, 'failed')
      }

      return {
        success: false,
        recordsUpdated: 0,
        lastSyncTime: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async syncInvoices(tenantId: string, accessToken: string, lastSync?: Date): Promise<SyncResult> {
    // NOTE: This legacy sync-engine.ts is deprecated. Use XeroSyncService from xero/sync.ts instead.
    // const modifiedSince = lastSync?.toISOString()
    // const invoices = await getInvoices(accessToken, tenantId, { modifiedSince })
    
    let recordsUpdated = 0
    const errors: string[] = []
    const invoices: any[] = [] // Deprecated - use XeroSyncService

    for (const invoice of invoices) {
      try {
        // Deprecated: This logic is non-functional
        await prisma.cashEvent.upsert({
          where: {
            id: invoice.InvoiceID || 'deprecated',
          },
          update: {
            amount: parseFloat(invoice.Total || '0'),
            dueDate: invoice.DueDate ? parseISO(invoice.DueDate) : null,
            description: invoice.Reference || `Invoice ${invoice.InvoiceNumber}`,
            status: this.mapXeroStatus(invoice.Status),
            lastSynced: new Date(),
          },
          create: {
            xeroId: invoice.InvoiceID,
            type: 'income',
            amount: parseFloat(invoice.Total || '0'),
            dueDate: invoice.DueDate ? parseISO(invoice.DueDate) : null,
            description: invoice.Reference || `Invoice ${invoice.InvoiceNumber}`,
            status: this.mapXeroStatus(invoice.Status),
            currency: invoice.CurrencyCode || 'AUD',
            organizationId: '', // Will be set by calling function
            lastSynced: new Date(),
          },
        })
        recordsUpdated++
      } catch (error) {
        errors.push(`Failed to sync invoice ${invoice.InvoiceID}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsUpdated,
      lastSyncTime: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  private async syncBills(tenantId: string, accessToken: string, lastSync?: Date): Promise<SyncResult> {
    // NOTE: This legacy sync-engine.ts is deprecated. Use XeroSyncService from xero/sync.ts instead.
    const bills: any[] = [] // Deprecated
    
    let recordsUpdated = 0
    const errors: string[] = []

    for (const bill of bills) {
      try {
        // Deprecated: This logic is non-functional
        await prisma.cashEvent.upsert({
          where: {
            id: bill.BillID || 'deprecated',
          },
          update: {
            amount: parseFloat(bill.Total || '0'),
            dueDate: bill.DueDate ? parseISO(bill.DueDate) : null,
            description: bill.Reference || `Bill ${bill.BillNumber}`,
            status: this.mapXeroStatus(bill.Status),
            lastSynced: new Date(),
          },
          create: {
            xeroId: bill.BillID,
            type: 'expense',
            amount: parseFloat(bill.Total || '0'),
            dueDate: bill.DueDate ? parseISO(bill.DueDate) : null,
            description: bill.Reference || `Bill ${bill.BillNumber}`,
            status: this.mapXeroStatus(bill.Status),
            currency: bill.CurrencyCode || 'AUD',
            organizationId: '', // Will be set by calling function
            lastSynced: new Date(),
          },
        })
        recordsUpdated++
      } catch (error) {
        errors.push(`Failed to sync bill ${bill.BillID}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsUpdated,
      lastSyncTime: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  private async syncPayments(tenantId: string, accessToken: string, lastSync?: Date): Promise<SyncResult> {
    // NOTE: This legacy sync-engine.ts is deprecated. Use XeroSyncService from xero/sync.ts instead.
    const payments: any[] = [] // Deprecated
    
    let recordsUpdated = 0
    const errors: string[] = []

    for (const payment of payments) {
      try {
        // Deprecated: This logic is non-functional
        await prisma.cashEvent.upsert({
          where: {
            id: payment.PaymentID || 'deprecated',
          },
          update: {
            amount: parseFloat(payment.Amount || '0'),
            dueDate: payment.Date ? parseISO(payment.Date) : null,
            description: `Payment ${payment.Reference || payment.PaymentID}`,
            status: 'completed',
            lastSynced: new Date(),
          },
          create: {
            xeroId: payment.PaymentID,
            type: payment.PaymentType === 'ACCRECPAYMENT' ? 'income' : 'expense',
            amount: parseFloat(payment.Amount || '0'),
            dueDate: payment.Date ? parseISO(payment.Date) : null,
            description: `Payment ${payment.Reference || payment.PaymentID}`,
            status: 'completed',
            currency: payment.CurrencyCode || 'AUD',
            organizationId: '', // Will be set by calling function
            lastSynced: new Date(),
          },
        })
        recordsUpdated++
      } catch (error) {
        errors.push(`Failed to sync payment ${payment.PaymentID}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsUpdated,
      lastSyncTime: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  private async syncProjects(tenantId: string, accessToken: string, lastSync?: Date): Promise<SyncResult> {
    // NOTE: This legacy sync-engine.ts is deprecated. Use XeroSyncService from xero/sync.ts instead.
    const projects: any[] = [] // Deprecated
    
    let recordsUpdated = 0
    const errors: string[] = []

    for (const project of projects) {
      try {
        await prisma.project.upsert({
          where: {
            xeroProjectId: project.ProjectId,
          },
          update: {
            name: project.Name,
            status: project.Status?.toLowerCase() || 'active',
            lastSynced: new Date(),
          },
          create: {
            xeroProjectId: project.ProjectId,
            name: project.Name,
            status: project.Status?.toLowerCase() || 'active',
            organizationId: '', // Will be set by calling function
            lastSynced: new Date(),
          },
        })
        recordsUpdated++
      } catch (error) {
        errors.push(`Failed to sync project ${project.ProjectId}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsUpdated,
      lastSyncTime: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  private async scheduleRetry(job: SyncJob): Promise<void> {
    const delayMs = this.baseDelayMs * Math.pow(this.backoffMultiplier, job.retryCount)
    
    // In production, this would schedule with the job queue
    setTimeout(async () => {
      const updatedJob = {
        ...job,
        retryCount: job.retryCount + 1,
        status: 'pending' as const,
      }
      await this.processSyncJob(updatedJob)
    }, delayMs)
  }

  private async updateJobStatus(jobId: string, status: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE sync_jobs 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${jobId}
    `
  }

  private async getLastSyncTime(organizationId: string, type: string): Promise<Date | undefined> {
    const result = await prisma.$queryRaw<{ last_sync: Date }[]>`
      SELECT last_sync FROM sync_metadata 
      WHERE organization_id = ${organizationId} AND sync_type = ${type}
    `
    return result[0]?.last_sync
  }

  private async updateLastSyncTime(organizationId: string, type: string, syncTime: Date): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO sync_metadata (organization_id, sync_type, last_sync)
      VALUES (${organizationId}, ${type}, ${syncTime})
      ON CONFLICT (organization_id, sync_type) 
      DO UPDATE SET last_sync = ${syncTime}, updated_at = NOW()
    `
  }

  private mapXeroStatus(xeroStatus?: string): string {
    const statusMap: Record<string, string> = {
      'DRAFT': 'pending',
      'SUBMITTED': 'pending',
      'AUTHORISED': 'confirmed',
      'PAID': 'completed',
      'VOIDED': 'cancelled',
    }
    return statusMap[xeroStatus || ''] || 'pending'
  }
}

export const syncEngine = new SyncEngine()
