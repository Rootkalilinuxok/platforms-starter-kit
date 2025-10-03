import fs from 'node:fs/promises';
import path from 'node:path';

async function resolveContentPath(relativePath: string): Promise<string> {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'content', relativePath),
    path.join(cwd, 'apps', 'web', 'content', relativePath)
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue checking next candidate
    }
  }

  return candidates[0];
}

export async function loadJsonContent<T>(relativePath: string): Promise<T> {
  const filePath = await resolveContentPath(relativePath);
  const file = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(file) as T;
}

export async function loadMdxContent(relativePath: string): Promise<string> {
  const filePath = await resolveContentPath(relativePath);
  return fs.readFile(filePath, 'utf-8');
}
