// prerender.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

(async () => {
  console.log('🚀 Starting prerender...');

  const ANGULAR_PORT = 7202; 
  let ngServe;
  try {
    // Start Angular dev server with different port
    ngServe = exec(`npm run start -- --port ${ANGULAR_PORT}`, {
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    ngServe.stdout.on('data', data => console.log(`[Angular] ${data}`));
    ngServe.stderr.on('data', data => console.error(`[Angular Error] ${data}`));

    // Give Angular time to start
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Chrome configuration for different environments
    const chromeOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    // Only set executablePath if running on Netlify
    if (process.env.NETLIFY === 'true') {
      chromeOptions.executablePath = 
        process.env.PUPPETEER_EXECUTABLE_PATH || 
        '/opt/buildhome/.cache/puppeteer/chrome/linux-140.0.7339.82/chrome-linux64/chrome';
    }

    const browser = await puppeteer.launch(chromeOptions);

    const blogList = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'blog', 'list.json')));
    const routes = ['/'].concat(blogList.map(post => `/blog/${post.slug}`));
    const distPath = path.join(__dirname, 'dist', 'dev-digest', 'browser');

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
    if (ngServe) {
      ngServe.kill('SIGINT');
      console.log('🛑 Angular server stopped');
    }
    console.log('🎉 Prerendering complete!');
    process.exit(0);
  }
})();
