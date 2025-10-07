'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SimpleAddProjectModal } from './simple-add-project-modal'

interface DashboardClientProps {
  organization: any
  xeroConnection: any
  projects: any[]
  cashflowSummary: any
  children: React.ReactNode
}

export function DashboardClient({
  organization,
  xeroConnection,
  projects,
  cashflowSummary,
  children
}: DashboardClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                <p className="text-gray-600">Cashflow Dashboard</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Project
                </button>
                {xeroConnection ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Connected to {xeroConnection.xeroOrgName}
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/settings/xero"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Connect Xero
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Settings
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

        {/* Main Content */}
        {children}
      </div>

      {/* Add Project Modal */}
      <SimpleAddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  )
}

