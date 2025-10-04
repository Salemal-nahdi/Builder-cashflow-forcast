import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  // Check if user has management or finance role
  const userRoles = session.user.roles || []
  if (!userRoles.includes('management') && !userRoles.includes('finance')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      logoUrl,
      primaryColor,
      secondaryColor,
      defaultRetentionPercentage,
      defaultRetentionReleaseDays,
      defaultForecastMonths,
      digestFrequency,
      digestDay,
    } = body

    // Update organization
    await prisma.organization.update({
      where: { id: organizationId },
      data: { name },
    })

    // Update or create organization settings
    await prisma.organizationSettings.upsert({
      where: { organizationId },
      update: {
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        defaultRetentionPercentage: defaultRetentionPercentage || null,
        defaultRetentionReleaseDays: defaultRetentionReleaseDays || null,
        defaultForecastMonths: defaultForecastMonths || null,
        digestFrequency: digestFrequency || null,
        digestDay: digestDay || null,
      },
      create: {
        organizationId,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        defaultRetentionPercentage: defaultRetentionPercentage || null,
        defaultRetentionReleaseDays: defaultRetentionReleaseDays || null,
        defaultForecastMonths: defaultForecastMonths || null,
        digestFrequency: digestFrequency || null,
        digestDay: digestDay || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Organization settings updated successfully',
    })
  } catch (error) {
    console.error('Error updating organization settings:', error)
    return NextResponse.json({ 
      error: 'Failed to update organization settings',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
