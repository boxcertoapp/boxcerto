import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm.cmd run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://e2e.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
    },
  },
})
