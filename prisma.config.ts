import { defineConfig } from '@prisma/cli';

export default defineConfig({
  datasources: {
    db: {
      provider: 'sqlite',
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },
  generators: {
    client: {
      provider: 'prisma-client-js',
    },
  },
});
