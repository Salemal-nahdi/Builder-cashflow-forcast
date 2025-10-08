import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials')
            return null
          }

          // Check database connection first
          try {
            await prisma.$queryRaw`SELECT 1`
          } catch (dbError) {
            console.error('Database connection failed during auth:', dbError)
            throw new Error('Database connection failed. Please try again.')
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              organization: true,
              roleAssignments: true,
            },
          })

          if (!user || !user.password) {
            console.log('User not found or no password set')
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            console.log('Invalid password')
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId || '',
          }
        } catch (error) {
          console.error('Auth error:', error)
          // Don't return null for connection errors, let NextAuth handle it
          if (error instanceof Error && error.message.includes('Database connection failed')) {
            throw error
          }
          return null
        }
      }
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_USER,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        // Get user with organization and roles
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            organization: true,
            roleAssignments: true,
          },
        })
        if (user) {
          session.user.organizationId = user.organizationId || ''
          session.user.organization = user.organization || undefined
          session.user.roles = user.roleAssignments.map(ra => ra.role)
        }
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt',
  },
}
