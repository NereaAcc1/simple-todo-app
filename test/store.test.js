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
      assert.equal(setDone(todo.id, true, 'ana').done, true);
      assert.equal(setDone(todo.id, false, 'ana').done, false);
    });

    it('throws for an unknown id', () => {
      assert.throws(() => setDone(9999, true, 'ana'), /no todo with id 9999/);
    });

    it('refuses to touch a todo belonging to someone else', () => {
      const todo = addTodo('bo’s errand', 'bo');
      assert.throws(() => setDone(todo.id, true, 'ana'), /no todo with id/);
      assert.equal(getTodo(todo.id).done, false);
    });

    it('does not reveal that someone else’s id exists', () => {
      // Same message for "unknown" and "not yours": distinguishing them lets a
      // caller enumerate other people's ids.
      const todo = addTodo('bo’s errand', 'bo');
      let notYours;
      let unknown;
      try { setDone(todo.id, true, 'ana'); } catch (e) { notYours = e.message; }
      try { setDone(999999, true, 'ana'); } catch (e) { unknown = e.message; }
      assert.equal(notYours.replace(/\d+/, 'N'), unknown.replace(/\d+/, 'N'));
    });
  });

  describe('removeTodo', () => {
    it('removes an existing todo and reports it', () => {
      const todo = addTodo('temporary', 'ana');
      assert.equal(removeTodo(todo.id, 'ana'), true);
      assert.equal(getTodo(todo.id), undefined);
    });

    it('reports false for an id that was never there', () => {
      assert.equal(removeTodo(4242, 'ana'), false);
    });

    it('refuses to delete a todo belonging to someone else', () => {
      const todo = addTodo('bo’s errand', 'bo');
      assert.equal(removeTodo(todo.id, 'ana'), false);
      assert.equal(getTodo(todo.id).title, 'bo’s errand');
    });
  });
});
