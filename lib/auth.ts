import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Plan } from '@prisma/client';
import jwt from 'jsonwebtoken';
import type { Adapter } from 'next-auth/adapters';
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { login, syncProfile } from '@/lib/api/auth';
import type { BackendUserProfile } from '@/lib/api/auth';
import {
  DEFAULT_PLAN,
  DEFAULT_ROLE,
  derivePlanFromRoles,
  normalizeRoles,
  type PlanName,
  type RoleName
} from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@example.com';
const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST ?? 'localhost';
const EMAIL_SERVER_PORT = Number.parseInt(process.env.EMAIL_SERVER_PORT ?? '587', 10);
const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER ?? '';
const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD ?? '';

async function ensureRolesExist(roles: RoleName[]) {
  await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role },
        update: {},
        create: { name: role }
      })
    )
  );
}

async function upsertUserFromBackend(user: BackendUserProfile) {
  const normalizedRoles = normalizeRoles(user.roles);
  const plan: PlanName = user.plan ?? derivePlanFromRoles(normalizedRoles, DEFAULT_PLAN);
  const prismaPlan = plan as Plan;

  await ensureRolesExist(normalizedRoles);

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      plan: prismaPlan,
      roles: {
        connect: normalizedRoles.map((role) => ({ name: role }))
      },
      profile: {
        create: {
          displayName: user.profile?.displayName ?? user.name ?? user.email,
          locale: user.profile?.locale ?? 'en',
          company: user.profile?.company ?? undefined,
          phone: user.profile?.phone ?? undefined
        }
      }
    },
    update: {
      email: user.email,
      name: user.name ?? undefined,
      plan: prismaPlan,
      roles: {
        set: [],
        connect: normalizedRoles.map((role) => ({ name: role }))
      },
      profile: {
        upsert: {
          update: {
            displayName: user.profile?.displayName ?? undefined,
            locale: user.profile?.locale ?? undefined,
            company: user.profile?.company ?? undefined,
            phone: user.profile?.phone ?? undefined
          },
          create: {
            displayName: user.profile?.displayName ?? user.name ?? user.email,
            locale: user.profile?.locale ?? 'en',
            company: user.profile?.company ?? undefined,
            phone: user.profile?.phone ?? undefined
          }
        }
      }
    }
  });
}

async function assignDefaultRole(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true }
  });

  if (!existing) return;
  if (existing.roles.length > 0) return;

  await ensureRolesExist([DEFAULT_ROLE]);

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: existing.plan ?? (DEFAULT_PLAN as Plan),
      roles: {
        connect: [{ name: DEFAULT_ROLE }]
      },
      profile: {
        upsert: {
          update: {},
          create: {
            displayName: existing.name ?? existing.email ?? 'New user'
          }
        }
      }
    }
  });
}

async function syncUserWithBackendService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      profile: true
    }
  });

  if (!user || !user.email) return;

  const serviceToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      plan: user.plan as PlanName,
      roles: Array.from(
        new Set<RoleName>([
          ...user.roles.map((role) => role.name as RoleName),
          'admin'
        ])
      )
    },
    process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'jwt-secret',
    { expiresIn: '5m' }
  );

  try {
    await syncProfile({
      userId: user.id,
      email: user.email,
      plan: user.plan as PlanName,
      roles: user.roles.map((role) => role.name as RoleName),
      profile: {
        displayName: user.profile?.displayName,
        locale: user.profile?.locale,
        company: user.profile?.company,
        phone: user.profile?.phone
      }
    }, { accessToken: serviceToken });
  } catch (error) {
    console.error('Failed to sync profile with backend', error);
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/en/login',
    signOut: '/en/login',
    error: '/en/login',
    verifyRequest: '/en/login'
  },
  providers: [
    EmailProvider({
      from: EMAIL_FROM,
      server: {
        host: EMAIL_SERVER_HOST,
        port: EMAIL_SERVER_PORT,
        auth: {
          user: EMAIL_SERVER_USER,
          pass: EMAIL_SERVER_PASSWORD
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const response = await login({
          email: credentials.email,
          password: credentials.password
        });

        if (!response?.user) {
          return null;
        }

        await upsertUserFromBackend(response.user);

        const authorizedUser: NextAuthUser = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          plan: response.user.plan,
          roles: response.user.roles
        };

        return authorizedUser;
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.id) {
        await assignDefaultRole(user.id);
        await syncUserWithBackendService(user.id);
      }
      return true;
    },
    async jwt({ token, trigger, user }) {
      if (user) {
        token.userId = user.id;
      }

      if (trigger === 'signIn' || trigger === 'update' || user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub ?? (user?.id as string | undefined) },
          include: { roles: true, profile: true }
        });

        if (dbUser) {
          token.plan = dbUser.plan as PlanName;
          token.roles = dbUser.roles.map((role) => role.name as RoleName);
          token.profileId = dbUser.profile?.id ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.plan = (token.plan as PlanName | undefined) ?? DEFAULT_PLAN;
        session.user.roles = normalizeRoles(token.roles as RoleName[] | undefined);
      }

      return session;
    }
  },
  events: {
    async createUser(message) {
      if (message.user.id) {
        await assignDefaultRole(message.user.id);
        await syncUserWithBackendService(message.user.id);
      }
    },
    async linkAccount(message) {
      const userId = message.user?.id;
      if (userId) {
        await syncUserWithBackendService(userId);
      }
    },
    async updateUser(message) {
      if (message.user?.id) {
        await syncUserWithBackendService(message.user.id);
      }
    }
  }
};

export type { PlanName, RoleName };
