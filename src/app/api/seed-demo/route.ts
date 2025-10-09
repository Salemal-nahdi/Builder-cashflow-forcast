import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    })

    if (existingUser) {
      return NextResponse.json({
        status: 'success',
        message: 'Demo user already exists',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name
        }
      })
    }

    // Create demo organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Demo Organization',
        settings: {}
      }
    })

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 12)
    const user = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        name: 'Demo Admin',
        password: hashedPassword,
        organizationId: organization.id
      }
    })

    // Create role assignment
    await prisma.roleAssignment.create({
      data: {
        userId: user.id,
        role: 'admin'
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Demo user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId
      }
    })

  } catch (error) {
    console.error('Seed demo error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create demo user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
