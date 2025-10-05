import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProjectCard } from '@/components/project-card'
import { ProjectFilters } from '@/components/project-filters'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600">{organization?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/auth/signout"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <ProjectFilters 
            projectGroups={projectGroups}
            currentFilters={searchParams}
          />
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchParams.search || searchParams.status || searchParams.group
                ? 'Try adjusting your filters to see more projects.'
                : 'Projects will appear here after syncing with Xero.'}
            </p>
            {!searchParams.search && !searchParams.status && !searchParams.group && (
              <div className="mt-6">
                <Link
                  href="/api/xero/sync"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sync with Xero
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${projects.reduce((sum, p) => sum + (Number(p.contractValue) || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-600">Pending Milestones</p>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.reduce((sum, p) => sum + p.milestones.length, 0)}
                </p>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
