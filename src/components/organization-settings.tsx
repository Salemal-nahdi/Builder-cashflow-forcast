'use client'

import { useState } from 'react'

interface Organization {
  id: string
  name: string
  settings: {
    id: string
    logoUrl: string | null
    primaryColor: string | null
    secondaryColor: string | null
    defaultRetentionPercentage: number | null
    defaultRetentionReleaseDays: number | null
    defaultForecastMonths: number | null
    defaultAccountingBasis: string | null
    digestFrequency: string | null
    digestDay: number | null
  } | null
}

interface OrganizationSettingsProps {
  organization: Organization
}

export function OrganizationSettings({ organization }: OrganizationSettingsProps) {
  const [formData, setFormData] = useState({
    name: organization.name,
    logoUrl: organization.settings?.logoUrl || '',
    primaryColor: organization.settings?.primaryColor || '#3B82F6',
    secondaryColor: organization.settings?.secondaryColor || '#1E40AF',
    defaultRetentionPercentage: organization.settings?.defaultRetentionPercentage || 5.0,
    defaultRetentionReleaseDays: organization.settings?.defaultRetentionReleaseDays || 84,
    defaultForecastMonths: organization.settings?.defaultForecastMonths || 24,
    defaultAccountingBasis: organization.settings?.defaultAccountingBasis || 'accrual',
    digestFrequency: organization.settings?.digestFrequency || 'weekly',
    digestDay: organization.settings?.digestDay || 1,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/settings/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage('Settings saved successfully!')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Organization Settings</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Organization Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Logo URL */}
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
          </label>
          <input
            type="url"
            id="logoUrl"
            value={formData.logoUrl}
            onChange={(e) => handleInputChange('logoUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/logo.png"
          />
        </div>

        {/* Brand Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="primaryColor"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="secondaryColor"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#1E40AF"
              />
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="defaultRetentionPercentage" className="block text-sm font-medium text-gray-700 mb-1">
              Default Retention %
            </label>
            <input
              type="number"
              id="defaultRetentionPercentage"
              value={formData.defaultRetentionPercentage}
              onChange={(e) => handleInputChange('defaultRetentionPercentage', parseFloat(e.target.value))}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="defaultRetentionReleaseDays" className="block text-sm font-medium text-gray-700 mb-1">
              Default Retention Days
            </label>
            <input
              type="number"
              id="defaultRetentionReleaseDays"
              value={formData.defaultRetentionReleaseDays}
              onChange={(e) => handleInputChange('defaultRetentionReleaseDays', parseInt(e.target.value))}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="defaultForecastMonths" className="block text-sm font-medium text-gray-700 mb-1">
              Default Forecast Months
            </label>
            <input
              type="number"
              id="defaultForecastMonths"
              value={formData.defaultForecastMonths}
              onChange={(e) => handleInputChange('defaultForecastMonths', parseInt(e.target.value))}
              min="1"
              max="60"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Accounting Basis */}
        <div>
          <label htmlFor="defaultAccountingBasis" className="block text-sm font-medium text-gray-700 mb-1">
            Default Accounting Basis
          </label>
          <select
            id="defaultAccountingBasis"
            value={formData.defaultAccountingBasis}
            onChange={(e) => handleInputChange('defaultAccountingBasis', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="accrual">Accrual Basis</option>
            <option value="cash">Cash Basis</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Choose how you want to view financial reports. Accrual shows income/expenses when invoiced, Cash shows when payment is received/made.
          </p>
        </div>

        {/* Digest Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="digestFrequency" className="block text-sm font-medium text-gray-700 mb-1">
              Digest Frequency
            </label>
            <select
              id="digestFrequency"
              value={formData.digestFrequency}
              onChange={(e) => handleInputChange('digestFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label htmlFor="digestDay" className="block text-sm font-medium text-gray-700 mb-1">
              Digest Day
            </label>
            <select
              id="digestDay"
              value={formData.digestDay}
              onChange={(e) => handleInputChange('digestDay', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={0}>Sunday</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}
