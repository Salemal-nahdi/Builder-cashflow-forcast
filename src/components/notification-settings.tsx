'use client'

import { useState } from 'react'

interface NotificationRule {
  id: string
  name: string
  description: string | null
  triggerType: string
  conditions: any
  emailEnabled: boolean
  emailTemplate: string | null
  isActive: boolean
}

interface NotificationSettingsProps {
  organizationId: string
  notificationRules: NotificationRule[]
}

export function NotificationSettings({ organizationId, notificationRules }: NotificationSettingsProps) {
  const [rules, setRules] = useState(notificationRules)
  const [isCreating, setIsCreating] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    triggerType: 'late_receipt',
    conditions: {},
    emailEnabled: true,
  })

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/notifications/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRule),
      })

      if (response.ok) {
        const createdRule = await response.json()
        setRules(prev => [...prev, createdRule])
        setNewRule({
          name: '',
          description: '',
          triggerType: 'late_receipt',
          conditions: {},
          emailEnabled: true,
        })
      } else {
        throw new Error('Failed to create notification rule')
      }
    } catch (error) {
      console.error('Error creating notification rule:', error)
      alert('Failed to create notification rule. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/notifications/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        setRules(prev => prev.map(rule => 
          rule.id === ruleId ? { ...rule, isActive } : rule
        ))
      } else {
        throw new Error('Failed to update notification rule')
      }
    } catch (error) {
      console.error('Error updating notification rule:', error)
      alert('Failed to update notification rule. Please try again.')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this notification rule?')) {
      return
    }

    try {
      const response = await fetch(`/api/notifications/rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId))
      } else {
        throw new Error('Failed to delete notification rule')
      }
    } catch (error) {
      console.error('Error deleting notification rule:', error)
      alert('Failed to delete notification rule. Please try again.')
    }
  }

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'late_receipt':
        return 'Late Receipt'
      case 'upcoming_outflow':
        return 'Upcoming Outflow'
      case 'negative_balance':
        return 'Negative Balance'
      case 'variance_threshold':
        return 'Variance Threshold'
      default:
        return type
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Notification Rules</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure email alerts for important cashflow events
        </p>
      </div>
      
      <div className="p-6">
        {/* Create New Rule */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Create New Rule</h3>
          
          <form onSubmit={handleCreateRule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="triggerType" className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Type
                </label>
                <select
                  id="triggerType"
                  value={newRule.triggerType}
                  onChange={(e) => setNewRule(prev => ({ ...prev, triggerType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="late_receipt">Late Receipt</option>
                  <option value="upcoming_outflow">Upcoming Outflow</option>
                  <option value="negative_balance">Negative Balance</option>
                  <option value="variance_threshold">Variance Threshold</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe when this rule should trigger..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailEnabled"
                checked={newRule.emailEnabled}
                onChange={(e) => setNewRule(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailEnabled" className="ml-2 text-sm text-gray-700">
                Send email notifications
              </label>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Rule'}
            </button>
          </form>
        </div>

        {/* Existing Rules */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Existing Rules</h3>
          
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No notification rules configured yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">{rule.name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Type: {getTriggerTypeLabel(rule.triggerType)}</span>
                        <span>Email: {rule.emailEnabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleRule(rule.id, !rule.isActive)}
                        className={`px-3 py-1 text-xs rounded-md ${
                          rule.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {rule.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Delete
                      </button>
                    </div>
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
