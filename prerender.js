// prerender.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const url = require('url');

(async () => {
  console.log('🚀 Starting prerender...');
  const ANGULAR_PORT = 7202;
  let server;
  try {
    // Serve the built app statically from dist using a tiny built-in server
    const distPath = path.join(__dirname, 'dist', 'dev-digest', 'browser');

    const contentType = (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case '.html': return 'text/html';
        case '.js': return 'application/javascript';
        case '.css': return 'text/css';
        case '.json': return 'application/json';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.svg': return 'image/svg+xml';
        case '.ico': return 'image/x-icon';
        case '.webp': return 'image/webp';
        default: return 'application/octet-stream';
      }
    };

    server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url);
      let pathname = decodeURIComponent(parsedUrl.pathname || '/');

      // Prevent directory traversal
      pathname = pathname.replace(/\\/g, '/');
      if (pathname.includes('..')) pathname = '/';

      let filePath = path.join(distPath, pathname);

      fs.stat(filePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }

        fs.readFile(filePath, (readErr, data) => {
          if (readErr) {
            // SPA fallback to index.html
            const fallback = path.join(distPath, 'index.html');
            fs.readFile(fallback, (fallbackErr, fallbackData) => {
              if (fallbackErr) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
                return;
              }
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fallbackData);
            });
            return;
          }
          res.writeHead(200, { 'Content-Type': contentType(filePath) });
          res.end(data);
        });
      });
    });

    await new Promise((resolve, reject) => {
      server.on('error', reject);
      server.listen(ANGULAR_PORT, () => {
        console.log(`📦 Static server running at http://localhost:${ANGULAR_PORT}`);
        resolve();
      });
    });

    // Simplified Netlify configuration
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: puppeteer.executablePath(),
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
    if (server) {
      await new Promise((resolve) => server.close(() => resolve()));
      console.log('🛑 Static server stopped');
    }
    console.log('🎉 Prerendering complete!');
    process.exit(0);
  }
})();
