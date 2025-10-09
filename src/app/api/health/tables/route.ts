import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if required tables exist by trying to query them
    const tables = {
      users: false,
      organizations: false,
      projects: false,
      milestones: false,
      supplierClaims: false,
      cashEvents: false,
    }

    try {
      await prisma.user.findFirst()
      tables.users = true
    } catch (e) {
      console.log('Users table not found or accessible')
    }

    try {
      await prisma.organization.findFirst()
      tables.organizations = true
    } catch (e) {
      console.log('Organizations table not found or accessible')
    }

    try {
      await prisma.project.findFirst()
      tables.projects = true
    } catch (e) {
      console.log('Projects table not found or accessible')
    }

    try {
      await prisma.milestone.findFirst()
      tables.milestones = true
    } catch (e) {
      console.log('Milestones table not found or accessible')
    }

    try {
      await prisma.supplierClaim.findFirst()
      tables.supplierClaims = true
    } catch (e) {
      console.log('SupplierClaims table not found or accessible')
    }

    try {
      await prisma.cashEvent.findFirst()
      tables.cashEvents = true
    } catch (e) {
      console.log('CashEvents table not found or accessible')
    }

    const allTablesExist = Object.values(tables).every(exists => exists)

    return NextResponse.json({
      status: allTablesExist ? 'healthy' : 'missing_tables',
      tables,
      message: allTablesExist 
        ? 'All required tables exist' 
        : 'Some tables are missing - migrations may be needed'
    })
  } catch (error) {
    console.error('Table health check error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      tables: {}
    }, { status: 500 })
  }
}
