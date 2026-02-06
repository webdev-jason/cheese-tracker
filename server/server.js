const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./cheese_factory.db', (err) => {
  if (err) console.error(err.message);
  else {
    console.log('Connected to SQLite.');
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
        console.log("Tables ready.");
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

// 3. GET Active Production Runs
app.get('/api/production', (req, res) => {
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

// 5. CREATE Finished Block
app.post('/api/blocks', (req, res) => {
    const { run_id, weight, serial_number } = req.body;
    db.run(`INSERT INTO finished_blocks (run_id, weight, serial_number) VALUES (?, ?, ?)`,
        [run_id, weight, serial_number],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "Block recorded", id: this.lastID });
    });
});

// 6. TRACEABILITY: UPSTREAM (Serial -> Ingredients)
app.get('/api/trace/:serial', (req, res) => {
    const serial = req.params.serial;
    const blockSql = `
        SELECT 
            b.serial_number, b.weight, b.status, 
            p.vat_number, p.run_date, p.id as run_id
        FROM finished_blocks b
        JOIN production_runs p ON b.run_id = p.id
        WHERE b.serial_number = ?
    `;

    db.get(blockSql, [serial], (err, block) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!block) return res.status(404).json({ error: "Block not found" });

        const ingredientsSql = `
            SELECT 
                r.name, r.lot_code, u.quantity_used
            FROM material_usage u
            JOIN raw_materials r ON u.material_id = r.id
            WHERE u.run_id = ?
        `;

        db.all(ingredientsSql, [block.run_id], (err, ingredients) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ block_info: block, ingredients: ingredients });
        });
    });
});

// 7. TRACEABILITY: DOWNSTREAM (Lot -> Blocks)
// This is the new endpoint for Recall Search
app.get('/api/trace-lot/:lot', (req, res) => {
    const lotCode = req.params.lot;

    const sql = `
        SELECT 
            m.name as material_name, 
            m.lot_code,
            p.vat_number, 
            p.run_date, 
            p.id as run_id,
            b.serial_number, 
            b.weight, 
            b.status
        FROM raw_materials m
        JOIN material_usage u ON m.id = u.material_id
        JOIN production_runs p ON u.run_id = p.id
        LEFT JOIN finished_blocks b ON p.id = b.run_id
        WHERE m.lot_code = ?
        ORDER BY p.run_date DESC, b.serial_number ASC
    `;

    db.all(sql, [lotCode], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ error: "Lot not found or not used in production yet." });

        const result = {
            material: rows[0].material_name,
            lot_code: rows[0].lot_code,
            runs: {}
        };

        rows.forEach(row => {
            if (!result.runs[row.vat_number]) {
                result.runs[row.vat_number] = {
                    date: row.run_date,
                    blocks: []
                };
            }
            if (row.serial_number) {
                result.runs[row.vat_number].blocks.push({
                    serial: row.serial_number,
                    weight: row.weight,
                    status: row.status
                });
            }
        });

        res.json(result);
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});