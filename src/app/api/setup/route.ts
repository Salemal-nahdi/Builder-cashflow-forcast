import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if setup is already done
    const existingOrg = await prisma.organization.findFirst()
    
    if (existingOrg) {
      return NextResponse.json({
        status: 'already_setup',
        message: 'App is already set up',
        organizationId: existingOrg.id
      })
    }

    // Create default organization
    const organization = await prisma.organization.create({
      data: {
        name: 'My Company',
        settings: {}
      }
    })

    // Create default user with simple password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const user = await prisma.user.create({
      data: {
        email: 'admin@company.com',
        name: 'Admin',
        password: hashedPassword,
        organizationId: organization.id
      }
    })

    // Create admin role
    await prisma.roleAssignment.create({
      data: {
        userId: user.id,
        role: 'admin'
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Setup complete! You can now sign in.',
      credentials: {
        email: 'admin@company.com',
        password: 'admin123'
      },
      organizationId: organization.id
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
