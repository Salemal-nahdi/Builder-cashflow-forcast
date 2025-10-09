import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Test basic database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Test user lookup
    const testUser = await prisma.user.findFirst({
      where: { email: 'admin@demo.com' },
      include: {
        organization: true,
        roleAssignments: true,
      },
    })

    if (!testUser) {
      return NextResponse.json({
        status: 'error',
        message: 'Demo user not found',
        recommendation: 'Run database seeding'
      })
    }

    // Test password verification
    const isPasswordValid = await bcrypt.compare('demo123', testUser.password || '')
    
    return NextResponse.json({
      status: 'success',
      message: 'Authentication test passed',
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        organizationId: testUser.organizationId,
        hasPassword: !!testUser.password,
        passwordValid: isPasswordValid,
        organization: testUser.organization?.name
      }
    })

  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Authentication test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
