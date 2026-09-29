import { defineConfig } from 'vite';
import { resolve } from 'path';

const BASE = '/orion/';
const PAGES = ['registration', 'profile', 'selection', 'members', 'inventory', 'finance', 'archive', 'log'];

/**
 * Clean page URLs for the dev and preview servers, mirroring nginx.conf:
 * /orion/<page> serves pages/<page>.html, and legacy /orion/pages/<page>[.html][/]
 * or trailing-slash URLs are 301-redirected to /orion/<page>.
 */
function cleanPageUrls() {
  const middleware = (req, res, next) => {
    const [path, query] = req.url.split('?');
    const qs = query ? `?${query}` : '';
    const legacy = path.match(/^\/orion\/pages\/([a-z-]+?)(\.html)?\/?$/);
    const trailing = path.match(/^\/orion\/([a-z-]+)\/$/);
    const redirectTo = legacy?.[1] ?? (trailing && PAGES.includes(trailing[1]) ? trailing[1] : null);
    if (redirectTo && PAGES.includes(redirectTo)) {
      res.statusCode = 301;
      res.setHeader('Location', `${BASE}${redirectTo}${qs}`);
      res.end();
      return;
    }
    const clean = path.match(/^\/orion\/([a-z-]+)$/);
    if (clean && PAGES.includes(clean[1])) {
      req.url = `${BASE}pages/${clean[1]}.html${qs}`;
    }
    next();
  };
  return {
    name: 'clean-page-urls',
    // Block bodies: a hook that returns a function is treated by Vite as a post-middleware hook
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [cleanPageUrls()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(PAGES.map((page) => [page, resolve(__dirname, `pages/${page}.html`)]))
      }
    }
  }
})
