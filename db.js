import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('tasks.db');

// Create table if it does not exist
db.exec(`CREATE TABLE IF NOT EXISTS tasks(
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     done INTEGER NOT NULL DEFAULT 0
    )`);

// Seed only if empty
const count = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;
if (count === 0) {
    const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    insert.run('Buy groceries', 0);
    insert.run('Finish assignment', 0);
    insert.run('Read a book', 0);
}

export default db;