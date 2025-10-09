import { prisma } from './prisma'
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns'

interface MonthData {
  month: string // "2025-01"
  income: number
  costs: number
  net: number
}

interface ProjectForecast {
  id: string
  name: string
  months: MonthData[]
}

interface ForecastTotals {
  month: string
  income: number
  costs: number
  net: number
  balance: number
}

export interface ForecastData {
  projects: ProjectForecast[]
  totals: ForecastTotals[]
}

export class ForecastEngine {
  constructor(
    private organizationId: string,
    private startDate: Date,
    private endDate: Date,
    private startingBalance: number
  ) {}

  /**
   * Calculate cashflow forecast by project
   */
  async calculateForecast(): Promise<ForecastData> {
    // Get all projects with their milestones and costs
    const projects = await prisma.project.findMany({
      where: { organizationId: this.organizationId },
      include: {
        milestones: {
          where: {
            expectedDate: {
              gte: this.startDate,
              lte: this.endDate
            }
          }
        },
        costs: {
          where: {
            expectedDate: {
              gte: this.startDate,
              lte: this.endDate
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Generate month list
    const months = this.getMonthsBetween(this.startDate, this.endDate)

    // Calculate for each project
    const projectForecasts: ProjectForecast[] = projects.map(project => {
      const monthsData: MonthData[] = months.map(month => {
        const monthStart = new Date(month + '-01')
        const monthEnd = endOfMonth(monthStart)

        // Sum milestones in this month
        const income = project.milestones
          .filter(m => {
            const date = new Date(m.expectedDate)
            return date >= monthStart && date <= monthEnd
          })
          .reduce((sum, m) => sum + Number(m.amount), 0)

        // Sum costs in this month
        const costs = project.costs
          .filter(c => {
            const date = new Date(c.expectedDate)
            return date >= monthStart && date <= monthEnd
          })
          .reduce((sum, c) => sum + Number(c.amount), 0)

        return {
          month,
          income,
          costs,
          net: income - costs
        }
      })

      return {
        id: project.id,
        name: project.name,
        months: monthsData
      }
    })

    // Calculate totals
    const totals: ForecastTotals[] = []
    let runningBalance = this.startingBalance

    months.forEach(month => {
      const monthIncome = projectForecasts.reduce(
        (sum, p) => sum + (p.months.find(m => m.month === month)?.income || 0),
        0
      )
      const monthCosts = projectForecasts.reduce(
        (sum, p) => sum + (p.months.find(m => m.month === month)?.costs || 0),
        0
      )
      const monthNet = monthIncome - monthCosts
      runningBalance += monthNet

      totals.push({
        month,
        income: monthIncome,
        costs: monthCosts,
        net: monthNet,
        balance: runningBalance
      })
    })

    return {
      projects: projectForecasts,
      totals
    }
  }

  /**
   * Get array of months between start and end date
   * Returns ["2025-01", "2025-02", ...]
   */
  private getMonthsBetween(start: Date, end: Date): string[] {
    const months: string[] = []
    let current = startOfMonth(start)
    const endMonth = startOfMonth(end)

    while (current <= endMonth) {
      months.push(format(current, 'yyyy-MM'))
      current = addMonths(current, 1)
    }

    return months
  }
}

