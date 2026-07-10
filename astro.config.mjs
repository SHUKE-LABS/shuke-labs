// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Custom domain (public/CNAME = shukelabs.com) → keep base at '/'.
export default defineConfig({
  site: 'https://shukelabs.com',
  vite: {
    // `tailwindcss()` returns a vite.Plugin typed against @tailwindcss/vite's
    // bundled Vite 8, structurally incompatible with Astro's nested Vite 6
    // PluginOption (Plugin.hotUpdate/context shape changed across the major).
    // Runtime is unaffected — only the static types clash — so cast here rather
    // than force a dependency-tree Vite downgrade. Keeps `astro check` green.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
