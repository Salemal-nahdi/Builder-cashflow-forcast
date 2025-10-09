import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Try to create a simple test record to see if tables exist
    const testResult = {
      connection: false,
      usersTable: false,
      organizationsTable: false,
      canCreateUser: false,
      error: null
    }

    // Test basic connection
    try {
      await prisma.$queryRaw`SELECT 1`
      testResult.connection = true
    } catch (e) {
      testResult.error = `Connection failed: ${e}`
      return NextResponse.json(testResult)
    }

    // Test if users table exists
    try {
      await prisma.user.findFirst()
      testResult.usersTable = true
    } catch (e) {
      testResult.error = `Users table error: ${e}`
    }

    // Test if organizations table exists
    try {
      await prisma.organization.findFirst()
      testResult.organizationsTable = true
    } catch (e) {
      testResult.error = `Organizations table error: ${e}`
    }

    // Try to create a test user (this will fail if tables don't exist)
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashedpassword',
          organization: {
            create: {
              name: 'Test Organization',
              settings: {}
            }
          }
        }
      })
      
      // Clean up the test data
      await prisma.user.delete({ where: { id: testUser.id } })
      await prisma.organization.delete({ where: { id: testUser.organizationId } })
      
      testResult.canCreateUser = true
    } catch (e) {
      testResult.error = `Cannot create user: ${e}`
    }

    return NextResponse.json({
      ...testResult,
      message: testResult.canCreateUser 
        ? 'Database is fully functional' 
        : 'Database tables may be missing - migrations needed'
    })

  } catch (error) {
    return NextResponse.json({
      connection: false,
      usersTable: false,
      organizationsTable: false,
      canCreateUser: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
