import { prisma } from './prisma'

export async function getOrganizationId(): Promise<string> {
  let org = await prisma.organization.findFirst()
  
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'My Company',
        settings: {}
      }
    })
  }
  
  return org.id
}
