import { prisma } from './prisma'
import { ForecastEngine } from './forecast-engine'
import { ReconciliationEngine } from './reconciliation-engine'
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns'

export interface NotificationData {
  type: 'late_receipt' | 'upcoming_outflow' | 'negative_balance' | 'variance_threshold' | 'weekly_digest'
  title: string
  message: string
  data: any
  priority: 'low' | 'medium' | 'high'
}

export class NotificationEngine {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  async checkAndSendNotifications(): Promise<void> {
    const rules = await prisma.notificationRule.findMany({
      where: {
        organizationId: this.organizationId,
        isActive: true,
      },
    })

    for (const rule of rules) {
      try {
        await this.processNotificationRule(rule)
      } catch (error) {
        console.error(`Error processing notification rule ${rule.id}:`, error)
      }
    }
  }

  private async processNotificationRule(rule: any): Promise<void> {
    switch (rule.triggerType) {
      case 'late_receipt':
        await this.checkLateReceipts(rule)
        break
      case 'upcoming_outflow':
        await this.checkUpcomingOutflows(rule)
        break
      case 'negative_balance':
        await this.checkNegativeBalance(rule)
        break
      case 'variance_threshold':
        await this.checkVarianceThreshold(rule)
        break
    }
  }

  private async checkLateReceipts(rule: any): Promise<void> {
    const conditions = rule.conditions as any
    const daysOverdue = conditions.daysOverdue || 7

    // Get overdue milestones
    const overdueMilestones = await prisma.milestone.findMany({
      where: {
        project: { organizationId: this.organizationId },
        status: { in: ['pending', 'invoiced'] },
        expectedDate: {
          lt: new Date(Date.now() - daysOverdue * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        project: true,
      },
    })

    if (overdueMilestones.length > 0) {
      const notification = await this.createNotification({
        type: 'late_receipt',
        title: 'Overdue Receipts Alert',
        message: `${overdueMilestones.length} milestone(s) are overdue by more than ${daysOverdue} days`,
        data: {
          overdueMilestones: overdueMilestones.map(m => ({
            id: m.id,
            name: m.name,
            project: m.project.name,
            expectedDate: m.expectedDate,
            amount: m.amount,
            daysOverdue: Math.ceil((Date.now() - m.expectedDate.getTime()) / (1000 * 60 * 60 * 24)),
          })),
        },
        priority: 'high',
      })

      if (rule.emailEnabled) {
        await this.sendEmailNotification(notification, rule.emailTemplate)
      }
    }
  }

  private async checkUpcomingOutflows(rule: any): Promise<void> {
    const conditions = rule.conditions as any
    const amountThreshold = conditions.amountThreshold || 10000
    const daysAhead = conditions.daysAhead || 3

    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)

    // Get upcoming large outflows
    const upcomingOutflows = await prisma.cashEvent.findMany({
      where: {
        organizationId: this.organizationId,
        type: 'outgo',
        scheduledDate: {
          lte: futureDate,
          gte: new Date(),
        },
        amount: {
          gte: amountThreshold,
        },
        status: 'scheduled',
      },
      include: {
        project: true,
      },
    })

    if (upcomingOutflows.length > 0) {
      const notification = await this.createNotification({
        type: 'upcoming_outflow',
        title: 'Large Outflows Alert',
        message: `${upcomingOutflows.length} large payment(s) due within ${daysAhead} days`,
        data: {
          upcomingOutflows: upcomingOutflows.map(o => ({
            id: o.id,
            amount: o.amount,
            scheduledDate: o.scheduledDate,
            project: o.project?.name || 'Overhead',
            sourceType: o.sourceType,
          })),
        },
        priority: 'medium',
      })

      if (rule.emailEnabled) {
        await this.sendEmailNotification(notification, rule.emailTemplate)
      }
    }
  }

  private async checkNegativeBalance(rule: any): Promise<void> {
    // Get forecast for next 3 months
    const startDate = new Date()
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

    const forecastEngine = new ForecastEngine(this.organizationId, startDate, endDate)
    const periods = await forecastEngine.generateForecast()

    // Check for negative balance periods
    const negativePeriods = periods.filter(p => p.balance < 0)

    if (negativePeriods.length > 0) {
      const notification = await this.createNotification({
        type: 'negative_balance',
        title: 'Negative Balance Warning',
        message: `Projected negative balance in ${negativePeriods.length} month(s)`,
        data: {
          negativePeriods: negativePeriods.map(p => ({
            month: format(p.startDate, 'MMM yyyy'),
            balance: p.balance,
            net: p.net,
          })),
        },
        priority: 'high',
      })

      if (rule.emailEnabled) {
        await this.sendEmailNotification(notification, rule.emailTemplate)
      }
    }
  }

  private async checkVarianceThreshold(rule: any): Promise<void> {
    const conditions = rule.conditions as any
    const amountThreshold = conditions.amountThreshold || 5000
    const timingThreshold = conditions.timingThreshold || 14

    const reconciliationEngine = new ReconciliationEngine(this.organizationId)
    const varianceMatches = await reconciliationEngine.getVarianceMatches({
      confidenceThreshold: 0.6,
    })

    // Find significant variances
    const significantVariances = varianceMatches.filter(m => 
      Math.abs(m.amountVariance) >= amountThreshold || 
      Math.abs(m.timingVariance) >= timingThreshold
    )

    if (significantVariances.length > 0) {
      const notification = await this.createNotification({
        type: 'variance_threshold',
        title: 'Significant Variance Alert',
        message: `${significantVariances.length} item(s) with significant variance`,
        data: {
          significantVariances: significantVariances.map(v => ({
            id: v.id,
            amountVariance: v.amountVariance,
            timingVariance: v.timingVariance,
            confidenceScore: v.confidenceScore,
            project: v.cashEvent?.project?.name || 'No Project',
          })),
        },
        priority: 'medium',
      })

      if (rule.emailEnabled) {
        await this.sendEmailNotification(notification, rule.emailTemplate)
      }
    }
  }

  async sendWeeklyDigest(): Promise<void> {
    const organization = await prisma.organization.findUnique({
      where: { id: this.organizationId },
      include: {
        settings: true,
        users: {
          where: {
            roleAssignments: {
              some: {
                role: { in: ['management', 'finance'] },
              },
            },
          },
        },
      },
    })

    if (!organization?.settings?.digestFrequency || organization.settings.digestFrequency !== 'weekly') {
      return
    }

    // Get data for the past week
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }) // Sunday

    // Get forecast summary
    const forecastEngine = new ForecastEngine(this.organizationId, weekStart, weekEnd)
    const forecastSummary = await forecastEngine.getCashflowSummary()

    // Get recent variance matches
    const reconciliationEngine = new ReconciliationEngine(this.organizationId)
    const recentVariances = await reconciliationEngine.getVarianceMatches()

    // Get upcoming milestones
    const upcomingMilestones = await prisma.milestone.findMany({
      where: {
        project: { organizationId: this.organizationId },
        status: 'pending',
        expectedDate: {
          lte: addDays(new Date(), 14), // Next 2 weeks
        },
      },
      include: {
        project: true,
      },
      orderBy: { expectedDate: 'asc' },
      take: 10,
    })

    const notification = await this.createNotification({
      type: 'weekly_digest',
      title: 'Weekly Cashflow Digest',
      message: `Weekly summary for ${organization.name}`,
      data: {
        weekStart: format(weekStart, 'MMM dd, yyyy'),
        weekEnd: format(weekEnd, 'MMM dd, yyyy'),
        forecastSummary,
        recentVariances: recentVariances.slice(0, 5), // Top 5
        upcomingMilestones,
      },
      priority: 'low',
    })

    // Send to management and finance users
    for (const user of organization.users) {
      await this.sendEmailNotification(notification, null, user.email)
    }
  }

  private async createNotification(notificationData: NotificationData): Promise<any> {
    return await prisma.notification.create({
      data: {
        organizationId: this.organizationId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        status: 'pending',
      },
    })
  }

  private async sendEmailNotification(notification: any, template?: string, recipientEmail?: string): Promise<void> {
    try {
      // In a real implementation, you would use a service like SendGrid, SES, or Nodemailer
      // For now, we'll just log the notification
      console.log('Email notification:', {
        to: recipientEmail || 'organization-users',
        subject: notification.title,
        body: notification.message,
        data: notification.data,
      })

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          emailSent: true,
          emailSentAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error sending email notification:', error)
      
      // Update notification status to failed
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
        },
      })
    }
  }

  async getNotificationHistory(limit: number = 50): Promise<any[]> {
    return await prisma.notification.findMany({
      where: { organizationId: this.organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async createNotificationRule(ruleData: {
    name: string
    description?: string
    triggerType: string
    conditions: any
    emailEnabled: boolean
    emailTemplate?: string
  }): Promise<any> {
    return await prisma.notificationRule.create({
      data: {
        organizationId: this.organizationId,
        name: ruleData.name,
        description: ruleData.description,
        triggerType: ruleData.triggerType,
        conditions: ruleData.conditions,
        emailEnabled: ruleData.emailEnabled,
        emailTemplate: ruleData.emailTemplate,
      },
    })
  }
}
