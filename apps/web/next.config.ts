import path from 'node:path';

import createNextIntlPlugin from 'next-intl/plugin';
import type {NextConfig} from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ['lucide-react', 'next-intl']
  },
  outputFileTracingRoot: path.join(__dirname, '..', '..')
};

export default withNextIntl(nextConfig);
