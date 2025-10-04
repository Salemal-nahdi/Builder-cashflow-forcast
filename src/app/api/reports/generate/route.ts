import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReportGenerator } from '@/lib/report-generator'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = session.user.organizationId

  try {
    const body = await request.json()
    const { type, format, projectIds, dateRange, includeCharts } = body

    // Create report job record
    const reportJob = await prisma.reportJob.create({
      data: {
        organizationId,
        type,
        format,
        parameters: {
          projectIds,
          dateRange,
          includeCharts,
        },
        status: 'pending',
      },
    })

    // Generate report in background
    const reportGenerator = new ReportGenerator(organizationId)
    const result = await reportGenerator.generateReport({
      type,
      format,
      projectIds,
      dateRange,
      includeCharts,
    })

    // Update report job with result
    await prisma.reportJob.update({
      where: { id: reportJob.id },
      data: {
        status: result.success ? 'completed' : 'failed',
        fileUrl: result.fileUrl,
        errorMessage: result.error,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: result.success,
      reportId: reportJob.id,
      fileUrl: result.fileUrl,
      error: result.error,
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ 
      error: 'Report generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
