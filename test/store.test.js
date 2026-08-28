import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { addTodo, getTodo, listTodos, removeTodo, reset, setDone } from '../src/store.js';

describe('store', () => {
  beforeEach(() => reset());

  describe('addTodo', () => {
    it('assigns sequential ids starting at 1', () => {
      assert.equal(addTodo('first', 'ana').id, 1);
      assert.equal(addTodo('second', 'ana').id, 2);
    });

    it('trims the title', () => {
      assert.equal(addTodo('  buy milk  ', 'ana').title, 'buy milk');
    });

    it('rejects an empty or whitespace-only title', () => {
      assert.throws(() => addTodo('', 'ana'), /must not be empty/);
      assert.throws(() => addTodo('   ', 'ana'), /must not be empty/);
    });

    it('rejects a title over 200 characters', () => {
      assert.throws(() => addTodo('x'.repeat(201), 'ana'), /200 characters/);
    });

    it('defaults an absent owner to anonymous', () => {
      assert.equal(addTodo('orphan').owner, 'anonymous');
    });

    it('stores a parsed due date', () => {
      const todo = addTodo('renew passport', 'ana', '2026-06-01T00:00:00.000Z');
      assert.equal(todo.dueDate.toISOString(), '2026-06-01T00:00:00.000Z');
    });

    it('stores null for an absent or unparseable due date', () => {
      assert.equal(addTodo('undated', 'ana').dueDate, null);
      assert.equal(addTodo('nonsense', 'ana', 'whenever').dueDate, null);
    });
  });

  describe('listTodos', () => {
    it('returns only the requested owner’s todos', () => {
      addTodo('ana one', 'ana');
      addTodo('bo one', 'bo');
      addTodo('ana two', 'ana');

      assert.deepEqual(
        listTodos('ana').map((t) => t.title),
        ['ana one', 'ana two']
      );
    });

    it('returns an empty array for an owner with nothing', () => {
      assert.deepEqual(listTodos('nobody'), []);
    });
  });

  describe('setDone', () => {
    it('flips the done flag', () => {
      const todo = addTodo('walk the dog', 'ana');
      assert.equal(setDone(todo.id, true).done, true);
      assert.equal(setDone(todo.id, false).done, false);
    });

    it('throws for an unknown id', () => {
      assert.throws(() => setDone(9999, true), /no todo with id 9999/);
    });
  });

  describe('removeTodo', () => {
    it('removes an existing todo and reports it', () => {
      const todo = addTodo('temporary', 'ana');
      assert.equal(removeTodo(todo.id), true);
      assert.equal(getTodo(todo.id), undefined);
    });

    it('reports false for an id that was never there', () => {
      assert.equal(removeTodo(4242), false);
    });
  });
});
