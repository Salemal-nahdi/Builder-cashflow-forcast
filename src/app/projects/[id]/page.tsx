import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { MilestoneCard } from '@/components/milestone-card'
import { SupplierClaimCard } from '@/components/supplier-claim-card'
import { ProjectTimeline } from '@/components/project-timeline'
import { ProjectXeroMappingWidget } from '@/components/project-xero-mapping-widget'

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId

  // Get project with all related data
  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      organizationId,
    },
    include: {
      projectGroup: true,
      milestones: {
        orderBy: { expectedDate: 'asc' },
      },
      supplierClaims: {
        orderBy: { expectedDate: 'asc' },
      },
      materialOrders: {
        orderBy: { expectedDate: 'asc' },
      },
      cashEvents: {
        where: { scenarioId: null }, // Base scenario only
        orderBy: { scheduledDate: 'asc' },
      },
      xeroTrackingMaps: {
        include: {
          trackingOption: {
            include: {
              category: true
            }
          }
        }
      },
      xeroContactMap: {
        include: {
          contact: true
        }
      },
    },
  })

  // Get Xero connection and tracking categories if available
  const xeroConnection = await prisma.xeroConnection.findFirst({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      trackingCategories: {
        include: {
          options: true
        }
      },
      contacts: {
        where: {
          status: 'ACTIVE'
        },
        orderBy: {
          name: 'asc'
        }
      }
    }
  })

  if (!project) {
    notFound()
  }

  // Calculate project stats
  const totalMilestones = project.milestones.length
  const completedMilestones = project.milestones.filter(m => m.status === 'paid').length
  const totalSupplierClaims = project.supplierClaims.length
  const paidSupplierClaims = project.supplierClaims.filter(c => c.status === 'paid').length
  const totalMaterialOrders = project.materialOrders.length
  const receivedMaterialOrders = project.materialOrders.filter(o => o.status === 'received').length

  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/projects"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Projects
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Project Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contract Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {project.contractValue ? `$${project.contractValue.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-lg text-gray-900">
                    {project.startDate ? format(project.startDate, 'MMM dd, yyyy') : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-lg text-gray-900">
                    {project.endDate ? format(project.endDate, 'MMM dd, yyyy') : 'Not set'}
                  </p>
                </div>
              </div>

              {project.projectGroup && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-600">Project Group</p>
                  <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: project.projectGroup.color || '#6B7280' }}
                  >
                    {project.projectGroup.name}
                  </span>
                </div>
              )}

              {project.retentionPercentage && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-600">Retention</p>
                  <p className="text-lg text-gray-900">
                    {Number(project.retentionPercentage)}% held for {project.retentionReleaseDays || 84} days
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Project Stats */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Stats</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Milestones</span>
                  <span className="text-sm text-gray-900">
                    {completedMilestones}/{totalMilestones} complete
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Supplier Claims</span>
                  <span className="text-sm text-gray-900">
                    {paidSupplierClaims}/{totalSupplierClaims} paid
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Material Orders</span>
                  <span className="text-sm text-gray-900">
                    {receivedMaterialOrders}/{totalMaterialOrders} received
                  </span>
                </div>
              </div>
            </div>

            {/* Xero Integration Widget */}
            {xeroConnection && (
              <div className="mt-8">
                <ProjectXeroMappingWidget
                  projectId={project.id}
                  currentMappings={project.xeroTrackingMaps}
                  currentContact={project.xeroContactMap}
                  trackingCategories={xeroConnection.trackingCategories}
                  contacts={xeroConnection.contacts}
                />
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <ProjectTimeline project={project} />
        </div>

        {/* Milestones */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Milestones</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Milestone
            </button>
          </div>
          
          {project.milestones.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-600">No milestones yet. Add your first milestone to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </div>

        {/* Supplier Claims */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Supplier Claims</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Claim
            </button>
          </div>
          
          {project.supplierClaims.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-600">No supplier claims yet. Add your first claim to track payments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.supplierClaims.map((claim) => (
                <SupplierClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          )}
        </div>

        {/* Material Orders */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Material Orders</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Order
            </button>
          </div>
          
          {project.materialOrders.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-600">No material orders yet. Add your first order to track materials.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.materialOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-900">{order.supplierName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                  <p className="text-lg font-bold text-gray-900">${order.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    Expected: {format(order.expectedDate, 'MMM dd, yyyy')}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.status === 'received' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'ordered' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
