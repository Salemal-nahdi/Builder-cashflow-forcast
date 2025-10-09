import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/prisma'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection()
    
    if (!isConnected) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }

    // Check if tables exist
    const tableChecks = {
      users: false,
      organizations: false,
      projects: false,
      milestones: false,
      supplierClaims: false,
      cashEvents: false,
    }

    try {
      await prisma.user.findFirst()
      tableChecks.users = true
    } catch (e) {
      console.log('Users table not accessible')
    }

    try {
      await prisma.organization.findFirst()
      tableChecks.organizations = true
    } catch (e) {
      console.log('Organizations table not accessible')
    }

    try {
      await prisma.project.findFirst()
      tableChecks.projects = true
    } catch (e) {
      console.log('Projects table not accessible')
    }

    try {
      await prisma.milestone.findFirst()
      tableChecks.milestones = true
    } catch (e) {
      console.log('Milestones table not accessible')
    }

    try {
      await prisma.supplierClaim.findFirst()
      tableChecks.supplierClaims = true
    } catch (e) {
      console.log('SupplierClaims table not accessible')
    }

    try {
      await prisma.cashEvent.findFirst()
      tableChecks.cashEvents = true
    } catch (e) {
      console.log('CashEvents table not accessible')
    }

    const allTablesExist = Object.values(tableChecks).every(exists => exists)

    return NextResponse.json({
      status: allTablesExist ? 'healthy' : 'partial',
      database: 'connected',
      tables: tableChecks,
      allTablesExist,
      message: allTablesExist 
        ? 'Database is fully functional' 
        : 'Some tables are missing - migrations may be needed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      status: 'error',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
