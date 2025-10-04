import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ForecastEngine } from '@/lib/forecast-engine'
import { ReconciliationEngine } from '@/lib/reconciliation-engine'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  try {
    // Get organization data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        settings: true,
        projects: {
          include: {
            projectGroup: true,
            _count: {
              select: {
                milestones: true,
                supplierClaims: true,
                materialOrders: true,
              },
            },
          },
        },
      },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    // Get forecast summary
    const startDate = new Date()
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    const forecastEngine = new ForecastEngine(organizationId, startDate, endDate)
    const forecastSummary = await forecastEngine.getCashflowSummary()

    // Get variance data
    const reconciliationEngine = new ReconciliationEngine(organizationId)
    const varianceMatches = await reconciliationEngine.getVarianceMatches()

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Consolidated Report - ${organization.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3B82F6;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #3B82F6;
            }
            .report-title {
              font-size: 28px;
              margin: 10px 0;
              color: #1F2937;
            }
            .report-date {
              color: #6B7280;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1F2937;
              margin-bottom: 15px;
              border-left: 4px solid #3B82F6;
              padding-left: 10px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 20px;
            }
            .summary-card {
              background: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              padding: 15px;
            }
            .summary-label {
              font-size: 14px;
              color: #6B7280;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #1F2937;
            }
            .positive { color: #059669; }
            .negative { color: #DC2626; }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .table th,
            .table td {
              border: 1px solid #E5E7EB;
              padding: 8px 12px;
              text-align: left;
            }
            .table th {
              background: #F3F4F6;
              font-weight: bold;
              color: #374151;
            }
            .table tr:nth-child(even) {
              background: #F9FAFB;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-active { background: #D1FAE5; color: #065F46; }
            .status-completed { background: #DBEAFE; color: #1E40AF; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6B7280;
              font-size: 12px;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">${organization.name}</div>
            <div class="report-title">Consolidated Cashflow Report</div>
            <div class="report-date">Generated on ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">Total Income (12 months)</div>
                <div class="summary-value positive">$${forecastSummary.totalIncome.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Outgo (12 months)</div>
                <div class="summary-value negative">$${forecastSummary.totalOutgo.toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Net Cashflow</div>
                <div class="summary-value ${forecastSummary.netCashflow >= 0 ? 'positive' : 'negative'}">
                  $${forecastSummary.netCashflow.toLocaleString()}
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Lowest Balance</div>
                <div class="summary-value ${forecastSummary.lowestBalance >= 0 ? 'positive' : 'negative'}">
                  $${forecastSummary.lowestBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Project Overview</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Contract Value</th>
                  <th>Milestones</th>
                  <th>Supplier Claims</th>
                  <th>Material Orders</th>
                </tr>
              </thead>
              <tbody>
                ${organization.projects.map(project => `
                  <tr>
                    <td>${project.name}</td>
                    <td><span class="status-badge status-${project.status}">${project.status}</span></td>
                    <td>$${project.contractValue?.toLocaleString() || '0'}</td>
                    <td>${project._count.milestones}</td>
                    <td>${project._count.supplierClaims}</td>
                    <td>${project._count.materialOrders}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Variance Analysis</div>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">Total Matches</div>
                <div class="summary-value">${varianceMatches.length}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">High Confidence</div>
                <div class="summary-value">${varianceMatches.filter(m => m.confidenceScore >= 0.8).length}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Average Amount Variance</div>
                <div class="summary-value">
                  $${varianceMatches.length > 0 ? (varianceMatches.reduce((sum, m) => sum + m.amountVariance, 0) / varianceMatches.length).toFixed(2) : '0.00'}
                </div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Average Timing Variance</div>
                <div class="summary-value">
                  ${varianceMatches.length > 0 ? Math.round(varianceMatches.reduce((sum, m) => sum + m.timingVariance, 0) / varianceMatches.length) : 0} days
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This report was generated by Builder Forecasting Software</p>
            <p>For questions about this report, please contact your finance team</p>
          </div>
        </body>
      </html>
    `

    // In a real implementation, you would use Puppeteer to convert HTML to PDF
    // For now, return the HTML content
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="consolidated-report-${new Date().toISOString().slice(0, 10)}.html"`,
      },
    })
  } catch (error) {
    console.error('Consolidated PDF export error:', error)
    return NextResponse.json({ 
      error: 'Failed to export consolidated report',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
