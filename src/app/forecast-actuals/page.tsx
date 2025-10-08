import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ForecastActualsPage } from '@/components/forecast-actuals-page'

export default async function ForecastActualsPageRoute() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ForecastActualsPage />
      </div>
    </div>
  )
}
