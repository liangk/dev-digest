// prerender.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Starting prerender...');

  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction 
    ? 'http://localhost:4200' // Netlify will use the built files
    : 'http://localhost:4200';
    
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Get routes from list.json
  const blogList = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'blog', 'list.json')));
  const routes = blogList.map(post => `/blog/${post.slug}`);

  const distPath = path.join(__dirname, 'dist', 'dev-digest', 'browser');

  // Ensure dist/browser exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build first! dist/dev-digest/browser not found.');
    process.exit(1);
  }

  // Start a local server to serve the built app
  const server = require('http-server').createServer({
    root: distPath,
    cors: true
  });
  server.listen(4200);

  await new Promise(resolve => setTimeout(resolve, 3000));

  for (const route of routes) {
    const page = await browser.newPage();
    const url = `${baseUrl}${route}`;

    try {
      console.log(`🖨️  Rendering ${url}...`);

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      try {
        await page.waitForSelector('#rendered-markdown', { 
          timeout: 30000,
          visible: true
        });
        
        // Additional checks for production
        if (isProduction) {
          await page.waitForFunction(
            'document.querySelector("#rendered-markdown").innerText.length > 0',
            { timeout: 30000 }
          );
        }
      } catch (err) {
        console.error(`⚠️ Could not find content for ${url}. Details:`, err.message);
        continue;
      }

      const html = await page.content();
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
