import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StoredResponse<T = unknown> {
  status: number;
  body: T;
}

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async getCachedResponse<T>(key: string): Promise<StoredResponse<T> | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });
    if (!record?.response) {
      return null;
    }
    return record.response as StoredResponse<T>;
  }

  async persistResponse<T>(
    key: string,
    method: string,
    path: string,
    response: StoredResponse<T>,
  ): Promise<void> {
    await this.prisma.idempotencyKey.upsert({
      where: { key },
      create: {
        key,
        method,
        path,
        response,
      },
      update: {
        response,
      },
    });
  }
}
