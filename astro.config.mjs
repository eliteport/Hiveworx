// Hiveworx: static pages, plus the Keystatic editing screen (/keystatic), which runs on Vercel.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.hiveworx.com',
  output: 'static',
  adapter: vercel(),
  integrations: [react(), keystatic()],
  build: { format: 'directory' },
});
