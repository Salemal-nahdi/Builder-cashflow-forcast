import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Temporarily disable adapter to avoid connection issues during session handling
  // adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Auth attempt:', credentials?.email)
        
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials')
            return null
          }

          console.log('Looking up user:', credentials.email)
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              organization: true,
              roleAssignments: true,
            },
          })

          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          if (!user.password) {
            console.log('User has no password set:', credentials.email)
            return null
          }

          console.log('Checking password for user:', user.email)
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            console.log('Invalid password for user:', user.email)
            return null
          }

          console.log('Authentication successful for user:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId || '',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        // Use token data instead of database calls to avoid connection issues
        session.user.organizationId = token.organizationId as string || ''
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id
        token.organizationId = user.organizationId
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
}
