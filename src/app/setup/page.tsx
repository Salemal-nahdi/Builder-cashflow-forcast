'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [credentials, setCredentials] = useState<any>(null)
  const router = useRouter()

  const handleSetup = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.status === 'success' || data.status === 'already_setup') {
        setMessage(data.message)
        setCredentials(data.credentials)
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        setMessage(`Error: ${data.message}`)
      }
    } catch (error) {
      setMessage('Setup failed. Please try again.')
      console.error('Setup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Builder Forecasting
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click the button below to set up your account
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={handleSetup}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting up...' : 'Set Up Account'}
          </button>

          {message && (
            <div className={`mt-4 p-4 rounded-md ${
              message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}>
              <p className="text-sm font-medium">{message}</p>
              
              {credentials && (
                <div className="mt-3 text-sm">
                  <p className="font-bold">Your Login Credentials:</p>
                  <p>Email: {credentials.email}</p>
                  <p>Password: {credentials.password}</p>
                  <p className="mt-2 text-xs">Save these credentials!</p>
                </div>
              )}

              {!message.includes('Error') && (
                <p className="mt-2 text-xs">Redirecting to sign in...</p>
              )}
            </div>
          )}

          <div className="text-center">
            <a href="/auth/signin" className="text-sm text-blue-600 hover:text-blue-500">
              Already set up? Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
