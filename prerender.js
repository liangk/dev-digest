// prerender.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

(async () => {
  console.log('🚀 Starting prerender...');

  // Start Angular dev server
  const ngServe = exec('npm run start', {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  ngServe.stdout.on('data', data => console.log(`[Angular] ${data}`));
  ngServe.stderr.on('data', data => console.error(`[Angular Error] ${data}`));

  // Give Angular time to start
  await new Promise(resolve => setTimeout(resolve, 10000));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const blogList = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'blog', 'list.json')));
  const routes = blogList.map(post => `/blog/${post.slug}`);
  const distPath = path.join(__dirname, 'dist', 'dev-digest', 'browser');

  for (const route of routes) {
    const page = await browser.newPage();
    const url = `http://localhost:7201${route}`; // Note port change to 7201

    try {
      console.log(`🖨️  Rendering ${url}...`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 60000 
      });
      
      await page.waitForSelector('#rendered-markdown', { 
        timeout: 30000,
        visible: true 
      });
      
      const html = await page.content();
      const outputPath = path.join(distPath, route.slice(1));
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
  ngServe.kill();
  console.log('🎉 Prerendering complete!');
})();
