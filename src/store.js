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
 * Mark a todo done or not done.
 *
 * @param {number} id
 * @param {boolean} done
 * @returns {Todo}
 */
export function setDone(id, done) {
  const todo = todos.get(id);
  if (!todo) {
    throw new Error(`no todo with id ${id}`);
  }
  todo.done = Boolean(done);
  return todo;
}

/**
 * Remove a todo.
 *
 * @param {number} id
 * @returns {boolean} whether anything was removed
 */
export function removeTodo(id) {
  return todos.delete(id);
}

/** Drops every todo. Used by tests to isolate cases. */
export function reset() {
  todos.clear();
  nextId = 1;
}
