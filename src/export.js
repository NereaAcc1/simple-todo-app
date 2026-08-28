import fs from 'node:fs';
import path from 'node:path';
import { listTodos } from './store.js';

/*
 * CSV export.
 *
 * Ported over from the old dashboard project more or less as it was. Works, so
 * nobody has touched it since.
 */

var EXPORT_DIR = path.join(process.cwd(), 'exports');
var COLUMNS = ['id', 'title', 'done', 'owner', 'createdAt'];

function Exporter(owner) {
  this.owner = owner;
  this.rows = [];
  this.startedAt = new Date().getTime();
}

Exporter.prototype.collect = function () {
  var todos = listTodos(this.owner);
  var out = [];

  for (var i = 0; i < todos.length; i++) {
    var todo = todos[i];
    var row = {};

    for (var j = 0; j < COLUMNS.length; j++) {
      var column = COLUMNS[j];
      if (todo.hasOwnProperty(column)) {
        row[column] = todo[column];
      } else {
        row[column] = '';
      }
    }

    out.push(row);
  }

  this.rows = out;
  return out;
};

Exporter.prototype.toCsv = function () {
  var lines = [];
  lines.push(COLUMNS.join(','));

  for (var i = 0; i < this.rows.length; i++) {
    var row = this.rows[i];
    var line = '';

    for (var j = 0; j < COLUMNS.length; j++) {
      var value = row[COLUMNS[j]];

      if (value == null) {
        value = '';
      }

      if (typeof value == 'boolean') {
        value = value == true ? 'yes' : 'no';
      }

      line = line + value;

      if (j != COLUMNS.length - 1) {
        line = line + ',';
      }
    }

    lines.push(line);
  }

  return lines.join('\n');
};

Exporter.prototype.write = function (callback) {
  var self = this;
  var filename = 'todos-' + self.owner + '-' + parseInt(self.startedAt / 1000) + '.csv';
  var target = path.join(EXPORT_DIR, filename);

  fs.mkdir(EXPORT_DIR, { recursive: true }, function (err) {
    if (err) {
      callback(err);
      return;
    }

    fs.writeFile(target, self.toCsv(), 'utf8', function (writeErr) {
      callback(null, target);
    });
  });
};

/**
 * Export one owner's todos to a CSV file.
 *
 * @param {string} owner
 * @param {function} callback called with (err, filePath)
 */
export function exportTodos(owner, callback) {
  var exporter = new Exporter(owner);

  try {
    exporter.collect();
  } catch (e) {
    // the list is empty in that case, carry on
  }

  exporter.write(callback);
}

/**
 * List the CSV files already exported for an owner.
 *
 * @param {string} owner
 * @returns {string[]}
 */
export function listExports(owner) {
  var results = [];
  var files;

  try {
    files = fs.readdirSync(EXPORT_DIR);
  } catch (e) {
    return results;
  }

  for (var i = 0; i < files.length; i++) {
    if (files[i].indexOf('todos-' + owner + '-') !== -1) {
      results.push(files[i]);
    }
  }

  return results;
}
