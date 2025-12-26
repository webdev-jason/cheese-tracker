const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./cheese_factory.db', (err) => {
  if (err) console.error('Error opening database:', err.message);
  else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});

function createTables() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS raw_materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, 
            lot_code TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            received_date TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS production_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_date TEXT NOT NULL,
            vat_number TEXT,
            notes TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS material_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            material_id INTEGER,
            quantity_used REAL,
            FOREIGN KEY(run_id) REFERENCES production_runs(id),
            FOREIGN KEY(material_id) REFERENCES raw_materials(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS finished_blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            serial_number TEXT UNIQUE NOT NULL,
            weight REAL,
            status TEXT DEFAULT 'Aging',
            FOREIGN KEY(run_id) REFERENCES production_runs(id)
        )`);
        console.log("Database tables checked/initialized.");
    });
}

// --- API ROUTES ---

// 1. GET Materials
app.get('/api/materials', (req, res) => {
    db.all("SELECT * FROM raw_materials ORDER BY received_date DESC", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: rows });
    });
});

// 2. ADD Material
app.post('/api/materials', (req, res) => {
    const { name, lot_code, quantity, unit } = req.body;
    db.run(`INSERT INTO raw_materials (name, lot_code, quantity, unit) VALUES (?, ?, ?, ?)`, 
        [name, lot_code, quantity, unit], 
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Material added", id: this.lastID });
    });
});

// 3. GET Production Runs (Active Vats)
// We need this so the "Weigh Station" knows which Vats are available.
app.get('/api/production', (req, res) => {
    // Get the last 10 runs (most recent first)
    db.all("SELECT * FROM production_runs ORDER BY id DESC LIMIT 10", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: rows });
    });
});

// 4. CREATE Production Run
app.post('/api/production', (req, res) => {
    const { run_date, vat_number, ingredients } = req.body;
    
    db.run(`INSERT INTO production_runs (run_date, vat_number) VALUES (?, ?)`, 
        [run_date, vat_number], 
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            const runId = this.lastID;

            if (ingredients && ingredients.length > 0) {
                const stmt = db.prepare(`INSERT INTO material_usage (run_id, material_id, quantity_used) VALUES (?, ?, ?)`);
                ingredients.forEach((ing) => stmt.run(runId, ing.id, ing.quantity));
                stmt.finalize();
            }
            res.json({ message: "Production Run started", run_id: runId });
    });
});

// 5. CREATE Finished Block (Weigh Station)
app.post('/api/blocks', (req, res) => {
    const { run_id, weight, serial_number } = req.body;
    
    db.run(`INSERT INTO finished_blocks (run_id, weight, serial_number) VALUES (?, ?, ?)`,
        [run_id, weight, serial_number],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Block recorded", id: this.lastID });
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});