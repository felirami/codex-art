// SPDX-License-Identifier: MIT
// A loopback-only preview server with no dependencies. It serves only these
// public study files, so repository metadata and local configuration stay private.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const files = [
  'index.html',
  'styles.css',
  'studies/elon-ink/viewer.js',
  ...['nacre', 'elon-ink'].flatMap(study =>
    ['index.html', 'style.css', 'draw.js'].map(file => `studies/${study}/${file}`)
  ),
];
const routes = new Map(files.map(file => [`/${file}`, file]));
routes.set('/', 'index.html');
for (const study of ['nacre', 'elon-ink']) {
  routes.set(`/studies/${study}/`, `studies/${study}/index.html`);
}
const mime = { html: 'text/html', css: 'text/css', js: 'text/javascript' };
const port = Number(process.env.PORT ?? 8000);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT must be an integer from 0 to 65535.');
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed.');
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end('Invalid request.');
    return;
  }
  if (pathname === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }
  const file = routes.get(pathname);
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found.');
    return;
  }
  try {
    const data = await readFile(new URL(file, root));
    response.writeHead(200, {
      'Content-Type': `${mime[file.split('.').at(-1)]}; charset=utf-8`,
      'Content-Length': data.length,
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(500);
    response.end('Could not read the requested file.');
  }
});
server.on('error', error => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Codex Art: http://127.0.0.1:${server.address().port}/`);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close());
}
