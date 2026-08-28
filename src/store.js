/**
 * In-memory todo store.
 *
 * Deliberately dependency-free: the whole app runs on the Node standard
 * library so it can be cloned and run with no install step.
 */

let nextId = 1;

/** @type {Map<number, Todo>} */
const todos = new Map();

/**
 * @typedef {object} Todo
 * @property {number} id
 * @property {string} title
 * @property {boolean} done
 * @property {string} owner
 * @property {string} createdAt
 */

/**
 * Add a todo.
 *
 * @param {string} title
 * @param {string} owner
 * @returns {Todo}
 */
export function addTodo(title, owner) {
  const trimmed = String(title ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error('title must not be empty');
  }
  if (trimmed.length > 200) {
    throw new Error('title must be 200 characters or fewer');
  }

  const todo = {
    id: nextId++,
    title: trimmed,
    done: false,
    owner: String(owner ?? 'anonymous'),
    createdAt: new Date().toISOString()
  };
  todos.set(todo.id, todo);
  return todo;
}

/**
 * Look up a todo by id.
 *
 * @param {number} id
 * @returns {Todo | undefined}
 */
export function getTodo(id) {
  return todos.get(id);
}

/**
 * Every todo belonging to an owner, oldest first.
 *
 * @param {string} owner
 * @returns {Todo[]}
 */
export function listTodos(owner) {
  return [...todos.values()].filter((todo) => todo.owner === owner);
}

/**
 * Look up a todo the caller owns, or fail as though it did not exist.
 *
 * The error is identical whether the id is unknown or belongs to someone else.
 * Distinguishing the two lets a caller enumerate other people's ids by watching
 * which ones come back "forbidden" rather than "not found".
 *
 * @param {number} id
 * @param {string} owner
 * @returns {Todo}
 */
function requireOwned(id, owner) {
  const todo = todos.get(id);
  if (!todo || todo.owner !== owner) {
    throw new Error(`no todo with id ${id}`);
  }
  return todo;
}

/**
 * Mark a todo done or not done.
 *
 * `owner` is required, and checked here rather than only in the HTTP layer: the
 * store is the last place that can enforce it, and a second caller — a job, a
 * CLI, a future route — would otherwise bypass the check entirely.
 *
 * @param {number} id
 * @param {boolean} done
 * @param {string} owner
 * @returns {Todo}
 */
export function setDone(id, done, owner) {
  const todo = requireOwned(id, owner);
  todo.done = Boolean(done);
  return todo;
}

/**
 * Remove a todo the caller owns.
 *
 * @param {number} id
 * @param {string} owner
 * @returns {boolean} whether anything was removed
 */
export function removeTodo(id, owner) {
  const todo = todos.get(id);
  if (!todo || todo.owner !== owner) {
    return false;
  }
  return todos.delete(id);
}

/** Drops every todo. Used by tests to isolate cases. */
export function reset() {
  todos.clear();
  nextId = 1;
}
