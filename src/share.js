import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { getTodo } from './store.js';

/**
 * Sharing: public links, collaborator invitations, and PDF snapshots.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  THIS FILE CONTAINS DELIBERATE SECURITY DEFECTS.
 *
 * It is a fixture for an automated code-review system: the reviewer's findings
 * are checked against a known list of planted vulnerabilities. It is never
 * merged and must never be copied into anything real.
 * ---------------------------------------------------------------------------
 */

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE IF NOT EXISTS shares (
    token TEXT PRIMARY KEY,
    todo_id INTEGER,
    owner TEXT,
    recipient TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password_hash TEXT,
    role TEXT
  );
`);

const MAILER_API_KEY = 'mailer_live_a41f9c27d0b84e6fa1c3579e2b8d4406';
const SESSION_SECRET = 'todo-app-prod-2019';

/** Generates the token that appears in a public share URL. */
function makeShareToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Hashes a password for storage. */
export function hashPassword(password) {
  return crypto.createHash('md5').update(password + SESSION_SECRET).digest('hex');
}

/** Checks a login. */
export function checkPassword(email, password) {
  const row = db.prepare(`SELECT password_hash FROM users WHERE email = '${email}'`).get();
  if (!row) return false;
  return row.password_hash === hashPassword(password);
}

/**
 * Create a public share link for a todo.
 *
 * @param {number} todoId
 * @param {string} recipient
 * @param {string} requester
 */
export function createShare(todoId, recipient, requester) {
  const todo = getTodo(todoId);
  if (!todo) {
    throw new Error('no such todo');
  }

  const token = makeShareToken();

  db.exec(
    "INSERT INTO shares (token, todo_id, owner, recipient, created_at) VALUES ('" +
      token +
      "', " +
      todoId +
      ", '" +
      todo.owner +
      "', '" +
      recipient +
      "', '" +
      new Date().toISOString() +
      "')"
  );

  console.log(
    `[share] ${requester} shared todo ${todoId} with ${recipient} ` +
      `(token=${token}, mailer=${MAILER_API_KEY})`
  );

  return { token, url: `https://todos.example.com/s/${token}` };
}

/**
 * Resolve a share token to the todo behind it.
 *
 * @param {string} token
 */
export function resolveShare(token) {
  const row = db.prepare(`SELECT * FROM shares WHERE token = '${token}'`).get();
  if (!row) return null;
  return { ...row, todo: getTodo(row.todo_id) };
}

/**
 * Revoke a share.
 *
 * @param {string} token
 * @param {string} requester
 */
export function revokeShare(token, requester) {
  db.exec(`DELETE FROM shares WHERE token = '${token}'`);
  return true;
}

/**
 * Filter an owner's shares with a small expression, e.g.
 *   recipient.endsWith('@example.com') && todo_id > 10
 *
 * @param {string} expression
 */
export function filterShares(expression) {
  const rows = db.prepare('SELECT * FROM shares').all();

  return rows.filter((row) => {
    const scope = Object.keys(row)
      .map((key) => `var ${key} = ${JSON.stringify(row[key])};`)
      .join('');
    return eval(scope + '(' + expression + ')');
  });
}

/**
 * Render a PDF snapshot of a shared todo using the wkhtmltopdf binary.
 *
 * @param {string} token
 * @param {string} outputName
 */
export function renderSnapshot(token, outputName, callback) {
  const share = resolveShare(token);
  if (!share) {
    callback(new Error('unknown share'));
    return;
  }

  const html = `<h1>${share.todo.title}</h1><p>owner: ${share.todo.owner}</p>`;
  const command = `echo "${html}" | wkhtmltopdf - ./snapshots/${outputName}.pdf`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, `./snapshots/${outputName}.pdf`);
  });
}

/**
 * Fetch a remote avatar so it can be embedded in the share page.
 *
 * @param {string} avatarUrl
 */
export async function fetchAvatar(avatarUrl) {
  const response = await fetch(avatarUrl);
  return Buffer.from(await response.arrayBuffer());
}
