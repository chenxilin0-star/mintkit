import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

/**
 * Google OAuth Configuration
 * 
 * Before deploying, you need to:
 * 1. Create a project in Google Cloud Console (https://console.cloud.google.com)
 * 2. Enable the Google+ API
 * 3. Go to "APIs & Services" > "Credentials" and create an OAuth 2.0 Client ID
 *    - Application type: Web application
 *    - Add Authorized redirect URI: https://mintkit.cxlvip.com/api/auth/callback/google
 * 4. Copy the Client ID and Client Secret
 * 5. Generate NEXTAUTH_SECRET: openssl rand -base64 32
 * 6. Set the following environment variables in Vercel:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - NEXTAUTH_URL=https://mintkit.cxlvip.com
 *    - NEXTAUTH_SECRET=<generated value>
 */

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/", // Use the homepage as the sign-in page
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
})

export { handler as GET, handler as POST }
