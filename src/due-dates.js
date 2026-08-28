/**
 * Due-date handling for todos.
 *
 * Pure functions over an injected clock, so every case below — including
 * "overdue by one second" — is testable without waiting for a real one.
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Parse a due date from user input.
 *
 * Accepts an ISO 8601 string or a Date. Returns null for anything absent,
 * malformed, or not a real instant, so callers can treat "no due date" and
 * "unparseable due date" the same way without a try/catch at every call site.
 *
 * @param {unknown} input
 * @returns {Date | null}
 */
export function parseDueDate(input) {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  const date = input instanceof Date ? input : new Date(String(input));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Whether a due date has passed.
 *
 * A todo with no due date is never overdue. The boundary is exclusive: a todo
 * due exactly now is not yet overdue.
 *
 * @param {Date | null} dueDate
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isOverdue(dueDate, now = new Date()) {
  if (dueDate === null) return false;
  return dueDate.getTime() < now.getTime();
}

/**
 * Sort todos by due date, soonest first.
 *
 * Todos with no due date sort last — an undated todo is not urgent, and putting
 * them first would bury the ones that are. Ties keep their original order.
 *
 * @template {{ dueDate?: Date | null }} T
 * @param {readonly T[]} todos
 * @returns {T[]} a new array; the input is not mutated
 */
export function sortByDue(todos) {
  return [...todos].sort((a, b) => {
    const aTime = a.dueDate ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.dueDate ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

/**
 * Describe a due date relative to now, for display.
 *
 * @param {Date | null} dueDate
 * @param {Date} [now]
 * @returns {string}
 */
export function formatRelative(dueDate, now = new Date()) {
  if (dueDate === null) return 'no due date';

  const deltaMs = dueDate.getTime() - now.getTime();
  const overdue = deltaMs < 0;
  const magnitude = Math.abs(deltaMs);

  const [value, unit] =
    magnitude < MS_PER_HOUR
      ? [Math.round(magnitude / MS_PER_MINUTE), 'minute']
      : magnitude < MS_PER_DAY
        ? [Math.round(magnitude / MS_PER_HOUR), 'hour']
        : [Math.round(magnitude / MS_PER_DAY), 'day'];

  if (value === 0) return 'due now';

  const plural = value === 1 ? unit : `${unit}s`;
  return overdue ? `${value} ${plural} overdue` : `due in ${value} ${plural}`;
}
