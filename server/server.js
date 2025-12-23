const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Initialize the Express App
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Initialization
const db = new sqlite3.Database('./cheese_factory.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
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

// 1. GET all raw materials
// This allows the frontend to display the list of inventory.
app.get('/api/materials', (req, res) => {
    const sql = "SELECT * FROM raw_materials ORDER BY received_date DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

// 2. ADD a new raw material
// This allows the frontend to save a new shipment of ingredients.
app.post('/api/materials', (req, res) => {
    const { name, lot_code, quantity, unit } = req.body;
    
    // SQL query to insert data
    const sql = `INSERT INTO raw_materials (name, lot_code, quantity, unit) VALUES (?, ?, ?, ?)`;
    const params = [name, lot_code, quantity, unit];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        // Send back the ID of the new item
        res.json({ 
            message: "Material added successfully",
            id: this.lastID 
        });
    });
});

// Basic Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Cheese Factory API is running...' });
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});