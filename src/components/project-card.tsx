'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Decimal } from '@prisma/client/runtime/library'

interface Project {
  id: string
  name: string
  description: string | null
  contractValue: Decimal | null
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
    amount: Decimal | null
  }>
  supplierClaims: Array<{
    id: string
    supplierName: string
    expectedDate: Date
    status: string
    amount: Decimal
  }>
  xeroTrackingMaps?: Array<{
    id: string
  }>
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(false)
  }
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
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 relative group">
      <Link href={`/projects/${project.id}`} className="block">
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
              {project.xeroTrackingMaps && project.xeroTrackingMaps.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Linked to Xero
                </span>
              )}
            </div>
          </div>
        </div>

        {project.contractValue && (
          <div className="mb-4">
            <p className="text-2xl font-bold text-gray-900">
              ${Number(project.contractValue).toLocaleString()}
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
      </Link>

      {/* Delete Button */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {!showConfirm ? (
          <button
            onClick={handleDelete}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            title="Delete project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-lg border border-red-200">
            <span className="text-sm text-gray-700 whitespace-nowrap">Delete?</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </button>
            <button
              onClick={cancelDelete}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
