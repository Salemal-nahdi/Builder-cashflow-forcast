import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // This endpoint will trigger Prisma to create tables if they don't exist
    // by attempting to query each table
    
    const results = {
      users: false,
      organizations: false,
      projects: false,
      milestones: false,
      supplierClaims: false,
      cashEvents: false,
      xeroAccounts: false,
      xeroContacts: false,
      xeroTrackingCategories: false,
    }

    // Try to query each table to see if it exists
    try {
      await prisma.user.findFirst()
      results.users = true
    } catch (e) {
      console.log('Users table not accessible:', e)
    }

    try {
      await prisma.organization.findFirst()
      results.organizations = true
    } catch (e) {
      console.log('Organizations table not accessible:', e)
    }

    try {
      await prisma.project.findFirst()
      results.projects = true
    } catch (e) {
      console.log('Projects table not accessible:', e)
    }

    try {
      await prisma.milestone.findFirst()
      results.milestones = true
    } catch (e) {
      console.log('Milestones table not accessible:', e)
    }

    try {
      await prisma.supplierClaim.findFirst()
      results.supplierClaims = true
    } catch (e) {
      console.log('SupplierClaims table not accessible:', e)
    }

    try {
      await prisma.cashEvent.findFirst()
      results.cashEvents = true
    } catch (e) {
      console.log('CashEvents table not accessible:', e)
    }

    try {
      await prisma.xeroAccount.findFirst()
      results.xeroAccounts = true
    } catch (e) {
      console.log('XeroAccounts table not accessible:', e)
    }

    try {
      await prisma.xeroContact.findFirst()
      results.xeroContacts = true
    } catch (e) {
      console.log('XeroContacts table not accessible:', e)
    }

    try {
      await prisma.xeroTrackingCategory.findFirst()
      results.xeroTrackingCategories = true
    } catch (e) {
      console.log('XeroTrackingCategories table not accessible:', e)
    }

    const allTablesExist = Object.values(results).every(exists => exists)

    return NextResponse.json({
      status: allTablesExist ? 'success' : 'partial',
      message: allTablesExist 
        ? 'All tables are accessible' 
        : 'Some tables are missing - migrations may be needed',
      tables: results,
      recommendation: allTablesExist 
        ? 'Database is ready'
        : 'Run: npx prisma db push --accept-data-loss'
    })
  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendation: 'Check database connection and run: npx prisma db push --accept-data-loss'
    }, { status: 500 })
  }
}
