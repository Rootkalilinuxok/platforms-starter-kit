import type { AxiosResponse } from 'axios';
import { apiClient, normalizeApiError, withAuthHeaders } from './client';
import type { PlanName, RoleName } from '@/lib/rbac';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface BackendUserProfile {
  id: string;
  email: string;
  name?: string | null;
  plan: PlanName;
  roles: RoleName[];
  profile?: {
    displayName?: string | null;
    locale?: string | null;
    phone?: string | null;
    company?: string | null;
  } | null;
}

export interface AuthResponse {
  user: BackendUserProfile;
  tokens?: AuthTokens;
}

export interface SignupPayload {
  email: string;
  password: string;
  name?: string;
  locale?: string;
  plan?: PlanName;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PasswordResetPayload {
  email: string;
}

export interface SyncProfilePayload {
  userId: string;
  email: string;
  plan: PlanName;
  roles: RoleName[];
  profile?: {
    displayName?: string | null;
    locale?: string | null;
    phone?: string | null;
    company?: string | null;
  } | null;
}

async function unwrap<T>(promise: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  return unwrap(apiClient.post<AuthResponse>('/auth/signup', payload));
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return unwrap(apiClient.post<AuthResponse>('/auth/login', payload));
}

export async function requestPasswordReset(
  payload: PasswordResetPayload
): Promise<{ success: boolean }>
export async function requestPasswordReset(payload: PasswordResetPayload) {
  return unwrap(apiClient.post<{ success: boolean }>('/auth/reset', payload));
}

export async function syncProfile(
  payload: SyncProfilePayload,
  context?: { accessToken?: string }
) {
  return unwrap(
    apiClient.post<{ success: boolean }>(
      '/auth/sync',
      payload,
      withAuthHeaders(context)
    )
  );
}
