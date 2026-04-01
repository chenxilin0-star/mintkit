import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { getOrCreateUser } from "@/lib/db"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user }: { user: any }) {
      // Ensure user exists in D1 immediately on login
      // This prevents FK errors when later writing subscriptions
      if (user?.id) {
        try {
          await getOrCreateUser(
            user.id,
            user.email || '',
            user.name || null,
            user.image || null
          );
        } catch (err) {
          console.error('[NextAuth signIn] Failed to ensure user in D1:', err);
          // Don't block login — the user can still use the app
        }
      }
      return true;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account }: { token: any; account: any }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
