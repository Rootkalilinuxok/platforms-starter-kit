import axios from 'axios';

type RequestContext = {
  accessToken?: string;
};

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

export function withAuthHeaders(context?: RequestContext) {
  if (context?.accessToken) {
    return {
      headers: {
        Authorization: `Bearer ${context.accessToken}`
      }
    } as const;
  }

  return {} as const;
}

export interface ApiErrorShape {
  status: number;
  message: string;
  details?: unknown;
}

export function normalizeApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status ?? 500,
      message:
        (typeof error.response?.data === 'object' &&
          error.response?.data !== null &&
          'message' in error.response.data &&
          typeof (error.response.data as { message?: string }).message === 'string'
          ? (error.response.data as { message?: string }).message
          : error.message) || 'Unexpected error',
      details: error.response?.data
    } satisfies ApiErrorShape;
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message
    } satisfies ApiErrorShape;
  }

  return {
    status: 500,
    message: 'Unexpected error'
  } satisfies ApiErrorShape;
}
