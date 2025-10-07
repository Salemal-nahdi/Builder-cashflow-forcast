import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProjectsPageClient } from '@/components/projects-page-client'

interface SearchParams {
  search?: string
  status?: string
  group?: string
}

interface ProjectsPageProps {
  searchParams: SearchParams
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId

  // Build where clause based on search params
  const where: any = { organizationId }
  
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } },
    ]
  }
  
  if (searchParams.status) {
    where.status = searchParams.status
  }
  
  if (searchParams.group) {
    where.projectGroupId = searchParams.group
  }

  // Get projects with related data
  const [projects, projectGroups] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        projectGroup: true,
        milestones: {
          where: { status: { in: ['pending', 'invoiced'] } },
          orderBy: { expectedDate: 'asc' },
        },
        supplierClaims: {
          where: { status: { in: ['pending', 'invoiced'] } },
          orderBy: { expectedDate: 'asc' },
        },
        _count: {
          select: {
            milestones: true,
            supplierClaims: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.projectGroup.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    }),
  ])

  // Get organization for header
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  return (
    <ProjectsPageClient
      projects={projects}
      projectGroups={projectGroups}
      organization={organization}
      searchParams={searchParams}
    />
  )
}
