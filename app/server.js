// Dependency-free demo app under test: a small support-ticket tracker.
// State is held per "board" so parallel tests never share data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const PRIORITIES = ['low', 'medium', 'high'];
const boards = new Map();
const ticketsFor = (board) => {
  if (!boards.has(board)) boards.set(board, []);
  return boards.get(board);
};

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
  });

const validate = (input) => {
  const errors = {};
  if (typeof input.title !== 'string' || input.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }
  if (!PRIORITIES.includes(input.priority)) {
    errors.priority = `Priority must be one of: ${PRIORITIES.join(', ')}.`;
  }
  return errors;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const board = req.headers['x-board'] || url.searchParams.get('board') || 'default';

  if (url.pathname === '/api/health') return send(res, 200, { status: 'ok' });

  if (url.pathname === '/api/tickets' && req.method === 'GET') {
    const status = url.searchParams.get('status');
    const all = ticketsFor(board);
    return send(res, 200, status ? all.filter((t) => t.status === status) : all);
  }

  if (url.pathname === '/api/tickets' && req.method === 'POST') {
    let input;
    try {
      input = await readJson(req);
    } catch {
      return send(res, 400, { errors: { body: 'Body must be valid JSON.' } });
    }
    const errors = validate(input);
    if (Object.keys(errors).length) return send(res, 422, { errors });
    const ticket = { id: randomUUID(), title: input.title.trim(), priority: input.priority, status: 'open' };
    ticketsFor(board).push(ticket);
    return send(res, 201, ticket);
  }

  const match = url.pathname.match(/^\/api\/tickets\/([\w-]+)$/);
  if (match) {
    const tickets = ticketsFor(board);
    const index = tickets.findIndex((t) => t.id === match[1]);
    if (index === -1) return send(res, 404, { error: 'Ticket not found.' });
    if (req.method === 'PATCH') {
      const input = await readJson(req).catch(() => ({}));
      if (!['open', 'closed'].includes(input.status)) {
        return send(res, 422, { errors: { status: 'Status must be open or closed.' } });
      }
      tickets[index].status = input.status;
      return send(res, 200, tickets[index]);
    }
    if (req.method === 'DELETE') {
      tickets.splice(index, 1);
      return send(res, 204);
    }
    return send(res, 405, { error: 'Method not allowed.' });
  }

  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
  return send(res, 404, { error: 'Not found.' });
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () => console.log(`Demo app on http://127.0.0.1:${port}`));
