import Link from 'next/link'
import { format } from 'date-fns'

interface Project {
  id: string
  name: string
  description: string | null
  contractValue: number | null
  startDate: Date | null
  endDate: Date | null
  status: string
  projectGroup: {
    name: string
    color: string | null
  } | null
  milestones: Array<{
    id: string
    name: string
    expectedDate: Date
    status: string
    amount: number | null
  }>
  supplierClaims: Array<{
    id: string
    supplierName: string
    expectedDate: Date
    status: string
    amount: number
  }>
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const totalMilestones = project.milestones.length
  const pendingMilestones = project.milestones.filter(m => m.status === 'pending').length
  const totalSupplierClaims = project.supplierClaims.length
  const pendingSupplierClaims = project.supplierClaims.filter(c => c.status === 'pending').length

  const nextMilestone = project.milestones.find(m => m.status === 'pending')
  const nextSupplierClaim = project.supplierClaims.find(c => c.status === 'pending')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-gray-600 mb-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
              {project.projectGroup && (
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: project.projectGroup.color || '#6B7280' }}
                >
                  {project.projectGroup.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {project.contractValue && (
          <div className="mb-4">
            <p className="text-2xl font-bold text-gray-900">
              ${project.contractValue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Contract Value</p>
          </div>
        )}

        <div className="space-y-3">
          {/* Milestones */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Milestones</span>
              <span className="text-sm text-gray-600">
                {totalMilestones - pendingMilestones}/{totalMilestones} complete
              </span>
            </div>
            {nextMilestone && (
              <div className="text-sm text-gray-600">
                Next: {nextMilestone.name} - {format(nextMilestone.expectedDate, 'MMM dd, yyyy')}
              </div>
            )}
          </div>

          {/* Supplier Claims */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Supplier Claims</span>
              <span className="text-sm text-gray-600">
                {totalSupplierClaims - pendingSupplierClaims}/{totalSupplierClaims} paid
              </span>
            </div>
            {nextSupplierClaim && (
              <div className="text-sm text-gray-600">
                Next: {nextSupplierClaim.supplierName} - {format(nextSupplierClaim.expectedDate, 'MMM dd, yyyy')}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(((totalMilestones - pendingMilestones) / totalMilestones) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((totalMilestones - pendingMilestones) / totalMilestones) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  )
}
