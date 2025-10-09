import { prisma } from './prisma'

/**
 * Get or create the default organization
 * Keeps things simple - one org per deployment
 */
export async function getOrganizationId(): Promise<string> {
  let organization = await prisma.organization.findFirst()
  
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'My Company',
        startingBalance: 100000 // Default $100k starting balance
      }
    })
  }
  
  return organization.id
}

