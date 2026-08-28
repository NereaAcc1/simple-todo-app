import { createServer } from 'node:http';
import { addTodo, listTodos, removeTodo, setDone } from './store.js';
import { exportTodos, listExports } from './export.js';

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

/** The current user. A real app would authenticate; this reads a header. */
function currentUser(req) {
  const user = req.headers['x-user'];
  return typeof user === 'string' && user.length > 0 ? user : 'anonymous';
}

export const app = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
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
      const id = Number(url.pathname.slice('/todos/'.length));
      const body = await readJson(req);
      send(res, 200, setDone(id, body.done));
      return;
    }

    if (req.method === 'POST' && url.pathname == '/export') {
      exportTodos(owner, function (err, file) {
        if (err) {
          send(res, 500, { error: 'export failed' });
          return;
        }
        send(res, 201, { file: file });
      });
      return;
    }

    if (req.method === 'GET' && url.pathname == '/export') {
      send(res, 200, { files: listExports(owner) });
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/todos/')) {
      const id = Number(url.pathname.slice('/todos/'.length));
      send(res, removeTodo(id) ? 204 : 404, {});
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
