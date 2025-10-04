'use client'

import { useState } from 'react'

export function XeroConnectButton() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    
    try {
      // Generate state parameter for security
      const state = Math.random().toString(36).substring(7)
      
      // Build Xero OAuth URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.NEXT_PUBLIC_XERO_CLIENT_ID || '',
        redirect_uri: process.env.NEXT_PUBLIC_XERO_REDIRECT_URI || '',
        scope: 'accounting.transactions.read accounting.contacts.read projects.read offline_access',
        state,
      })

      const xeroUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`
      
      // Redirect to Xero
      window.location.href = xeroUrl
    } catch (error) {
      console.error('Error connecting to Xero:', error)
      setIsConnecting(false)
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Connect Xero
        </>
      )}
    </button>
  )
}
