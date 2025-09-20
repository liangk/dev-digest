// prerender.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

(async () => {
  console.log('🚀 Starting prerender...');
  const ANGULAR_PORT = 7202;
  let staticServer;
  try {
    // Serve the built app statically from dist instead of running ng serve
    const distPath = path.join(__dirname, 'dist', 'dev-digest', 'browser');
    staticServer = exec(`npx serve -l ${ANGULAR_PORT} "${distPath}" --single`, {
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    staticServer.stdout?.on('data', data => console.log(`[Static] ${data}`));
    staticServer.stderr?.on('data', data => console.error(`[Static Error] ${data}`));

    // Give the static server a moment to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Simplified Netlify configuration
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const blogList = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'blog', 'list.json')));
    const routes = ['/'].concat(blogList.map(post => `/blog/${post.slug}`));

    for (const route of routes) {
      const page = await browser.newPage();
      const url = `http://localhost:${ANGULAR_PORT}${route}`;

      try {
        console.log(`🖨️  Rendering ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        const selector = route === '/' ? '.post_list' : '#rendered-markdown';
        await page.waitForSelector(selector, { timeout: 30000, visible: true });
        
        const html = await page.content();
        const outputPath = route === '/' ? distPath : path.join(distPath, route.slice(1));
        fs.mkdirSync(outputPath, { recursive: true });
        fs.writeFileSync(path.join(outputPath, 'index.html'), html);
        console.log(`✅ Saved ${outputPath}/index.html`);
      } catch (err) {
        console.error(`⚠️ Failed to render ${url}:`, err.message);
      } finally {
        await page.close();
      }
    }

    await browser.close();
  } catch (err) {
    console.error('❌ Prerender failed:', err);
    process.exit(1);
  } finally {
    if (staticServer) {
      staticServer.kill('SIGINT');
      console.log('🛑 Static server stopped');
    }
    console.log('🎉 Prerendering complete!');
    process.exit(0);
  }
})();
