import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Plan, Profile, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_PLAN,
  DEFAULT_ROLE,
  derivePlanFromRoles,
  normalizeRoles,
  type PlanName,
  type RoleName
} from '@/lib/rbac';
import type { BackendUserProfile, AuthTokens } from '@/lib/api/auth';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, ResetPasswordDto, SignupDto, SyncProfileDto } from './dto';

function mapUserToBackendProfile(
  user: User & { roles: Role[]; profile: Profile | null }
): BackendUserProfile {
  const roles = normalizeRoles(user.roles.map((role) => role.name as RoleName));
  const plan = (user.plan as PlanName | undefined) ?? derivePlanFromRoles(roles, DEFAULT_PLAN);

  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name,
    plan,
    roles,
    profile: user.profile
      ? {
          displayName: user.profile.displayName,
          locale: user.profile.locale,
          phone: user.profile.phone,
          company: user.profile.company
        }
      : null
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private async ensureRoles(roles: RoleName[]) {
    const normalized = normalizeRoles(roles.length ? roles : [DEFAULT_ROLE]);
    await Promise.all(
      normalized.map((role) =>
        this.prisma.role.upsert({
          where: { name: role },
          update: {},
          create: { name: role }
        })
      )
    );
    return normalized;
  }

  private async generateTokens(
    user: User & { roles: Role[] }
  ): Promise<AuthTokens> {
    const roles = normalizeRoles(user.roles.map((role) => role.name as RoleName));
    const payload = {
      sub: user.id,
      email: user.email ?? '',
      plan: (user.plan as PlanName | undefined) ?? derivePlanFromRoles(roles, DEFAULT_PLAN),
      roles
    } satisfies {
      sub: string;
      email: string;
      plan: PlanName;
      roles: RoleName[];
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET ?? 'jwt-secret'
    });

    return {
      accessToken
    } satisfies AuthTokens;
  }

  async signup(dto: SignupDto) {
    const roles = await this.ensureRoles([dto.plan]);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        plan: dto.plan as Plan,
        roles: {
          connect: roles.map((role) => ({ name: role }))
        },
        profile: {
          create: {
            displayName: dto.name,
            locale: dto.locale ?? 'en'
          }
        }
      },
      include: {
        roles: true,
        profile: true
      }
    });

    const tokens = await this.generateTokens(user);

    return {
      user: mapUserToBackendProfile(user),
      tokens
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: true,
        profile: true
      }
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: mapUserToBackendProfile(user),
      tokens
    };
  }

  async requestPasswordReset(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user) {
      // Avoid revealing if a user exists.
      return { success: true };
    }

    // Placeholder for integration with transactional email provider.
    return { success: true };
  }

  async syncProfile(dto: SyncProfileDto) {
    const normalizedRoles = await this.ensureRoles(dto.roles);
    const plan = derivePlanFromRoles(normalizedRoles, dto.plan ?? DEFAULT_PLAN);

    const user = await this.prisma.user.upsert({
      where: { id: dto.userId },
      create: {
        id: dto.userId,
        email: dto.email,
        plan: plan as Plan,
        roles: {
          connect: normalizedRoles.map((role) => ({ name: role }))
        },
        profile: dto.profile
          ? {
              create: {
                displayName: dto.profile.displayName ?? dto.email,
                locale: dto.profile.locale ?? 'en',
                phone: dto.profile.phone ?? undefined,
                company: dto.profile.company ?? undefined
              }
            }
          : undefined
      },
      update: {
        email: dto.email,
        plan: plan as Plan,
        roles: {
          set: [],
          connect: normalizedRoles.map((role) => ({ name: role }))
        },
        profile: dto.profile
          ? {
              upsert: {
                update: {
                  displayName: dto.profile.displayName ?? undefined,
                  locale: dto.profile.locale ?? undefined,
                  phone: dto.profile.phone ?? undefined,
                  company: dto.profile.company ?? undefined
                },
                create: {
                  displayName: dto.profile.displayName ?? dto.email,
                  locale: dto.profile.locale ?? 'en',
                  phone: dto.profile.phone ?? undefined,
                  company: dto.profile.company ?? undefined
                }
              }
            }
          : undefined
      },
      include: {
        roles: true,
        profile: true
      }
    });

    return {
      success: true,
      user: mapUserToBackendProfile(user)
    };
  }
}
