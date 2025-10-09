import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST() {
  try {
    console.log('🚀 Running Prisma migrations...')
    
    // Run prisma db push to create tables
    try {
      execSync('npx prisma db push --accept-data-loss', { 
        stdio: 'pipe',
        env: process.env 
      })
      console.log('✅ Database schema pushed successfully')
    } catch (error) {
      console.error('❌ Database push failed:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Database push failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // Generate Prisma client
    try {
      execSync('npx prisma generate', { 
        stdio: 'pipe',
        env: process.env 
      })
      console.log('✅ Prisma client generated successfully')
    } catch (error) {
      console.error('❌ Prisma generate failed:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Prisma client generation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Migrations completed successfully! Database tables should now be created.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
