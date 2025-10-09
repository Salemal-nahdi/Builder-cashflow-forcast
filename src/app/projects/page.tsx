import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/projects`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading projects</p>
        </div>
      </div>
    )
  }

  const projects = await response.json()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Add Project
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <Link
            href="/projects/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Add Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              <div className="text-2xl font-bold text-blue-600 mb-4">
                ${Number(project.contractValue).toLocaleString()}
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Start:</span>
                  <span className="font-medium">{format(new Date(project.startDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>End:</span>
                  <span className="font-medium">{format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span>Milestones:</span>
                  <span className="font-medium">{project.milestones.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costs:</span>
                  <span className="font-medium">{project.costs.length}</span>
                </div>
                {project.xeroMaps.length > 0 && (
                  <div className="pt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Linked to Xero
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

