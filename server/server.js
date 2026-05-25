import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { deletePage, generateDraft, getPage, listOffers, listPages, savePage } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const port = Number(process.env.PORT || 4173);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(body);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

function matchPageAction(pathname) {
  const match = pathname.match(/^\/api\/pages\/([^/]+?)(?:\/(save))?$/);
  if (!match) return null;
  return { pageId: match[1], action: match[2] || 'detail' };
}

function matchOfferAction(pathname) {
  const match = pathname.match(/^\/api\/offers\/([^/]+?)\/generate-page$/);
  if (!match) return null;
  return { offerId: match[1] };
}

async function serveStatic(requestPath, response) {
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.join(frontendDir, safePath);
  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath);
    const contentType = extension === '.css'
      ? 'text/css; charset=utf-8'
      : extension === '.js'
        ? 'application/javascript; charset=utf-8'
        : 'text/html; charset=utf-8';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(file);
  } catch {
    sendText(response, 404, 'Not found');
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (request.method === 'GET' && pathname === '/api/offers') {
    return sendJson(response, 200, { offers: listOffers() });
  }

  if (request.method === 'GET' && pathname === '/api/pages') {
    const offerId = url.searchParams.get('offerId');
    return sendJson(response, 200, { pages: listPages({ offerId }) });
  }

  const pageMatch = matchPageAction(pathname);
  if (pageMatch && request.method === 'GET' && pageMatch.action === 'detail') {
    const page = getPage(pageMatch.pageId);
    if (!page) return sendJson(response, 404, { error: 'page_not_found' });
    return sendJson(response, 200, { page });
  }

  if (pageMatch && request.method === 'POST' && pageMatch.action === 'save') {
    const body = await readBody(request);
    if (!body) return sendJson(response, 400, { error: 'invalid_body' });
    const result = savePage(pageMatch.pageId, body);
    if (result?.error === 'invalid_html') return sendJson(response, 400, { error: 'invalid_html' });
    if (result?.error === 'offer_not_found') return sendJson(response, 404, { error: 'offer_not_found' });
    return sendJson(response, 200, result);
  }

  if (pageMatch && request.method === 'DELETE' && pageMatch.action === 'detail') {
    const page = deletePage(pageMatch.pageId);
    if (!page) return sendJson(response, 200, { page: null, deleted: false });
    return sendJson(response, 200, { page, deleted: true });
  }

  const offerMatch = matchOfferAction(pathname);
  if (offerMatch && request.method === 'POST') {
    const body = await readBody(request);
    if (!body) return sendJson(response, 400, { error: 'invalid_body' });
    const draft = generateDraft(offerMatch.offerId, body);
    if (!draft) return sendJson(response, 404, { error: 'offer_not_found' });
    return sendJson(response, 200, { draft, generated: true });
  }

  return serveStatic(pathname, response);
});

server.listen(port, () => {
  console.log(`LaunchFlow sandbox running at http://localhost:${port}`);
});
