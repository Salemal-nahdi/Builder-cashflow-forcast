import { prisma } from '../prisma'
import { getXeroClient, refreshXeroToken } from './client'

/**
 * Sync data from Xero
 * Pulls invoices → milestones and bills → costs
 */
export async function syncXeroData(organizationId: string) {
  // Get Xero connection
  const connection = await prisma.xeroConnection.findFirst({
    where: {
      organizationId,
      isActive: true
    }
  })

  if (!connection) {
    throw new Error('No active Xero connection found')
  }

  // Check if token needs refresh
  let accessToken = connection.accessToken
  let refreshToken = connection.refreshToken

  if (new Date() >= connection.expiresAt) {
    const newTokens = await refreshXeroToken(connection.refreshToken)
    accessToken = newTokens.accessToken
    refreshToken = newTokens.refreshToken

    await prisma.xeroConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.expiresAt
      }
    })
  }

  // Get Xero client
  const { xero, tenantId } = await getXeroClient(accessToken, refreshToken, connection.tenantId)

  // Sync tracking categories first (needed for mapping)
  await syncTrackingCategories(xero, tenantId, organizationId)

  // Get project mappings
  const projectMaps = await prisma.xeroProjectMap.findMany({
    where: {
      project: {
        organizationId
      }
    },
    include: {
      project: true,
      trackingOption: {
        include: {
          category: true
        }
      }
    }
  })

  let invoicesSynced = 0
  let billsSynced = 0

  // Sync invoices for each mapped project
  for (const map of projectMaps) {
    // Get invoices with this tracking category
    const invoicesResponse = await xero.accountingApi.getInvoices(tenantId, undefined, undefined, undefined, undefined, undefined, undefined, [map.trackingOption.xeroId])
    
    if (invoicesResponse.body.invoices) {
      for (const invoice of invoicesResponse.body.invoices) {
        // Skip if not approved or not invoice
        if (!invoice.type || invoice.type.toString() !== 'ACCREC' || !invoice.status || invoice.status.toString() === 'DRAFT' || invoice.status.toString() === 'DELETED') {
          continue
        }

        // Check if milestone already exists
        const existingMilestone = await prisma.milestone.findFirst({
          where: { xeroInvoiceId: invoice.invoiceID }
        })

        if (!existingMilestone) {
          // Create milestone
          await prisma.milestone.create({
            data: {
              projectId: map.projectId,
              name: `Invoice ${invoice.invoiceNumber || invoice.reference || ''}`,
              amount: invoice.total || 0,
              expectedDate: invoice.dueDate || invoice.date || new Date(),
              status: invoice.status?.toString() === 'PAID' ? 'paid' : 'invoiced',
              xeroInvoiceId: invoice.invoiceID
            }
          })
          invoicesSynced++
        } else {
          // Update existing milestone
          await prisma.milestone.update({
            where: { id: existingMilestone.id },
            data: {
              amount: invoice.total || 0,
              expectedDate: invoice.dueDate || invoice.date || new Date(),
              status: invoice.status?.toString() === 'PAID' ? 'paid' : 'invoiced'
            }
          })
        }
      }
    }

    // Get bills with this tracking category
    const billsResponse = await xero.accountingApi.getInvoices(tenantId, undefined, undefined, undefined, undefined, undefined, undefined, [map.trackingOption.xeroId])
    
    if (billsResponse.body.invoices) {
      for (const bill of billsResponse.body.invoices) {
        // Skip if not bill
        if (!bill.type || bill.type.toString() !== 'ACCPAY' || !bill.status || bill.status.toString() === 'DRAFT' || bill.status.toString() === 'DELETED') {
          continue
        }

        // Check if cost already exists
        const existingCost = await prisma.cost.findFirst({
          where: { xeroBillId: bill.invoiceID }
        })

        if (!existingCost) {
          // Create cost
          await prisma.cost.create({
            data: {
              projectId: map.projectId,
              description: `Bill ${bill.invoiceNumber || bill.reference || ''}`,
              amount: bill.total || 0,
              expectedDate: bill.dueDate || bill.date || new Date(),
              vendor: bill.contact?.name,
              status: bill.status?.toString() === 'PAID' ? 'paid' : 'billed',
              xeroBillId: bill.invoiceID
            }
          })
          billsSynced++
        } else {
          // Update existing cost
          await prisma.cost.update({
            where: { id: existingCost.id },
            data: {
              amount: bill.total || 0,
              expectedDate: bill.dueDate || bill.date || new Date(),
              vendor: bill.contact?.name,
              status: bill.status?.toString() === 'PAID' ? 'paid' : 'billed'
            }
          })
        }
      }
    }
  }

  // Update last sync time
  await prisma.xeroConnection.update({
    where: { id: connection.id },
    data: { lastSyncAt: new Date() }
  })

  return {
    invoicesSynced,
    billsSynced
  }
}

/**
 * Sync tracking categories from Xero
 */
async function syncTrackingCategories(xero: any, tenantId: string, organizationId: string) {
  const response = await xero.accountingApi.getTrackingCategories(tenantId)

  if (response.body.trackingCategories) {
    for (const category of response.body.trackingCategories) {
      // Upsert category
      const dbCategory = await prisma.xeroTrackingCategory.upsert({
        where: {
          organizationId_xeroId: {
            organizationId,
            xeroId: category.trackingCategoryID!
          }
        },
        create: {
          organizationId,
          xeroId: category.trackingCategoryID!,
          name: category.name!,
          status: category.status!
        },
        update: {
          name: category.name!,
          status: category.status!
        }
      })

      // Upsert options
      if (category.options) {
        for (const option of category.options) {
          await prisma.xeroTrackingOption.upsert({
            where: {
              categoryId_xeroId: {
                categoryId: dbCategory.id,
                xeroId: option.trackingOptionID!
              }
            },
            create: {
              categoryId: dbCategory.id,
              xeroId: option.trackingOptionID!,
              name: option.name!,
              status: option.status!
            },
            update: {
              name: option.name!,
              status: option.status!
            }
          })
        }
      }
    }
  }
}

