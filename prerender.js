// prerender.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Starting prerender...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // List of routes to prerender
  const routes = [
    '/blog/Fullstack-Authentication-Boilerplate',
    '/blog/crypto-tracker-article-s1',
    // Add more blog routes as needed
  ];

  const baseUrl = 'http://localhost:4200'; // Matches ng serve
  const distPath = path.join(__dirname, 'dist', 'dev-digest', 'browser');

  // Ensure dist/browser exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build first! dist/browser not found.');
    process.exit(1);
  }

  // Start a local server to serve the built app
  const server = require('http-server').createServer({
    root: distPath,
    cors: true
  });
  server.listen(4200);

  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer for server

  for (const route of routes) {
    const page = await browser.newPage();
    const url = `${baseUrl}${route}`;

    try {
      console.log(`🖨️  Rendering ${url}...`);

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 60000 // Increased timeout
      });

      // Wait for blog content with more robust checks
      try {
        await page.waitForSelector('#rendered-markdown', { 
          timeout: 30000,
          visible: true
        });
        // Additional check that content is actually loaded
        await page.waitForFunction(
          'document.querySelector("#rendered-markdown").innerText.length > 0',
          { timeout: 30000 }
        );
      } catch (err) {
        console.error(`⚠️ Could not find content for ${url}. Maybe the post doesn't exist?`);
        continue; // Skip to next route
      }

      const html = await page.content();

      // Create output path
      const outputPath = path.join(distPath, route.slice(1));
      fs.mkdirSync(outputPath, { recursive: true });
      fs.writeFileSync(path.join(outputPath, 'index.html'), html);

      console.log(`✅ Saved ${outputPath}/index.html`);
    } catch (err) {
      console.error(`❌ Failed to render ${url}:`, err.message);
    } finally {
      await page.close();
    }
  }

  server.close();
  await browser.close();
  console.log('🎉 Prerendering complete!');
})();
