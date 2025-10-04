import { prisma } from './prisma'
import { ForecastEngine } from './forecast-engine'
import { ReconciliationEngine } from './reconciliation-engine'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export interface ReportOptions {
  type: string
  format: string
  projectIds: string[]
  dateRange: {
    startDate: string
    endDate: string
  }
  includeCharts: boolean
}

export interface ReportResult {
  success: boolean
  fileUrl?: string
  error?: string
}

export class ReportGenerator {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  async generateReport(options: ReportOptions): Promise<ReportResult> {
    try {
      switch (options.type) {
        case 'forecast':
          return await this.generateForecastReport(options)
        case 'variance':
          return await this.generateVarianceReport(options)
        case 'consolidated':
          return await this.generateConsolidatedReport(options)
        case 'project':
          return await this.generateProjectReport(options)
        default:
          throw new Error(`Unknown report type: ${options.type}`)
      }
    } catch (error) {
      console.error('Report generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async generateForecastReport(options: ReportOptions): Promise<ReportResult> {
    const startDate = options.dateRange.startDate ? new Date(options.dateRange.startDate) : new Date()
    const endDate = options.dateRange.endDate ? new Date(options.dateRange.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now

    const forecastEngine = new ForecastEngine(this.organizationId, startDate, endDate)
    const periods = await forecastEngine.generateForecast()

    if (options.format === 'csv') {
      const csvContent = this.generateForecastCSV(periods)
      const fileUrl = await this.saveFile(csvContent, 'forecast.csv', 'text/csv')
      return { success: true, fileUrl }
    } else {
      const pdfBuffer = await this.generateForecastPDF(periods, options)
      const fileUrl = await this.saveFile(pdfBuffer, 'forecast.pdf', 'application/pdf')
      return { success: true, fileUrl }
    }
  }

  private async generateVarianceReport(options: ReportOptions): Promise<ReportResult> {
    const reconciliationEngine = new ReconciliationEngine(this.organizationId)
    const varianceMatches = await reconciliationEngine.getVarianceMatches({
      projectId: options.projectIds.length === 1 ? options.projectIds[0] : undefined,
    })

    if (options.format === 'csv') {
      const csvContent = this.generateVarianceCSV(varianceMatches)
      const fileUrl = await this.saveFile(csvContent, 'variance.csv', 'text/csv')
      return { success: true, fileUrl }
    } else {
      const pdfBuffer = await this.generateVariancePDF(varianceMatches, options)
      const fileUrl = await this.saveFile(pdfBuffer, 'variance.pdf', 'application/pdf')
      return { success: true, fileUrl }
    }
  }

  private async generateConsolidatedReport(options: ReportOptions): Promise<ReportResult> {
    // Get organization data
    const organization = await prisma.organization.findUnique({
      where: { id: this.organizationId },
      include: {
        settings: true,
        projects: {
          where: options.projectIds.length > 0 ? { id: { in: options.projectIds } } : {},
        },
      },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    // Get forecast data
    const startDate = options.dateRange.startDate ? new Date(options.dateRange.startDate) : new Date()
    const endDate = options.dateRange.endDate ? new Date(options.dateRange.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    
    const forecastEngine = new ForecastEngine(this.organizationId, startDate, endDate)
    const forecastSummary = await forecastEngine.getCashflowSummary()

    // Get variance data
    const reconciliationEngine = new ReconciliationEngine(this.organizationId)
    const varianceMatches = await reconciliationEngine.getVarianceMatches()

    if (options.format === 'csv') {
      const csvContent = this.generateConsolidatedCSV(organization, forecastSummary, varianceMatches)
      const fileUrl = await this.saveFile(csvContent, 'consolidated.csv', 'text/csv')
      return { success: true, fileUrl }
    } else {
      const pdfBuffer = await this.generateConsolidatedPDF(organization, forecastSummary, varianceMatches, options)
      const fileUrl = await this.saveFile(pdfBuffer, 'consolidated.pdf', 'application/pdf')
      return { success: true, fileUrl }
    }
  }

  private async generateProjectReport(options: ReportOptions): Promise<ReportResult> {
    if (options.projectIds.length === 0) {
      throw new Error('At least one project must be selected')
    }

    const projects = await prisma.project.findMany({
      where: {
        id: { in: options.projectIds },
        organizationId: this.organizationId,
      },
      include: {
        milestones: true,
        supplierClaims: true,
        materialOrders: true,
        projectGroup: true,
      },
    })

    if (options.format === 'csv') {
      const csvContent = this.generateProjectCSV(projects)
      const fileUrl = await this.saveFile(csvContent, 'projects.csv', 'text/csv')
      return { success: true, fileUrl }
    } else {
      const pdfBuffer = await this.generateProjectPDF(projects, options)
      const fileUrl = await this.saveFile(pdfBuffer, 'projects.pdf', 'application/pdf')
      return { success: true, fileUrl }
    }
  }

  private generateForecastCSV(periods: any[]): string {
    const headers = ['Month', 'Income', 'Outgo', 'Net', 'Balance']
    const rows = periods.map(period => [
      format(period.startDate, 'MMM yyyy'),
      period.income.toFixed(2),
      period.outgo.toFixed(2),
      period.net.toFixed(2),
      period.balance.toFixed(2),
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private generateVarianceCSV(varianceMatches: any[]): string {
    const headers = ['Project', 'Item Type', 'Forecast Amount', 'Amount Variance', 'Timing Variance', 'Confidence', 'Status']
    const rows = varianceMatches.map(match => [
      match.cashEvent?.project?.name || 'No Project',
      match.cashEvent?.sourceType || '',
      match.cashEvent?.amount?.toFixed(2) || '0.00',
      match.amountVariance.toFixed(2),
      match.timingVariance.toString(),
      (match.confidenceScore * 100).toFixed(1) + '%',
      match.status,
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private generateConsolidatedCSV(organization: any, forecastSummary: any, varianceMatches: any[]): string {
    const headers = ['Metric', 'Value']
    const rows = [
      ['Organization', organization.name],
      ['Total Income', forecastSummary.totalIncome.toFixed(2)],
      ['Total Outgo', forecastSummary.totalOutgo.toFixed(2)],
      ['Net Cashflow', forecastSummary.netCashflow.toFixed(2)],
      ['Lowest Balance', forecastSummary.lowestBalance.toFixed(2)],
      ['Negative Balance Days', forecastSummary.negativeBalanceDays.toString()],
      ['Total Variance Matches', varianceMatches.length.toString()],
      ['High Confidence Matches', varianceMatches.filter(m => m.confidenceScore >= 0.8).length.toString()],
    ]

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private generateProjectCSV(projects: any[]): string {
    const headers = ['Project Name', 'Status', 'Contract Value', 'Milestones', 'Supplier Claims', 'Material Orders']
    const rows = projects.map(project => [
      project.name,
      project.status,
      project.contractValue?.toFixed(2) || '0.00',
      project.milestones.length.toString(),
      project.supplierClaims.length.toString(),
      project.materialOrders.length.toString(),
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private async generateForecastPDF(periods: any[], options: ReportOptions): Promise<Buffer> {
    // This would use Puppeteer to generate a PDF
    // For now, return a mock buffer
    return Buffer.from('Mock PDF content for forecast report')
  }

  private async generateVariancePDF(varianceMatches: any[], options: ReportOptions): Promise<Buffer> {
    // This would use Puppeteer to generate a PDF
    // For now, return a mock buffer
    return Buffer.from('Mock PDF content for variance report')
  }

  private async generateConsolidatedPDF(organization: any, forecastSummary: any, varianceMatches: any[], options: ReportOptions): Promise<Buffer> {
    // This would use Puppeteer to generate a branded PDF
    // For now, return a mock buffer
    return Buffer.from('Mock PDF content for consolidated report')
  }

  private async generateProjectPDF(projects: any[], options: ReportOptions): Promise<Buffer> {
    // This would use Puppeteer to generate a PDF
    // For now, return a mock buffer
    return Buffer.from('Mock PDF content for project report')
  }

  private async saveFile(content: string | Buffer, filename: string, mimeType: string): Promise<string> {
    // In a real implementation, this would save to cloud storage (S3, etc.)
    // For now, return a mock URL
    const timestamp = Date.now()
    return `/api/files/${timestamp}-${filename}`
  }
}
