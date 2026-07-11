---
name: screenshot
description: Take a browser screenshot of any URL using Playwright. Use this skill whenever you need to visually inspect a web page, verify UI changes, check layout or styling, debug frontend issues, or see what a running dev server looks like. Also trigger when the user asks "what does it look like", "show me the page", "check the UI", or mentions screenshots, visual testing, or browser preview. Works with any localhost or remote URL.
---

# Screenshot with Playwright

Capture a visual screenshot of a web page using Playwright (installed globally via pnpm). After capturing, read the image file to visually inspect it.

## Setup

Playwright is installed globally. All commands require the `NODE_PATH` prefix:

```bash
NODE_PATH=$(pnpm root -g)
```

Screenshots are saved to `/tmp/pw-screenshots/` (auto-created).

## Instructions

### 1. Take a screenshot

```bash
NODE_PATH=$(pnpm root -g) node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('URL_HERE', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: '/tmp/pw-screenshots/screenshot.png', fullPage: false });
  await browser.close();
  console.log('done');
})();
"
```

Replace `URL_HERE` with the target URL. Common defaults:
- If the user is working on a project with a dev server, check if one is running (e.g., `curl -s http://localhost:PORT | head -5`) and use that URL.
- If no URL is specified, ask the user.

### 2. Viewport options

- **Desktop (default):** `{ width: 1440, height: 900 }`
- **Mobile:** `{ width: 375, height: 812 }`
- **Tablet:** `{ width: 768, height: 1024 }`

Use mobile/tablet when the user mentions responsive, mobile, or tablet views.

### 3. Full page capture

Add `fullPage: true` to the screenshot options when the user wants the entire scrollable page, not just the viewport.

### 4. Click before screenshot

If the user wants to see the state after clicking an element:

```bash
await page.goto('URL', { waitUntil: 'networkidle' });
await page.click('CSS_SELECTOR');
await page.waitForTimeout(500);
await page.screenshot({ path: '...' });
```

### 5. Type into a field

```bash
await page.goto('URL', { waitUntil: 'networkidle' });
await page.fill('CSS_SELECTOR', 'text to type');
await page.waitForTimeout(300);
await page.screenshot({ path: '...' });
```

### 6. Read the screenshot

After saving, use the Read tool to view the image file. This lets you visually inspect the page content, layout, colors, and any UI issues.

## Tips

- Always wait for `networkidle` to ensure dynamic content is loaded
- Use `waitForTimeout(500)` after interactions to let animations settle
- If the page fails to load, check if the dev server is running first
- For debugging, use `evaluate` to run JS in the page context:

```bash
NODE_PATH=$(pnpm root -g) node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('URL', { waitUntil: 'networkidle' });
  const result = await page.evaluate(() => document.title);
  console.log(result);
  await browser.close();
})();
"
```
