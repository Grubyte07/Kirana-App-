const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '..', 'kirana_data.db')
  : path.join(__dirname, '..', 'kirana_data.db');

let db = null;

const getDb = () => {
  if (!db) throw new Error('Database not initialized');
  return db;
};

const initDB = async () => {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      shop_name TEXT DEFAULT 'My Kirana Store',
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      total_sales REAL NOT NULL DEFAULT 0,
      product_purchase REAL NOT NULL DEFAULT 0,
      other_expenses REAL NOT NULL DEFAULT 0,
      daily_profit REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  saveDB();
  console.log('SQLite database initialized');
  return db;
};

const saveDB = () => {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
};

const queryOne = (sql, params = []) => {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
};

const queryAll = (sql, params = []) => {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
};

const run = (sql, params = []) => {
  db.run(sql, params);
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
  const changes = db.getRowsModified();
  saveDB();
  return { lastInsertRowid: lastId, changes };
};

module.exports = { initDB, getDb, queryOne, queryAll, run, saveDB };
