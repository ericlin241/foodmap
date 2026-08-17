import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Vite Plugin to provide local /api/preview and /api/resolve-maps during "npm run dev"
function localApiPlugin(): Plugin {
  return {
    name: 'local-api-endpoints',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. Local /api/preview endpoint (Linklook style OpenGraph Scraper)
        if (req.url.startsWith('/api/preview')) {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'url required' }));
            return;
          }

          try {
            // Direct Image URL
            if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(targetUrl)) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, image: targetUrl }));
              return;
            }

            // YouTube Thumbnail
            const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            if (ytMatch && ytMatch[1]) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, image: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` }));
              return;
            }

            // Fetch HTML with Linklook scraper user-agent
            const fetchRes = await fetch(targetUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Mozilla/5.0 (compatible; LinklookPreview/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
              },
            });

            const finalUrl = fetchRes.url || targetUrl;
            const html = await fetchRes.text();

            let ogImage = '';
            let ogTitle = '';
            let ogDescription = '';

            const imgMatch =
              html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
              html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i) ||
              html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]+name=["']thumbnail["'][^>]+content=["']([^"']+)["']/i);

            if (imgMatch && imgMatch[1]) {
              ogImage = imgMatch[1].trim();
              if (ogImage.startsWith('/') && !ogImage.startsWith('//')) {
                const parsedBase = new URL(finalUrl);
                ogImage = `${parsedBase.origin}${ogImage}`;
              } else if (ogImage.startsWith('//')) {
                ogImage = `https:${ogImage}`;
              }
            }

            const titleMatch =
              html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) ogTitle = titleMatch[1].trim();

            const descMatch =
              html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
            if (descMatch && descMatch[1]) ogDescription = descMatch[1].trim();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, image: ogImage, title: ogTitle, description: ogDescription, finalUrl }));
            return;
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
            return;
          }
        }

        // 2. Local /api/resolve-maps endpoint
        if (req.url.startsWith('/api/resolve-maps')) {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'url required' }));
            return;
          }

          try {
            const fetchRes = await fetch(targetUrl, {
              method: 'GET',
              redirect: 'follow',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });

            const finalUrl = fetchRes.url || targetUrl;
            const text = await fetchRes.text();

            let lat: number | null = null;
            let lng: number | null = null;

            const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (atMatch) {
              lat = parseFloat(atMatch[1]);
              lng = parseFloat(atMatch[2]);
            } else {
              const dMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
              if (dMatch) {
                lat = parseFloat(dMatch[1]);
                lng = parseFloat(dMatch[2]);
              }
            }

            if (!lat || !lng) {
              const htmlCoordMatch = text.match(/\[null,null,(-?\d{1,2}\.\d{4,8}),(-?\d{2,3}\.\d{4,8})\]/);
              if (htmlCoordMatch) {
                lat = parseFloat(htmlCoordMatch[1]);
                lng = parseFloat(htmlCoordMatch[2]);
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, latitude: lat, longitude: lng, finalUrl }));
            return;
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: '/foodmap/',
  plugins: [react(), localApiPlugin()],
  server: {
    port: 3000,
    open: false,
  },
});
