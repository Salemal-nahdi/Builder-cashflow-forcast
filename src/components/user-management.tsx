'use client'

import { useState } from 'react'

interface User {
  id: string
  name: string | null
  email: string
  roleAssignments: Array<{
    id: string
    role: string
    projectId: string | null
  }>
}

interface UserManagementProps {
  organizationId: string
  users: User[]
  currentUserId: string
}

export function UserManagement({ organizationId, users, currentUserId }: UserManagementProps) {
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('pm')

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (response.ok) {
        setInviteEmail('')
        setInviteRole('pm')
        alert('Invitation sent successfully!')
      } else {
        throw new Error('Failed to send invitation')
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      alert('Failed to send invitation. Please try again.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // Refresh the page to show updated roles
        window.location.reload()
      } else {
        throw new Error('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role. Please try again.')
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the page to show updated user list
        window.location.reload()
      } else {
        throw new Error('Failed to remove user')
      }
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Failed to remove user. Please try again.')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'management':
        return 'Management'
      case 'finance':
        return 'Finance'
      case 'pm':
        return 'Project Manager'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'management':
        return 'bg-purple-100 text-purple-800'
      case 'finance':
        return 'bg-blue-100 text-blue-800'
      case 'pm':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage user access and roles for your organization
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Invite User */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Invite New User</h3>
          
          <form onSubmit={handleInviteUser} className="flex items-end space-x-4">
            <div className="flex-1">
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="w-48">
              <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pm">Project Manager</option>
                <option value="finance">Finance</option>
                <option value="management">Management</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isInviting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInviting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>

        {/* User List */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Organization Users</h3>
          
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="flex space-x-2">
                          {user.roleAssignments.map((assignment) => (
                            <span
                              key={assignment.id}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(assignment.role)}`}
                            >
                              {getRoleLabel(assignment.role)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {user.id !== currentUserId && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={user.roleAssignments[0]?.role || 'pm'}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        >
                          <option value="pm">Project Manager</option>
                          <option value="finance">Finance</option>
                          <option value="management">Management</option>
                        </select>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
