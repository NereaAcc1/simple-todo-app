import { createServer } from 'node:http';
import { addTodo, listTodos, removeTodo, setDone } from './store.js';
import {
  createShare,
  fetchAvatar,
  filterShares,
  resolveShare,
  revokeShare
} from './share.js';

/**
 * Minimal HTTP layer over the todo store.
 *
 * Routing is hand-rolled rather than pulled from a framework so the repository
 * has no dependencies at all.
 */

const PORT = Number(process.env.PORT ?? 3000);

/** Reads a request body and parses it as JSON. */
async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) {
      throw new Error('request body too large');
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  });
  res.end(payload);
}

/**
 * Parse a todo id from a path segment.
 *
 * `Number('abc')` is NaN and `Number('')` is 0, either of which would reach the
 * store as a lookup key. Returns null for anything that is not a positive
 * integer so the caller can answer 404 instead.
 *
 * @param {string} segment
 * @returns {number | null}
 */
function parseId(segment) {
  if (!/^\d+$/.test(segment)) return null;
  const id = Number.parseInt(segment, 10);
  return id >= 1 ? id : null;
}

/** The current user. A real app would authenticate; this reads a header. */
function currentUser(req) {
  const user = req.headers['x-user'];
  return typeof user === 'string' && user.length > 0 ? user : 'anonymous';
}

export const app = createServer(async (req, res) => {
  // A fixed base, not `req.headers.host`: the header is attacker-controlled and
  // nothing here needs the real hostname — only the path and the query.
  const url = new URL(req.url ?? '/', 'http://localhost');
  const owner = currentUser(req);

  try {
    if (req.method === 'GET' && url.pathname === '/todos') {
      send(res, 200, listTodos(owner));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/todos') {
      const body = await readJson(req);
      send(res, 201, addTodo(body.title, owner));
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/todos/')) {
      const id = parseId(url.pathname.slice('/todos/'.length));
      if (id === null) {
        send(res, 404, { error: 'not found' });
        return;
      }
      const body = await readJson(req);
      send(res, 200, setDone(id, body.done, owner));
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/todos/')) {
      const id = parseId(url.pathname.slice('/todos/'.length));
      if (id === null) {
        send(res, 404, { error: 'not found' });
        return;
      }
      send(res, removeTodo(id, owner) ? 204 : 404, {});
      return;
    }

    if (req.method === 'POST' && url.pathname === '/shares') {
      const body = await readJson(req);
      send(res, 201, createShare(body.todoId, body.recipient, owner));
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/s/')) {
      const share = resolveShare(url.pathname.slice('/s/'.length));
      send(res, share ? 200 : 404, share ?? { error: 'not found' });
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/shares/')) {
      const token = url.pathname.slice('/shares/'.length);
      send(res, 200, { revoked: revokeShare(token, owner) });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/shares/search') {
      send(res, 200, filterShares(url.searchParams.get('q') ?? 'true'));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/avatar') {
      const image = await fetchAvatar(url.searchParams.get('url'));
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(image);
      return;
    }

    send(res, 404, { error: 'not found' });
  } catch (error) {
    send(res, 400, { error: error.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`simple-todo-app listening on http://localhost:${PORT}`);
  });
}
