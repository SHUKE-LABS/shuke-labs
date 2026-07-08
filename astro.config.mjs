// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Custom domain (public/CNAME = shukelabs.com) → keep base at '/'.
export default defineConfig({
  site: 'https://shukelabs.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
