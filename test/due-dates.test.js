import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatRelative, isOverdue, parseDueDate, sortByDue } from '../src/due-dates.js';

/** A fixed instant, so nothing here depends on when the suite runs. */
const NOW = new Date('2026-03-15T12:00:00.000Z');
const at = (iso) => new Date(iso);

describe('parseDueDate', () => {
  it('parses an ISO string', () => {
    assert.equal(parseDueDate('2026-03-20T09:30:00.000Z').toISOString(), '2026-03-20T09:30:00.000Z');
  });

  it('passes a Date through', () => {
    const date = at('2026-03-20T09:30:00.000Z');
    assert.equal(parseDueDate(date).getTime(), date.getTime());
  });

  it('returns null for an absent value', () => {
    assert.equal(parseDueDate(null), null);
    assert.equal(parseDueDate(undefined), null);
    assert.equal(parseDueDate(''), null);
  });

  it('returns null for an unparseable value rather than an Invalid Date', () => {
    assert.equal(parseDueDate('next tuesday'), null);
    assert.equal(parseDueDate('2026-02-30T00:00:61Z'), null);
    assert.equal(parseDueDate({}), null);
  });
});

describe('isOverdue', () => {
  it('is true for a date in the past', () => {
    assert.equal(isOverdue(at('2026-03-15T11:59:59.000Z'), NOW), true);
  });

  it('is false for a date in the future', () => {
    assert.equal(isOverdue(at('2026-03-15T12:00:01.000Z'), NOW), false);
  });

  it('treats the exact boundary as not yet overdue', () => {
    assert.equal(isOverdue(at('2026-03-15T12:00:00.000Z'), NOW), false);
  });

  it('is false when there is no due date', () => {
    assert.equal(isOverdue(null, NOW), false);
  });
});

describe('sortByDue', () => {
  it('puts the soonest due date first', () => {
    const todos = [
      { id: 1, dueDate: at('2026-03-20T00:00:00Z') },
      { id: 2, dueDate: at('2026-03-16T00:00:00Z') },
      { id: 3, dueDate: at('2026-03-18T00:00:00Z') }
    ];

    assert.deepEqual(
      sortByDue(todos).map((t) => t.id),
      [2, 3, 1]
    );
  });

  it('sorts undated todos last', () => {
    const todos = [
      { id: 1, dueDate: null },
      { id: 2, dueDate: at('2026-03-16T00:00:00Z') },
      { id: 3 }
    ];

    assert.deepEqual(
      sortByDue(todos).map((t) => t.id),
      [2, 1, 3]
    );
  });

  it('keeps the original order for equal due dates', () => {
    const same = at('2026-03-16T00:00:00Z');
    const todos = [
      { id: 1, dueDate: same },
      { id: 2, dueDate: same },
      { id: 3, dueDate: same }
    ];

    assert.deepEqual(
      sortByDue(todos).map((t) => t.id),
      [1, 2, 3]
    );
  });

  it('does not mutate the input', () => {
    const todos = [
      { id: 1, dueDate: at('2026-03-20T00:00:00Z') },
      { id: 2, dueDate: at('2026-03-16T00:00:00Z') }
    ];

    sortByDue(todos);
    assert.deepEqual(
      todos.map((t) => t.id),
      [1, 2]
    );
  });

  it('handles an empty list', () => {
    assert.deepEqual(sortByDue([]), []);
  });
});

describe('formatRelative', () => {
  it('describes a future date in the largest sensible unit', () => {
    assert.equal(formatRelative(at('2026-03-15T12:30:00Z'), NOW), 'due in 30 minutes');
    assert.equal(formatRelative(at('2026-03-15T15:00:00Z'), NOW), 'due in 3 hours');
    assert.equal(formatRelative(at('2026-03-20T12:00:00Z'), NOW), 'due in 5 days');
  });

  it('describes a past date as overdue', () => {
    assert.equal(formatRelative(at('2026-03-15T11:30:00Z'), NOW), '30 minutes overdue');
    assert.equal(formatRelative(at('2026-03-13T12:00:00Z'), NOW), '2 days overdue');
  });

  it('uses the singular for one unit', () => {
    assert.equal(formatRelative(at('2026-03-15T13:00:00Z'), NOW), 'due in 1 hour');
    assert.equal(formatRelative(at('2026-03-14T12:00:00Z'), NOW), '1 day overdue');
  });

  it('says "due now" at the boundary', () => {
    assert.equal(formatRelative(NOW, NOW), 'due now');
  });

  it('says so when there is no due date', () => {
    assert.equal(formatRelative(null, NOW), 'no due date');
  });
});
