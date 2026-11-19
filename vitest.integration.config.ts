import { defineConfig } from 'vitest/config'

// Integrasi terhadap Supabase lokal (`npx supabase start`). Bukan bagian test:unit.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
    fileParallelism: false,
  },
})
