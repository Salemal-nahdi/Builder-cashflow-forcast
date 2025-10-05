import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      organizationId: string
      organization?: {
        id: string
        name: string
      }
      roles?: string[]
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    organizationId: string
  }
}
